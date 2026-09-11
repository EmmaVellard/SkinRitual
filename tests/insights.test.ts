import { expect, it } from 'vitest';
import { previewRoutine, routineScore, localSuggestions } from '../lib/insights';
import { seedProducts } from '../lib/seed';
import { defaultSettings, type RoutineLog } from '../lib/model';
import { moveDate } from '../lib/dates';
import { generateRoutine } from '../lib/engine';
const now = new Date('2026-09-10T18:00:00');
it('projects a changing week with mask, exfoliating pad, and brightening serum without saving history', () => {
 const history: RoutineLog[] = []; const products = seedProducts(); const selections: string[][] = [];
 for (let i = 0; i < 7; i++) selections.push(previewRoutine(products, 'evening', history, moveDate('2026-09-10', i), defaultSettings, now).steps.map(s => s.productId));
 expect(selections.flat()).toContain('seed-06'); expect(selections.flat()).toContain('seed-08'); expect(selections.flat()).toContain('seed-05');
 expect(new Set(selections.map(x => x.join(','))).size).toBeGreaterThan(2);
 expect(history).toEqual([]);
 for (const choice of selections) { expect(choice.length).toBeLessThanOrEqual(5); expect(choice.includes('seed-06') && choice.includes('seed-08')).toBe(false); expect(choice).not.toContain('seed-14'); }
});
it('does not change today based on hypothetical future uses', () => {
 const p = seedProducts(); expect(previewRoutine(p, 'evening', [], '2026-09-10', defaultSettings, now).steps).toEqual(generateRoutine(p, 'evening', [], now).steps);
});
it('keeps gentle previews free of intensive products', () => {
 const p = seedProducts(); for (let i=1;i<=7;i++) expect(previewRoutine(p,'evening',[],moveDate('2026-09-10',i),{...defaultSettings,intensity:'gentle'},now).steps.some(s => ['seed-05','seed-06','seed-08','seed-14','seed-15'].includes(s.productId))).toBe(false);
});
function log(): RoutineLog { return { id:'2026-09-09:evening',date:'2026-09-09',timeOfDay:'evening',updatedAt:now.toISOString(),completedAt:null,steps:[{productId:'a',name:'a',brand:'',category:'Serum / ampoule',routineOrder:50,instruction:'',completedAt:'2026-09-09T18:00:00Z',skipped:false},{productId:'b',name:'b',brand:'',category:'Serum / ampoule',routineOrder:50,instruction:'',completedAt:null,skipped:true}]}; }
it('uses a transparent denominator and excludes swapped-out steps', () => {
 const r = log(); expect(routineScore([r],'2026-09-10',now).score).toBe(50);
 r.steps[1].replacedById='a'; expect(routineScore([r],'2026-09-10',now).score).toBe(100);
 expect(routineScore([],'2026-09-10',now).score).toBeNull();
});
it('does not penalize today while a routine is in progress', () => {
 const r = log(); r.date='2026-09-10';r.id='2026-09-10:evening'; expect(routineScore([r],'2026-09-10',now).score).toBeNull();
 expect(routineScore([log()],'2026-09-10',now).recordedDays).toBe(1);
});
it('suggests reviewing repeated skips rather than adding products to chase a score', () => {
 const p=seedProducts(); const a=log();a.steps[1].productId=p[0].id;const b={...a,id:'2026-09-08:evening',date:'2026-09-08'};
 expect(localSuggestions(p,[a,b],'2026-09-10').join(' ')).toContain('skipped 2 times');
});
