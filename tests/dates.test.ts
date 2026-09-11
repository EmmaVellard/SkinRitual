import { describe, expect, it } from 'vitest';
import { addMonths, validDate, moveDate, routineTime, lifecycle } from '../lib/dates';
import { seedProducts } from '../lib/seed';
import { localDate } from '../lib/model';
describe('calendar days and recorded lifecycle dates', () => {
 it('clamps months at month-end, including leap years', () => {
  expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
  expect(addMonths('2025-01-31', 1)).toBe('2025-02-28');
  expect(addMonths('2024-02-29', 12)).toBe('2025-02-28');
  expect(addMonths('2026-08-12', 12)).toBe('2027-08-12');
 });
 it('navigates calendar days across month/year and DST boundaries', () => {
  expect(moveDate('2026-12-31', 1)).toBe('2027-01-01');
  expect(moveDate('2024-03-01', -1)).toBe('2024-02-29');
  expect(moveDate('2026-03-08', 1)).toBe('2026-03-09');
  expect(validDate('2026-02-30')).toBe(false);
 });
 it('uses the selected day for historical and future suggestions', () => {
  const now = new Date('2026-09-10T16:00:00');
  expect(routineTime('2026-09-09', 'morning', now).getHours()).toBe(8);
  expect(localDate(routineTime('2026-09-11', 'evening', now))).toBe('2026-09-11');
  expect(routineTime('2026-09-10', 'morning', now)).toBe(now);
 });
 it('chooses the earliest known date and identifies the source', () => {
  const p = { ...seedProducts()[0], openedDate: '2026-01-31', paoMonths: 12, expirationDate: '2026-09-24' };
  const result = lifecycle(p, '2026-09-10');
  expect(result?.date).toBe('2026-09-24'); expect(result?.source).toBe('Printed expiration'); expect(result?.days).toBe(14);
  expect(lifecycle({ ...p, expirationDate: '' }, '2026-09-10')?.source).toBe('PAO');
 });
 it('does not invent a PAO date when an opening date is missing', () => {
  expect(lifecycle({ ...seedProducts()[0], paoMonths: 12 })).toBeNull();
  expect(lifecycle({ ...seedProducts()[0], expirationDate: '2026-09-10' }, '2026-09-11')?.message).toContain('recorded date has passed');
 });
});
