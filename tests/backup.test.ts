import 'fake-indexeddb/auto';
import { beforeEach, expect, it } from 'vitest';
import { parseBackup, makeBackup, validateBackup } from '../lib/backup';
import { seedProducts } from '../lib/seed';
import { defaultSettings } from '../lib/model';
import { database, initializeCabinet, readData, restoreBackup, undoRestore, saveProduct } from '../lib/database';
const backup = () => makeBackup({ products: seedProducts(), routines: [], settings: defaultSettings });
beforeEach(async () => { const db = await database(); for (const store of ['products', 'routines', 'settings', 'meta'] as const) await db.clear(store); });
it('roundtrips complete products, settings, and deleted-product history', () => {
 const b = backup(); b.routines = [{ id: '2026-09-01:evening', date: '2026-09-01', timeOfDay: 'evening', updatedAt: '2026-09-01T20:00:00Z', completedAt: null, steps: [{ productId: 'deleted', name: 'Past product', brand: '', category: 'Treatment', instruction: '', routineOrder: 60, completedAt: null, skipped: true }] }];
 expect(parseBackup(JSON.stringify(b))).toEqual(b);
});
it('rejects malformed JSON, unsupported versions, duplicate IDs, and invalid dates', () => {
 expect(() => parseBackup('{oops')).toThrow();
 expect(() => validateBackup({ ...backup(), version: 2 })).toThrow();
 const b = backup(); b.products.push(b.products[0]); expect(() => validateBackup(b)).toThrow('duplicate');
 const invalid = backup(); invalid.products[0].openedDate = '2026-02-30'; expect(() => validateBackup(invalid)).toThrow('lifecycle');
});
it('rejects malformed schedules and settings instead of trusting type assertions', () => {
 const b = backup(); b.products[0].scheduling!.minSpacingDays = -1; expect(() => validateBackup(b)).toThrow('schedule');
 expect(() => validateBackup({ ...backup(), settings: { ...defaultSettings, maxOptionalSteps: 100 } })).toThrow('preferences');
});
it('rejects conflicting step states', () => {
 const b = backup(); b.routines = [{ id: '2026-09-01:morning', date: '2026-09-01', timeOfDay: 'morning', updatedAt: '2026-09-01T08:00:00Z', completedAt: null, steps: [{ productId: 'x', name: 'x', brand: '', category: 'Cleanser', instruction: '', routineOrder: 10, completedAt: '2026-09-01T08:00:00Z', skipped: true }] }];
 expect(() => validateBackup(b)).toThrow('step');
});
it('leaves current data untouched on invalid import', async () => {
 await initializeCabinet(); const before = await readData();
 await expect(restoreBackup({ ...backup(), version: 9 } as never)).rejects.toThrow();
 expect(await readData()).toEqual(before);
});
it('restores atomically, replaces rather than merges, and persists an undo copy', async () => {
 await initializeCabinet(); const first = (await readData()).products[0]; await saveProduct({ ...first, name: 'Keep this edit' });
 const before = await readData(); const replacement = backup(); replacement.products = [replacement.products[1]];
 await restoreBackup(replacement); expect((await readData()).products).toHaveLength(1); expect((await readData()).canUndoRestore).toBe(true);
 await undoRestore(); expect((await readData()).products).toEqual(before.products); expect((await readData()).canUndoRestore).toBe(false);
});
it('does not reseed after an intentionally empty restore', async () => {
 await restoreBackup({ ...backup(), products: [] }); await initializeCabinet(); expect((await readData()).products).toHaveLength(0);
});
it('keeps French preferences and rebuy reminders through backup and reload',async()=>{
 const b=backup();b.settings.language='fr';b.settings.morningStart='mist';b.settings.preferEveningPads=false;b.products[0].almostEmpty=true;b.products[0].rebuyUrl='https://www.yesstyle.com/en/example/info.html/pid.1121970671';
 await restoreBackup(parseBackup(JSON.stringify(b)));await initializeCabinet();const next=await readData();
 expect(next.settings.language).toBe('fr');expect(next.settings.morningStart).toBe('mist');expect(next.settings.preferEveningPads).toBe(false);expect(next.products[0].almostEmpty).toBe(true);
 expect(()=>validateBackup({...b,settings:{...b.settings,language:'xx'}})).toThrow('language');
 b.products[0].rebuyUrl='javascript:alert(1)';expect(()=>validateBackup(b)).toThrow('rebuyUrl');
});
