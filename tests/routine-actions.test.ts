import 'fake-indexeddb/auto';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { database, initializeCabinet, readData, changeRoutine, saveHistory } from '../lib/database';
import { generateRoutine } from '../lib/engine';
import { seedProducts } from '../lib/seed';
import { defaultSettings, type RoutineLog, localDate } from '../lib/model';
import { swapCandidates, swapChoices, snapshot } from '../lib/routine-actions';
const now = new Date('2026-09-10T22:00:00');
const products = () => seedProducts('2026-09-01T00:00:00Z');
const record = (period: 'morning' | 'evening' = 'morning'): RoutineLog => ({ id: `2026-09-10:${period}`, date: '2026-09-10', timeOfDay: period, ...generateRoutine(products(), period, [], now), updatedAt: now.toISOString(), completedAt: null });
beforeEach(async () => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(now); const db = await database(); for (const store of ['products', 'routines', 'settings', 'meta'] as const) await db.clear(store); await initializeCabinet(); });
afterEach(() => vi.useRealTimers());
describe('skip and swap', () => {
 it('offers sunscreen alternatives and preserves already used steps when swapping', async () => {
  expect(swapCandidates(record(), 'seed-02', products(), [], now, defaultSettings).map(p => p.id)).toEqual(expect.arrayContaining(['seed-10']));
  await changeRoutine('2026-09-10', 'morning', 'seed-09', 'used');
  const timestamp = (await readData()).routines[0].steps.find(s => s.productId === 'seed-09')!.completedAt;
  await changeRoutine('2026-09-10', 'morning', 'seed-02', 'swap', 'seed-10');
  const log = (await readData()).routines[0];
  expect(log.steps.find(s => s.productId === 'seed-02')?.skipped).toBe(true);
  expect(log.steps.find(s => s.productId === 'seed-10')?.completedAt).toBeNull();
  expect(log.steps.find(s => s.productId === 'seed-09')?.completedAt).toBe(timestamp);
 });
 it('cannot replace a completed step or split the double-cleanse pair', async () => {
  const morning = record(); morning.steps.find(s => s.productId === 'seed-02')!.completedAt = now.toISOString();
  expect(swapCandidates(morning, 'seed-02', products(), [], now, defaultSettings)).toHaveLength(0);
  const evening=record('evening'); evening.steps.find(s=>s.productId==='seed-12')!.completedAt=now.toISOString();
  expect(swapCandidates(evening, 'seed-13', products(), [], now, defaultSettings)).toHaveLength(0);
 });
 it('respects frequency and intensity when offering alternatives', () => {
  const p = products().map(p => p.id === 'seed-03' || p.id === 'seed-10' ? { ...p, scheduling: { ...p.scheduling!, minSpacingDays: 2 } } : p);
  const used: RoutineLog = { ...record(), id: '2026-09-09:morning', date: '2026-09-09', steps: p.filter(p => ['seed-10'].includes(p.id)).map(p => ({ ...snapshot(p), completedAt: new Date('2026-09-09T08:00:00').toISOString() })) };
  expect(swapCandidates(record(), 'seed-02', p, [used], now, defaultSettings)).toHaveLength(0);
 });
 it('skips without usage and persists that state through fresh reads', async () => {
  await changeRoutine('2026-09-10', 'morning', 'seed-01', 'skip');
  const step = (await readData()).routines[0].steps.find(s => s.productId === 'seed-01'); expect(step?.skipped).toBe(true); expect(step?.completedAt).toBeNull();
 });
 it('rejects future usage without creating a log', async () => {
  await expect(changeRoutine('2026-09-11', 'morning', 'seed-01', 'used')).rejects.toThrow('previews');
  expect((await readData()).routines).toHaveLength(0);
 });
});
describe('historical corrections', () => {
 it('backdates missed usage rather than timestamping it today', async () => {
  await changeRoutine('2026-09-08', 'morning', 'seed-01', 'used');
  const log = (await readData()).routines[0]; const at = new Date(log.steps.find(s => s.productId === 'seed-01')!.completedAt!);
  expect(localDate(at)).toBe('2026-09-08'); expect(at.getHours()).toBe(8);
 });
 it('saves actual products, updates future rotation, and protects concurrent edits', async () => {
  const log: RoutineLog = { ...record(), id: '2026-09-09:morning', date: '2026-09-09', steps: [{ ...snapshot(products()[1]), completedAt: new Date('2026-09-09T08:00:00').toISOString() }] };
  await saveHistory(log, null);
  const data = await readData(); expect(generateRoutine(data.products, 'morning', data.routines, now).steps.map(s => s.productId)).toContain('seed-10');
  await expect(saveHistory(log, null)).rejects.toThrow('another tab');
 });
 it('rejects times outside the chosen day or later than now', async () => {
  const log = record(); log.steps[0].completedAt = new Date('2026-09-11T08:00:00').toISOString();
  await expect(saveHistory(log, null)).rejects.toThrow('Usage times');
 });
 it('supports removing all mistaken uses without reseeding or inventing usage', async () => {
  await changeRoutine('2026-09-10', 'morning', 'seed-01', 'used');
  const log = (await readData()).routines[0]; await saveHistory({ ...log, steps: [] }, log.updatedAt);
  expect((await readData()).routines[0].steps).toHaveLength(0);
 });
});
it('undoes a persisted skip while preserving another completed step',async()=>{
 await changeRoutine('2026-09-10','morning','seed-01','skip');
 const action=(await readData()).routines[0].undoActions![0];
 await changeRoutine('2026-09-10','morning','seed-09','used');
 await changeRoutine('2026-09-10','morning',action.id,'undo');
 const log=(await readData()).routines[0];
 expect(log.steps.find(s=>s.productId==='seed-01')?.skipped).toBe(false);
 expect(log.steps.find(s=>s.productId==='seed-09')?.completedAt).toBeTruthy();
 expect(log.undoActions).toHaveLength(0);
});
it('swaps the whole double cleanse to Round Lab and undoes both steps atomically',async()=>{
 await changeRoutine('2026-09-10','evening','seed-13','swap','seed-11');
 let log=(await readData()).routines[0];
 expect(log.steps.filter(s=>['seed-12','seed-13'].includes(s.productId)).every(s=>s.skipped && s.replacedById==='seed-11')).toBe(true);
 expect(log.steps.find(s=>s.productId==='seed-11')?.skipped).toBe(false);
 await changeRoutine('2026-09-10','evening',log.undoActions![0].id,'undo');log=(await readData()).routines[0];
 expect(log.steps.some(s=>s.productId==='seed-11')).toBe(false);
 expect(log.steps.slice(0,2).map(s=>[s.productId,s.skipped])).toEqual([['seed-12',false],['seed-13',false]]);
});
it('allows the reverse pair swap but refuses to undo over a later completed replacement',async()=>{
 await changeRoutine('2026-09-10','evening','seed-13','swap','seed-11');
 await changeRoutine('2026-09-10','evening','seed-11','swap','seed-12+seed-13');
 let log=(await readData()).routines[0];const action=log.undoActions!.at(-1)!;
 expect(log.steps.filter(s=>!s.skipped).slice(0,2).map(s=>s.productId)).toEqual(['seed-12','seed-13']);
 await changeRoutine('2026-09-10','evening','seed-12','used');
 await expect(changeRoutine('2026-09-10','evening',action.id,'undo')).rejects.toThrow('changed since');
 log=(await readData()).routines[0];expect(log.steps.find(s=>s.productId==='seed-12')?.completedAt).toBeTruthy();
});
it('offers moisturizer alternatives but never a moisturizer as a cleanser',()=>{
 const creams=swapCandidates(record(),'seed-09',products(),[],now,defaultSettings);
 expect(creams.map(p=>p.id).sort()).toEqual(['seed-16','seed-17']);
 expect(swapCandidates(record('evening'),'seed-13',products(),[],now,defaultSettings).map(p=>p.id)).toEqual(['seed-11']);
});

