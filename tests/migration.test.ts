import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { it, expect } from 'vitest';
import { seedProducts } from '../lib/seed';
it('upgrades a version-one database without rewriting existing products or routine snapshots', async () => {
 const old = await openDB('skin-ritual', 1, { upgrade(db) { db.createObjectStore('products', { keyPath: 'id' }); db.createObjectStore('routines', { keyPath: 'id' }).createIndex('date', 'date'); } });
 const legacy = { ...seedProducts()[0], id: 'my-existing-product', name: 'My own product', roles: undefined, scheduling: undefined, seeded: undefined, autoOrder: undefined, routineOrder: 42 };
 const log = { id: '2026-09-09:morning', date: '2026-09-09', timeOfDay: 'morning', steps: [], completedAt: null, updatedAt: 'before-upgrade' };
 await old.put('products', legacy); await old.put('routines', log); old.close();
 const { initializeCabinet, readData, database } = await import('../lib/database');
 await initializeCabinet(); const data = await readData();
 expect((await database()).version).toBe(2);
 expect(data.products).toEqual([legacy]); expect(data.routines).toEqual([log]);
});
