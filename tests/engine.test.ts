import { describe, it, expect } from 'vitest';
import { seedProducts } from '../lib/seed';
import { generateRoutine, groupsFor } from '../lib/engine';
import { defaultSettings, rolesFor, type Product, type RoutineLog } from '../lib/model';
const now = new Date('2026-09-10T20:00:00');
const seeds = () => seedProducts('2026-09-01T00:00:00Z');
const log = (id: string, daysAgo: number, date = '2026-09-09'): RoutineLog => ({ id: `log-${id}-${daysAgo}`, date, timeOfDay: 'evening', completedAt: null, updatedAt: '', steps: [{ productId: id, name: id, brand: '', category: 'Other', instruction: '', routineOrder: 0, completedAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(), skipped: false }] });
const ids = (products: Product[], history: RoutineLog[] = [], period: 'morning' | 'evening' = 'evening') => generateRoutine(products, period, history, now).steps.map(s => s.productId);
describe('balanced routines', () => {
 it('seeds all 15 with unknown lifecycle fields and treatment schedules off', () => {
  const products = seeds(); expect(products).toHaveLength(15);
  expect(products.every(p => p.seeded && !p.openedDate && !p.expirationDate && p.paoMonths === null)).toBe(true);
  expect(products.filter(p => p.category === 'Treatment').every(p => !p.scheduling?.enabled)).toBe(true);
  expect(products.find(p => p.id === 'seed-15')?.applicationArea).toBe('Chin');
 });
 it('chooses one sunscreen and one optional step in the morning', () => {
  const products = seeds(); const plan = generateRoutine(products, 'morning', [], now);
  expect(plan.steps.filter(s => products.find(p => p.id === s.productId)?.roles?.includes('sunscreen'))).toHaveLength(1);
  expect(plan.steps.filter(s => !products.find(p => p.id === s.productId)?.scheduling?.core)).toHaveLength(1);
  expect(plan.steps.at(-1)?.productId).toBe('seed-02');
  expect(plan.decisions).toHaveLength(15);
  expect(plan.decisions.find(d => d.productId === 'seed-03')?.reason).toContain('Another sunscreen');
 });
 it('rotates sunscreens by actual completed history', () => {
  expect(ids(seeds(), [log('seed-02', 1)], 'morning')).toContain('seed-03');
  expect(ids(seeds(), [log('seed-02', 1)], 'morning')).not.toContain('seed-02');
 });
 it('pairs oil and foam adjacently, excluding standalone cleanser', () => {
  const result = ids(seeds()); expect(result.slice(0, 2)).toEqual(['seed-12', 'seed-13']);
  expect(result).not.toContain('seed-11'); expect(result.length).toBeLessThanOrEqual(5);
 });
 it('skips an unavailable pair and uses the eligible standalone cleanser', () => {
  const products = seeds().map(p => p.id === 'seed-13' ? { ...p, status: 'paused' as const } : p);
  expect(ids(products)).not.toContain('seed-12'); expect(ids(products)).toContain('seed-11');
 });
 it('rotates brightening alternatives without treating the cream as a duplicate', () => {
  const products = seeds().filter(p => ['seed-05', 'seed-07', 'seed-09'].includes(p.id));
  expect(ids(products, [log('seed-05', 3), log('seed-07', 1)])).toEqual(['seed-05', 'seed-09']);
 });
 it('does not select two pads even when their roles differ', () => {
  const products = seeds().filter(p => ['seed-07', 'seed-08'].includes(p.id));
  expect(ids(products)).toHaveLength(1);
 });
 it('enforces elapsed spacing and rolling weekly caps including partial routines', () => {
  const products = seeds().filter(p => p.id === 'seed-11');
  expect(ids(products, [log('seed-11', 2)], 'morning')).toHaveLength(0);
  expect(ids(products, [log('seed-11', 3), log('seed-11', 6)], 'morning')).toHaveLength(0);
  expect(ids(products, [log('seed-11', 3), log('seed-11', 7)], 'morning')).toEqual(['seed-11']);
 });
 it('excludes different pore products used the same local day; rule is editable', () => {
  const products = seeds().filter(p => ['seed-06', 'seed-08'].includes(p.id));
  const history = [log('seed-08', 0.1, '2026-09-10')];
  expect(ids(products, history)).toHaveLength(0);
  expect(generateRoutine(products, 'evening', history, now, { ...defaultSettings, avoidPoreSameDay: false }).steps.map(s => s.productId)).toEqual(['seed-06']);
 });
 it('applies editable intensity budgets independently of duplicate groups', () => {
  const products = seeds().filter(p => ['seed-06', 'seed-14'].includes(p.id)).map(p => ({ ...p, scheduling: { ...p.scheduling!, enabled: true } }));
  expect(generateRoutine(products, 'evening', [], now, { ...defaultSettings, intensity: 'gentle' }).steps).toHaveLength(0);
  expect(generateRoutine(products, 'evening', [], now).steps).toHaveLength(1);
  expect(generateRoutine(products, 'evening', [], now, { ...defaultSettings, intensity: 'active' }).steps).toHaveLength(2);
 });
 it('allows distinct serum functions but not multiple brightening alternatives', () => {
  const products = seeds().filter(p => ['seed-01', 'seed-05', 'seed-07'].includes(p.id));
  expect(ids(products)).toEqual(['seed-01', 'seed-05']);
  expect(groupsFor(seeds()[8])).toEqual(['moisturizer']);
 });
 it('is deterministic regardless of input array ordering and does not mutate inputs', () => {
  const products = seeds(); const before = structuredClone(products);
  expect(ids(products)).toEqual(ids([...products].reverse()));
  expect(products).toEqual(before);
 });
 it('keeps pairs together when a user overrides order', () => {
  const products = seeds().map(p => p.id === 'seed-13' ? { ...p, autoOrder: false, routineOrder: 999 } : p);
  const result = ids(products); expect(result.indexOf('seed-13')).toBe(result.indexOf('seed-12') + 1);
 });
 it('never includes treatments without an explicit scheduling opt-in', () => {
  for (const period of ['morning', 'evening'] as const) expect(generateRoutine(seeds(), period, [], now).steps.some(s => rolesFor(seeds().find(p => p.id === s.productId)!).some(r => r === 'retinoid_treatment' || r === 'acne_treatment'))).toBe(false);
 });
});
