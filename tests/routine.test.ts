import { describe, expect, it } from 'vitest';
import { currentPeriod, localDate, setCompletion, type Product, type RoutineLog } from '../lib/model';
import { generateRoutine } from '../lib/engine';
const product = (id: string, overrides: Partial<Product> = {}): Product => ({ id, name: id, brand: '', category: id === 'a' ? 'Moisturizer' : 'Sunscreen', timeOfDay: 'both', routineOrder: 10, status: 'active', instruction: '', notes: '', openedDate: '', paoMonths: null, expirationDate: '', createdAt: '2026-01-01', updatedAt: '', ...overrides });
describe('manual routine', () => {
 it('tracks completion and supports undo without changing the snapshot', () => {
 const log: RoutineLog = { id: 'day:morning', date: '2026-09-10', timeOfDay: 'morning', steps: generateRoutine([product('a'), product('b')], 'morning', [], new Date()).steps, completedAt: null, updatedAt: '' };
 const partial = setCompletion(log, 'a', true, 'first');
 expect(partial.completedAt).toBeNull();
 const full = setCompletion(partial, 'b', true, 'second');
 expect(full.completedAt).toBe('second');
 const undone = setCompletion(full, 'a', false, 'third');
 expect(undone.completedAt).toBeNull();
 expect(undone.steps[1].completedAt).toBe('second');
 expect(log.steps[0].completedAt).toBeNull();
 });
 it('uses local calendar dates and changes automatic routine at 3pm', () => {
 expect(localDate(new Date(2026, 0, 2, 0, 1))).toBe('2026-01-02');
 expect(currentPeriod(new Date(2026, 0, 2, 14, 59))).toBe('morning');
 expect(currentPeriod(new Date(2026, 0, 2, 15))).toBe('evening');
 });
});
