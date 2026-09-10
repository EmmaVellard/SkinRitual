import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { database, saveProduct, deleteProduct, readData, completeStep, initializeCabinet } from '../lib/database';
import type { Product } from '../lib/model';
const product = (id: string): Product => ({ id, name: `Product ${id}`, brand: 'Brand', category: id === 'a' ? 'Moisturizer' : 'Sunscreen', timeOfDay: 'both', routineOrder: 10, status: 'active', instruction: 'One drop', notes: '', openedDate: '', paoMonths: null, expirationDate: '', createdAt: '', updatedAt: '' });
beforeEach(async () => { const db = await database(); await db.clear('products'); await db.clear('routines'); await db.clear('meta'); await db.clear('settings'); });
describe('persistent daily records', () => {
 it('persists CRUD and completion through fresh reads', async () => {
 await saveProduct(product('a'));
 await saveProduct({ ...product('a'), name: 'Edited name' });
 await completeStep('2026-09-10', 'morning', 'a', true);
 const data = await readData();
 expect(data.products[0].name).toBe('Edited name');
 expect(data.routines[0].completedAt).not.toBeNull();
 await deleteProduct('a');
 const next = await readData();
 expect(next.products).toHaveLength(0);
 expect(next.routines[0].steps[0].name).toBe('Edited name');
 });
 it('does not lose simultaneous step updates', async () => {
 await saveProduct(product('a')); await saveProduct(product('b'));
 await Promise.all([completeStep('2026-09-10', 'morning', 'a', true), completeStep('2026-09-10', 'morning', 'b', true)]);
 expect((await readData()).routines[0].steps.every(s => s.completedAt)).toBe(true);
 });
 it('keeps started routines stable and separates days and periods', async () => {
 await saveProduct(product('a')); await saveProduct(product('b'));
 await completeStep('2026-09-10', 'morning', 'a', true);
 await saveProduct({ ...product('b'), status: 'paused' });
 await completeStep('2026-09-10', 'morning', 'b', true);
 await completeStep('2026-09-10', 'evening', 'a', true);
 await completeStep('2026-09-11', 'morning', 'a', true);
 const { routines } = await readData();
 expect(routines).toHaveLength(3);
 expect(routines.find(r => r.id === '2026-09-10:morning')?.steps).toHaveLength(2);
 expect(routines.find(r => r.id === '2026-09-10:evening')?.steps).toHaveLength(1);
 });
});

describe('first launch', () => {
 it('seeds once even when initialized concurrently, preserves edits and deletion', async () => {
  await Promise.all([initializeCabinet(), initializeCabinet()]);
  expect((await readData()).products).toHaveLength(15);
  await saveProduct({ ...(await readData()).products[0], name: 'My edited name' });
  await initializeCabinet();
  expect((await readData()).products[0].name).toBe('My edited name');
  const db = await database(); await db.clear('products');
  await initializeCabinet();
  expect((await readData()).products).toHaveLength(0);
 });
 it('does not seed into an existing cabinet', async () => {
  await saveProduct(product('a'));
  await initializeCabinet();
  expect((await readData()).products.map(p => p.id)).toEqual(['a']);
 });
 it('does not refill an empty cabinet with existing history', async () => {
  await saveProduct(product('a'));
  await completeStep('2026-09-10', 'morning', 'a', true);
  await deleteProduct('a');
  await initializeCabinet();
  expect((await readData()).products).toHaveLength(0);
 });
});
