import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { database, saveProduct, deleteProduct, readData, completeStep, initializeCabinet } from '../lib/database';
import type { Product } from '../lib/model';
const product = (id: string): Product => ({ id, name: `Product ${id}`, brand: 'Brand', category: id === 'a' ? 'Moisturizer' : 'Sunscreen', timeOfDay: 'both', routineOrder: 10, status: 'active', instruction: 'One drop', notes: '', openedDate: '', paoMonths: null, expirationDate: '', createdAt: '', updatedAt: '' });
beforeEach(async () => { const db = await database(); await db.clear('products'); await db.clear('routines'); await db.clear('meta'); await db.clear('settings'); });
describe('persistent daily records', () => {
 it('moves existing pads to evening once without changing notes, frequency or later edits',async()=>{
  await initializeCabinet();const db=await database();
  const pad=(await readData()).products.find(p=>p.id==='seed-07')!;
  await saveProduct({...pad,timeOfDay:'both',notes:'Keep my notes'});
  await db.delete('meta','evening-pads-v1');await initializeCabinet();
  const migrated=(await readData()).products.find(p=>p.id===pad.id)!;
  expect(migrated.timeOfDay).toBe('evening');expect(migrated.notes).toBe('Keep my notes');expect(migrated.scheduling).toEqual(pad.scheduling);
  await saveProduct({...migrated,timeOfDay:'both'});await initializeCabinet();
  expect((await readData()).products.find(p=>p.id===pad.id)!.timeOfDay).toBe('both');
 });
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
 await completeStep('2026-09-08', 'morning', 'a', true);
 const { routines } = await readData();
 expect(routines).toHaveLength(3);
 expect(routines.find(r => r.id === '2026-09-10:morning')?.steps).toHaveLength(2);
 expect(routines.find(r => r.id === '2026-09-10:evening')?.steps).toHaveLength(1);
 });
});

describe('first launch', () => {
 it('seeds once even when initialized concurrently, preserves edits and deletion', async () => {
  await Promise.all([initializeCabinet(), initializeCabinet()]);
  expect((await readData()).products).toHaveLength(17);
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

it('corrects existing niacinamide once, preserves custom fields and later edits', async () => {
 const original = { ...product('mine'), brand:'SKIN1004', name:'Niacinamide 10 Boosting Shot Ampoule', category:'Serum / ampoule' as const, notes:'Keep my notes', status:'paused' as const, scheduling:{enabled:false,core:false,intensity:'gentle' as const,minSpacingDays:0,maxUsesPerWeek:null} };
 await saveProduct(original); await initializeCabinet();
 let p=(await readData()).products[0];
 expect(p.timeOfDay).toBe('evening'); expect(p.notes).toBe('Keep my notes'); expect(p.status).toBe('paused'); expect(p.scheduling?.enabled).toBe(false); expect(p.scheduling?.intensity).toBe('active');
 await saveProduct({...p,timeOfDay:'both'}); await initializeCabinet();
 p=(await readData()).products[0]; expect(p.timeOfDay).toBe('both'); expect((await readData()).products).toHaveLength(4);
});
it('keeps a custom niacinamide frequency during the evening correction', async () => {
 await saveProduct({...product('custom'),brand:'SKIN1004',name:'Niacinamide 10 Boosting Shot Ampoule',scheduling:{enabled:true,core:false,intensity:'normal',minSpacingDays:4,maxUsesPerWeek:1}});
 await initializeCabinet();const p=(await readData()).products[0];
 expect(p.timeOfDay).toBe('evening');expect(p.scheduling?.minSpacingDays).toBe(4);expect(p.scheduling?.intensity).toBe('normal');
});

it('adds the owned cloudy mist once, preserves matching edits and respects later deletion',async()=>{
 await initializeCabinet();let data=await readData();const mist=data.products.find(p=>p.id==='seed-18')!;
 await saveProduct({...mist,notes:'Personal mist note',timeOfDay:'morning'});await initializeCabinet();
 data=await readData();expect(data.products.filter(p=>p.id==='seed-18')).toHaveLength(1);expect(data.products.find(p=>p.id==='seed-18')?.notes).toBe('Personal mist note');
 await deleteProduct('seed-18');await initializeCabinet();expect((await readData()).products.some(p=>p.id==='seed-18')).toBe(false);
});
