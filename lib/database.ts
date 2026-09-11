import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { type Product, type RoutineLog, type Period, localDate, defaultSettings, type RoutineSettings } from './model';
import { seedProducts } from './seed';
import { updateCabinet } from './cabinet-update';
import { guideFor } from './product-guidance';
import { generateRoutine } from './engine';
import { routineTime, validDate } from './dates';
import { finishLog, snapshot, swapChoices, undoRoutineAction } from './routine-actions';
import { type Backup, type AppData, validateBackup, makeBackup } from './backup';
interface Schema extends DBSchema {
  settings: { key: string; value: RoutineSettings };
  meta: { key: string; value: { id: string; initializedAt?: string; backup?: Backup } };
  products: { key: string; value: Product };
  routines: { key: string; value: RoutineLog; indexes: { date: string } };
}
let connection: Promise<IDBPDatabase<Schema>> | undefined;
export function database() {
  // Never open IndexedDB during module evaluation or server rendering.
  if (!connection) connection = openDB<Schema>('skin-ritual', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) { db.createObjectStore('products', { keyPath: 'id' }); db.createObjectStore('routines', { keyPath: 'id' }).createIndex('date', 'date'); }
      if (oldVersion < 2) { db.createObjectStore('meta', { keyPath: 'id' }); db.createObjectStore('settings', { keyPath: 'id' }); }
    },
    blocking() { void connection?.then(db => db.close()); connection = undefined; },
    terminated() { connection = undefined; },
  }).catch(error => { connection = undefined; throw error; });
  return connection;
}
export async function initializeCabinet() {
  const db = await database();
  const tx = db.transaction(['meta', 'products', 'routines', 'settings'], 'readwrite');
  if (!await tx.objectStore('meta').get('initialized')) {
    // Legacy cabinets with any product or routine are adopted, never merged or replaced.
    if (await tx.objectStore('products').count() === 0 && await tx.objectStore('routines').count() === 0) {
      for (const product of seedProducts()) await tx.objectStore('products').put(product);
    }
    await tx.objectStore('meta').put({ id: 'initialized', initializedAt: new Date().toISOString() });
    if (!await tx.objectStore('settings').get('routine')) await tx.objectStore('settings').put(defaultSettings);
  }
  // One-time user-requested correction. Never reseed, replace notes or rewrite history.
  if (!await tx.objectStore('meta').get('evening-niacinamide-v1')) {
    for (const p of await tx.objectStore('products').getAll()) {
      if (guideFor(p)?.key !== 'niacinamide') continue;
      const originalSchedule = p.scheduling && p.scheduling.intensity === 'gentle' && p.scheduling.minSpacingDays === 0 && p.scheduling.maxUsesPerWeek === null;
      await tx.objectStore('products').put({ ...p, timeOfDay: 'evening', scheduling: originalSchedule ? { ...p.scheduling!, intensity: 'active', minSpacingDays: 2, maxUsesPerWeek: 2 } : p.scheduling, updatedAt: new Date().toISOString() });
    }
    await tx.objectStore('meta').put({ id: 'evening-niacinamide-v1', initializedAt: new Date().toISOString() });
  }
  if (!await tx.objectStore('meta').get('cabinet-september-v3')) {
    const updated=updateCabinet(await tx.objectStore('products').getAll(),new Date().toISOString());
    await tx.objectStore('products').clear();
    for(const p of updated) await tx.objectStore('products').put(p);
    const settings=await tx.objectStore('settings').get('routine') ?? defaultSettings;
    await tx.objectStore('settings').put({...settings,preferEveningPads:true});
    await tx.objectStore('meta').put({id:'cabinet-september-v3',initializedAt:new Date().toISOString()});
  }
  if (!await tx.objectStore('meta').get('cloudy-mist-v1')) {
    const cabinet=await tx.objectStore('products').getAll();
    if(cabinet.length && cabinet.some(p=>guideFor(p)) && !cabinet.some(p=>guideFor(p)?.key==='mist')) {
      const mist=seedProducts().find(p=>p.id==='seed-18')!;
      await tx.objectStore('products').put({...mist,id:cabinet.some(p=>p.id===mist.id)?crypto.randomUUID():mist.id});
    }
    await tx.objectStore('meta').put({id:'cloudy-mist-v1',initializedAt:new Date().toISOString()});
  }
  await tx.done;
}
export async function saveSettings(settings: RoutineSettings) { await (await database()).put('settings', settings); }
export async function readData() {
  const db = await database();
  const tx = db.transaction(['products', 'routines', 'settings', 'meta']);
  const [products, routines] = await Promise.all([tx.objectStore('products').getAll(), tx.objectStore('routines').getAll()]);
  const settings = await tx.objectStore('settings').get('routine') ?? defaultSettings;
  const canUndoRestore = !!(await tx.objectStore('meta').get('restore-point'))?.backup;
  await tx.done; return { products, routines, settings, canUndoRestore };
}
export async function saveProduct(product: Product) { await (await database()).put('products', product); }
export async function deleteProduct(id: string) { await (await database()).delete('products', id); }
export async function completeStep(date: string, period: Period, productId: string, completed: boolean) {
 return changeRoutine(date, period, productId, completed ? 'used' : 'pending');
}
export async function changeRoutine(date: string, period: Period, productId: string, action: 'used' | 'pending' | 'skip' | 'swap' | 'undo', replacementId?: string) {
 const now = new Date();
 if (!validDate(date) || date > localDate(now)) throw new Error('Future routines are previews only.');
 const db = await database(); const tx = db.transaction(['products', 'routines', 'settings'], 'readwrite');
 const products = await tx.objectStore('products').getAll();
 const history = await tx.objectStore('routines').getAll();
 const settings = await tx.objectStore('settings').get('routine') ?? defaultSettings;
 const id = `${date}:${period}`; const at = routineTime(date, period, now);
 const log = history.find(r => r.id === id) ?? { id, date, timeOfDay: period, ...generateRoutine(products, period, history, at, settings), completedAt: null, updatedAt: now.toISOString() };
 if(action === 'undo') { await tx.objectStore('routines').put(undoRoutineAction(log, productId, now.toISOString())); await tx.done; return; }
 const target = log.steps.find(s => s.productId === productId);
 if (!target) throw new Error('This routine changed. Reload it and try again.');
 let steps = log.steps;
 let decisions = log.decisions ?? [];
 if (action === 'swap') {
  const candidate = swapChoices(log, productId, products, history, at, settings).find(p => p.id === replacementId);
  if (!candidate) throw new Error('This alternative no longer fits the routine. Please choose again.');
  const ids=candidate.products.map(p=>p.id);
  steps = steps.filter(s=>!ids.includes(s.productId)).map(s => candidate.replaces.includes(s.productId) ? { ...s, skipped: true, completedAt: null, replacedById: ids[0] } : s);
  steps = [...steps, ...candidate.products.map(snapshot)].sort((a,b)=>a.routineOrder-b.routineOrder);
  decisions = decisions.filter(d => !candidate.replaces.includes(d.productId) && !ids.includes(d.productId));
 } else {
  if (action === 'skip' && target.completedAt) throw new Error('Undo the checkmark before skipping a used product.');
  steps = steps.map(s => s.productId === productId ? { ...s, skipped: action === 'skip', completedAt: action === 'used' ? (s.completedAt ?? at.toISOString()) : null } : s);
  if (action === 'skip') decisions = decisions.filter(d => d.productId !== productId).concat([{ productId, selected: false, reason: 'Skipped by you; not counted as use.' }]);
 }
 const affected = new Set([...log.steps, ...steps].filter(s=>JSON.stringify(log.steps.find(x=>x.productId===s.productId))!==JSON.stringify(steps.find(x=>x.productId===s.productId))).map(s=>s.productId));
 const undoActions = (log.undoActions ?? []).slice(-19);
 if(action === 'skip' || action === 'swap') undoActions.push({id:crypto.randomUUID(),kind:action,label:target.name,before:log.steps.filter(s=>affected.has(s.productId)),after:steps.filter(s=>affected.has(s.productId))});
 await tx.objectStore('routines').put({ ...finishLog(log, steps, now.toISOString()), decisions, undoActions }); await tx.done;
}
export async function saveHistory(log: RoutineLog, expectedUpdatedAt: string | null) {
 const now = new Date();
 if (!validDate(log.date) || log.date > localDate(now)) throw new Error('Choose today or a past date to record usage.');
 const corrected = finishLog({ ...log, undoActions: [], completedAt: null }, log.steps, now.toISOString());
 validateBackup({ ...makeBackup({ products: [], routines: [corrected], settings: defaultSettings }) });
 for (const step of corrected.steps) {
  if (step.completedAt && (Date.parse(step.completedAt) > now.getTime() || localDate(new Date(step.completedAt)) !== log.date)) throw new Error('Usage times must be on the selected day and not in the future.');
 }
 const db = await database(); const tx = db.transaction('routines', 'readwrite');
 const existing = await tx.store.get(log.id);
 if ((existing?.updatedAt ?? null) !== expectedUpdatedAt) throw new Error('This record changed in another tab. Close and reopen the editor.');
 await tx.store.put(corrected); await tx.done;
}
export async function restoreBackup(input: Backup) {
 const backup = validateBackup(input); // Validate fully before the write transaction starts.
 const db = await database(); const tx = db.transaction(['products', 'routines', 'settings', 'meta'], 'readwrite');
 const previous: AppData = { products: await tx.objectStore('products').getAll(), routines: await tx.objectStore('routines').getAll(), settings: await tx.objectStore('settings').get('routine') ?? defaultSettings };
 await tx.objectStore('meta').put({ id: 'restore-point', backup: makeBackup(previous) });
 await tx.objectStore('products').clear(); await tx.objectStore('routines').clear(); await tx.objectStore('settings').clear();
 for (const product of backup.products) await tx.objectStore('products').put(product);
 for (const log of backup.routines) await tx.objectStore('routines').put(log);
 await tx.objectStore('settings').put(backup.settings);
 await tx.objectStore('meta').put({ id: 'initialized', initializedAt: new Date().toISOString() });
 // Restoring is an explicit replacement; do not modify the restored preferences on reload.
 for (const id of ['evening-niacinamide-v1','cabinet-september-v3','cloudy-mist-v1']) await tx.objectStore('meta').put({id,initializedAt:new Date().toISOString()});
 await tx.done;
}
export async function undoRestore() {
 const db = await database();
 const tx = db.transaction(['products', 'routines', 'settings', 'meta'], 'readwrite');
 const backup = (await tx.objectStore('meta').get('restore-point'))?.backup;
 if (!backup) throw new Error('There is no previous restore to undo.');
 validateBackup(backup);
 await tx.objectStore('products').clear(); await tx.objectStore('routines').clear(); await tx.objectStore('settings').clear();
 for (const product of backup.products) await tx.objectStore('products').put(product);
 for (const log of backup.routines) await tx.objectStore('routines').put(log);
 await tx.objectStore('settings').put(backup.settings);
 await tx.objectStore('meta').delete('restore-point'); await tx.done;
}
