import { type Product, type RoutineLog, type RoutineSettings, type Period, localDate, rolesFor } from './model';
import { moveDate, routineTime } from './dates';
import { generateRoutine } from './engine';
export function previewRoutine(products: Product[], period: Period, history: RoutineLog[], date: string, settings: RoutineSettings, now = new Date()) {
 const today = localDate(now);
 if (date <= today) return { ...generateRoutine(products, period, history, routineTime(date, period, now), settings), projected: false };
 // A bounded hypothetical path. These logs are never written to storage or counted in scores.
 if (date > moveDate(today, 31)) return { ...generateRoutine(products, period, history, routineTime(date, period, now), settings), projected: false };
 const simulated = structuredClone(history.filter(r => r.date <= today));
 for (let day = today; day <= date; day = moveDate(day, 1)) {
  for (const session of ['morning', 'evening'] as const) {
   if (day === today && session === 'morning' && now.getHours() >= 15) continue;
   const at = day === today ? new Date(Math.max(now.getTime(), new Date(`${day}T${session === 'morning' ? '08' : '20'}:00:00`).getTime())) : routineTime(day, session, now);
   const plan = generateRoutine(products, session, simulated, at, settings);
   if (day === date && session === period) return { ...plan, projected: true };
   const id = `${day}:${session}`; const existing = simulated.find(r => r.id === id);
   const steps = (existing?.steps ?? plan.steps).map(s => s.skipped ? s : { ...s, completedAt: s.completedAt ?? at.toISOString() });
   const log: RoutineLog = { id, date: day, timeOfDay: session, steps, updatedAt: at.toISOString(), completedAt: null };
   const index = simulated.findIndex(r => r.id === id); if (index < 0) simulated.push(log); else simulated[index] = log;
  }
 }
 return { ...generateRoutine(products, period, history, routineTime(date, period, now), settings), projected: false };
}
export function routineScore(history: RoutineLog[], end: string, now = new Date()) {
 const start = moveDate(end, -6);
 const records = history.filter(r => r.date >= start && r.date <= end && r.date <= localDate(now));
 // Current unfinished session is not a missed opportunity. Denominator is closed calendar days,
 // plus actual records today. Missing days are unknown, never fabricated failed routines.
 const scored = records.filter(r => r.date < localDate(now) || !!r.completedAt);
 let used = 0, skipped = 0, pending = 0;
 for (const r of scored) for (const s of r.steps) {
  if (s.replacedById || r.decisions?.some(d => d.productId === s.productId && d.reason === 'Swapped out by you; not counted as use.')) continue;
  if (s.completedAt && Date.parse(s.completedAt) <= now.getTime()) used++;
  else if (s.skipped) skipped++;
  else pending++;
 }
 const total = used + skipped + pending;
 return { start, end, score: total ? Math.round(100 * used / total) : null, used, skipped, pending, total, recordedDays: new Set(records.filter(r => r.steps.some(s => s.completedAt || s.skipped)).map(r => r.date)).size, records };
}
export function localSuggestions(products: Product[], logs: RoutineLog[], end: string) {
 const from = moveDate(end, -6); const records = logs.filter(r => r.date >= from && r.date <= end);
 const notes: string[] = [];
 const missing = products.filter(p => p.status === 'active' && /Exact product variant/.test(p.notes));
 if (missing.length) notes.push(`Confirm the exact variants of ${missing.map(p => `${p.brand} ${p.name}`).join(', ')} before comparing ingredients or product suitability.`);
 const skipped = new Map<string, number>();
 for (const log of records) for (const s of log.steps) if (s.skipped && !s.replacedById) skipped.set(s.productId, (skipped.get(s.productId) ?? 0) + 1);
 for (const [id, count] of skipped) if (count >= 2) { const p = products.find(p => p.id === id); if (p) notes.push(`${p.name} was skipped ${count} times. Consider pausing it or lowering your optional-step budget if the routine feels too long.`); }
 const usedIds = new Set(records.flatMap(r => r.steps.filter(s => s.completedAt && !s.skipped && Date.parse(s.completedAt) <= Date.now()).map(s => s.productId)));
 if (products.some(p => p.status === 'active' && rolesFor(p).includes('pore_mask') && usedIds.has(p.id))) notes.push('Your logs already include a mask this week. Let its spacing rule choose the next eligible use rather than adding another intensive step for variety.');
 if (!records.length) notes.push('Log a few routines first. Suggestions here will use your recorded choices, rather than guessing what your skin needs.');
 if (!notes.length) notes.push('There is no repeated skipping pattern in this window. Keep logging what you actually use before changing the routine.');
 return notes.slice(0, 4);
}
