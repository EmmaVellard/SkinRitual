import { expect, it } from 'vitest';
import { guideFor, benefitFor, productGuides } from '../lib/product-guidance';
import { recommendationsFor, coverageFor } from '../lib/recommendations';
import { seedProducts } from '../lib/seed';
import { generateRoutine } from '../lib/engine';
import { defaultSettings } from '../lib/model';
it('provides reviewed benefits or explicit uncertainty for all starter products without relying on seed IDs', () => {
 const products=seedProducts();
 expect(products.every(p=>!!guideFor(p))).toBe(true);
 expect(new Set(productGuides.map(p=>p.key)).size).toBe(18);
 expect(guideFor({...products.find(p=>p.id==='seed-05')!,name:'Some other serum'})).toBeUndefined();
 expect(guideFor({...products.find(p=>p.id==='seed-05')!,brand:'Another brand'})).toBeUndefined();
 expect(benefitFor(products[0])).toContain('hydration');
 expect(benefitFor(products.find(p=>p.id==='seed-05')!)).toContain('uneven tone');
 expect(guideFor(products.find(p=>p.id==='seed-11')!)?.key).toBe('roundlab');
});
it('keeps niacinamide in the evening and out of gentle automatic routines', () => {
 const p=seedProducts(); const at=new Date('2026-09-10T20:00:00');
 expect(generateRoutine(p,'morning',[],at).steps.map(s=>s.productId)).not.toContain('seed-05');
 const niacinamide=p.filter(p=>p.id==='seed-05');
 expect(generateRoutine(niacinamide,'evening',[],at).steps).toHaveLength(1);
 expect(generateRoutine(niacinamide,'evening',[],at,{...defaultSettings,intensity:'gentle'}).steps).toHaveLength(0);
});
it('adapts gap advice to actual time assignments and paused products', () => {
 const p=seedProducts();expect(coverageFor(p).every(s=>s.products.length)).toBe(true);
 const changed=p.map(p=>p.category==='Sunscreen'?{...p,status:'paused' as const}:p);
 expect(recommendationsFor(changed).some(a=>a.id==='spf')).toBe(true);
 const eveningOnly=p.map(p=>p.category==='Moisturizer'?{...p,timeOfDay:'evening' as const}:p);
 expect(recommendationsFor(eveningOnly).some(a=>a.id==='am-moisture')).toBe(true);
 expect(recommendationsFor(eveningOnly).some(a=>a.id==='pm-moisture')).toBe(false);
});
it('suggests a plain moisturizer conditionally and does not invent a missing active', () => {
 const all=seedProducts(); expect(recommendationsFor(all).some(a=>a.id==='plain-moisture')).toBe(false); expect(recommendationsFor(all).some(a=>a.id==='moisture-choice')).toBe(true); const p=all.filter(p=>!['seed-16','seed-17'].includes(p.id));expect(recommendationsFor(p).some(a=>a.id==='plain-moisture')).toBe(true);
 expect(recommendationsFor([...p,{...p.find(p=>p.id==='seed-09')!,id:'plain',name:'My plain moisturizer',roles:['moisturizer']}]).some(a=>a.id==='plain-moisture')).toBe(false);
 expect(recommendationsFor([]).map(a=>a.id)).toEqual(['cleanse','am-moisture','pm-moisture','spf']);
});
