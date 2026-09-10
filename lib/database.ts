import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { type Product, type RoutineLog, type Period, setCompletion, defaultSettings, type RoutineSettings } from './model';
import { seedProducts } from './seed';
import { generateRoutine } from './engine';
interface Schema extends DBSchema {
  settings: { key: string; value: RoutineSettings };
  meta: { key: string; value: { id: string; initializedAt: string } };
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
  await tx.done;
}
export async function saveSettings(settings: RoutineSettings) { await (await database()).put('settings', settings); }
export async function readData() {
  const db = await database();
  const tx = db.transaction(['products', 'routines', 'settings']);
  const [products, routines] = await Promise.all([tx.objectStore('products').getAll(), tx.objectStore('routines').getAll()]);
  const settings = await tx.objectStore('settings').get('routine') ?? defaultSettings;
  await tx.done; return { products, routines, settings };
}
export async function saveProduct(product: Product) { await (await database()).put('products', product); }
export async function deleteProduct(id: string) { await (await database()).delete('products', id); }
export async function completeStep(date: string, period: Period, productId: string, completed: boolean) {
  const db = await database();
  const tx = db.transaction(['products', 'routines', 'settings'], 'readwrite');
  const id = `${date}:${period}`;
  const now = new Date().toISOString();
  let log = await tx.objectStore('routines').get(id);
  if (!log) {
    const plan = generateRoutine(await tx.objectStore('products').getAll(), period, await tx.objectStore('routines').getAll(), new Date(now), await tx.objectStore('settings').get('routine') ?? defaultSettings);
    log = { id, date, timeOfDay: period, ...plan, completedAt: null, updatedAt: now };
  }
  if (!log.steps.some(s => s.productId === productId)) { await tx.done; throw new Error('Your routine changed. Please try again.'); }
  await tx.objectStore('routines').put(setCompletion(log, productId, completed, now));
  await tx.done;
}
