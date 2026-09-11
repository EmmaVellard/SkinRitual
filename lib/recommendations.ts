import { rolesFor, schedulingFor, type Product, type Period } from './model';
import { guideFor, sources } from './product-guidance';
export type Advice = { id: string; title: string; why: string; action: string; productIds: string[]; source: string };
export function coverageFor(products: Product[]) {
 const available = (p: Product, period: Period) => p.status === 'active' && schedulingFor(p).enabled && (p.timeOfDay === 'both' || p.timeOfDay === period);
 return [
  { key: 'cleanse', title: 'Evening cleanse', period: 'evening' as const, role: ['gentle_cleanse', 'second_cleanse'] },
  { key: 'am-moisture', title: 'Morning moisture', period: 'morning' as const, role: ['moisturizer'] },
  { key: 'pm-moisture', title: 'Evening moisture', period: 'evening' as const, role: ['moisturizer'] },
  { key: 'spf', title: 'Morning sun protection', period: 'morning' as const, role: ['sunscreen'] },
 ].map(slot => ({ ...slot, products: products.filter(p => available(p, slot.period) && rolesFor(p).some(r => slot.role.includes(r))) }));
}
export function recommendationsFor(products: Product[]): Advice[] {
 const active = products.filter(p => p.status === 'active'); const notes: Advice[] = [];
 for (const slot of coverageFor(products).filter(s => !s.products.length)) notes.push({ id:slot.key,title:`Review ${slot.title.toLowerCase()}`,why:`No active product is enabled for this ${slot.period} step. This is a cabinet setting gap, not proof that you do not use one.`,action:'Check paused products, time assignments and suggestion settings first. If you do not own one, prioritize this basic step before another serum.',productIds:products.filter(p => rolesFor(p).some(r => slot.role.includes(r))).map(p=>p.id),source:sources.basics });
 const moisturizers = active.filter(p => rolesFor(p).includes('moisturizer'));
 if (moisturizers.length && moisturizers.every(p => guideFor(p)?.key === 'vitac')) notes.push({id:'plain-moisture',title:'Consider a plain moisturizer for simpler evenings',why:'Your only active moisturizer is Deep Vita C, which also adds vitamin C and niacinamide. The Centella ampoule provides hydration, but does not fill the cream step.',action:'If you want fewer brightening actives, or your current cream stings, consider a fragrance-free, non-comedogenic moisturizer without exfoliating acids or retinoids. If your cream is comfortable, a replacement is not automatically necessary.',productIds:moisturizers.map(p=>p.id),source:sources.moisture});
 const comfort=moisturizers.filter(p=>['drg','avene'].includes(guideFor(p)?.key ?? ''));
 if(comfort.length) notes.push({id:'moisture-choice',title:'You already have moisturizing alternatives',why:'DR.G and Avène give you alternatives to the Medicube vitamin C cream. A plain-moisturizer gap is no longer assumed.',action:'Choose one moisturizer per routine. Use the texture you tolerate; DR.G includes niacinamide, and Avène Hydrance Light is not automatically fragrance-free. You do not need to layer all three.',productIds:moisturizers.map(p=>p.id),source:sources.moisture});
 const bright = active.filter(p => rolesFor(p).includes('brightening'));
 if (bright.length > 1) notes.push({id:'brightening',title:'Use your brightening products as alternatives',why:`${bright.map(p=>p.name).join(', ')} overlap in tone-evening care. A second brightening step does not automatically add a new benefit.`,action:'Choose one optional brightening product at a time. Your cream may already supply that benefit; there is no obvious need for another brightening purchase.',productIds:bright.map(p=>p.id),source:sources.basics});
 const intensive = active.filter(p => schedulingFor(p).intensity === 'active' || ['niacinamide','porepad','mask','brightpad'].includes(guideFor(p)?.key ?? ''));
 if (intensive.length) notes.push({id:'intensity',title:'Give intensive steps their own space',why:`Your cabinet contains ${intensive.length} products to review for intensive or overlapping care. Masks and exfoliation are optional, not missing essentials.`,action:'Keep the normal intensity limit at one intensive step and use gentle mode when you want a simpler routine. Do not increase frequency to fill a calendar or improve your score. Treatment combinations need your own label or clinician’s guidance.',productIds:intensive.map(p=>p.id),source:sources.exfoliation});
 const uncertain = active.filter(p => !guideFor(p) || guideFor(p)?.match === 'variant-needed');
 if (uncertain.length) notes.push({id:'identify',title:'Confirm labels before ingredient-specific advice',why:`${uncertain.length} active products lack a fully matched formula or strength. Similar names can hide different sunscreen filters, acids or treatment strengths.`,action:'Check treatment strengths, Zero Pore Pad version and the Avène market formula against the packaging. Until a matching source is reviewed, the app keeps this uncertainty visible.',productIds:uncertain.map(p=>p.id),source:sources.basics});
 return notes;
}