it('offers the evening double cleanse as an explicit morning swap without changing automatic assignments',async()=>{
 const choices=swapChoices(record(),'seed-11',products(),[],now,defaultSettings);
 expect(choices.find(c=>c.id==='seed-12+seed-13')?.manualTiming).toBe(true);
 await changeRoutine('2026-09-10','morning','seed-11','swap','seed-12+seed-13');
 let data=await readData();const log=data.routines[0];
 expect(log.steps.filter(s=>!s.skipped).slice(0,2).map(s=>s.productId)).toEqual(['seed-12','seed-13']);
 expect(data.products.filter(p=>['seed-12','seed-13'].includes(p.id)).every(p=>p.timeOfDay==='evening')).toBe(true);
 expect(generateRoutine(data.products,'morning',[],now).steps.map(s=>s.productId)).not.toContain('seed-12');
 await changeRoutine('2026-09-10','morning',log.undoActions![0].id,'undo');
 data=await readData();expect(data.routines[0].steps.filter(s=>!s.skipped).map(s=>s.productId)).toContain('seed-11');
});
it('still rejects paused or frequency-limited partners in manual morning pair swaps',()=>{
 const paused=products().map(p=>p.id==='seed-13'?{...p,status:'paused' as const}:p);
 expect(swapChoices(record(),'seed-11',paused,[],now,defaultSettings)).toHaveLength(0);
 const limited=products().map(p=>p.id==='seed-13'?{...p,scheduling:{...p.scheduling!,minSpacingDays:2}}:p);
 const use={...record(),id:'2026-09-09:evening',date:'2026-09-09',steps:[{...snapshot(limited.find(p=>p.id==='seed-13')!),completedAt:new Date('2026-09-09T20:00:00').toISOString()}]};
 expect(swapChoices(record(),'seed-11',limited,[use],now,defaultSettings)).toHaveLength(0);
});
