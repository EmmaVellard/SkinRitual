import { type Product, type RoutineLog, type RoutineStep, type RoutineSettings, orderFor, rolesFor, schedulingFor } from './model';
import { generateRoutine, groupsFor } from './engine';
export function snapshot(p: Product): RoutineStep { return { productId: p.id, name: p.name, brand: p.brand, category: p.category, instruction: [p.instruction, p.applicationArea && `Area: ${p.applicationArea}`].filter(Boolean).join(' · '), routineOrder: orderFor(p), completedAt: null, skipped: false }; }
export function finishLog(log: RoutineLog, steps: RoutineStep[], updatedAt: string): RoutineLog {
 return { ...log, steps, updatedAt, completedAt: steps.length > 0 && steps.every(s => s.completedAt || s.skipped) ? (log.completedAt ?? updatedAt) : null };
}
export type SwapChoice = { id: string; name: string; brand: string; products: Product[]; replaces: string[]; manualTiming: boolean };
const isCleanser = (p: Product) => rolesFor(p).some(r=>['first_cleanse','second_cleanse','gentle_cleanse'].includes(r));
export function swapChoices(log: RoutineLog, productId: string, products: Product[], history: RoutineLog[], at: Date, settings: RoutineSettings): SwapChoice[] {
 const old=log.steps.find(s=>s.productId===productId); const product=products.find(p=>p.id===productId);
 if (!old || old.completedAt || old.skipped || !product) return [];
 const live=log.steps.filter(s=>!s.skipped); let replaces=[productId];
 if (isCleanser(product)) replaces=live.filter(s=>products.some(p=>p.id===s.productId && isCleanser(p))).map(s=>s.productId);
 if (live.some(s=>replaces.includes(s.productId) && s.completedAt)) return [];
 const remaining=live.filter(s=>!replaces.includes(s.productId));
 const others=remaining.map(s=>products.find(p=>p.id===s.productId)); if(others.some(p=>!p)) return [];
 // Explicit cleanser swaps may use the linked evening pair in a morning record.
 // Automatic routines keep each product's saved time assignment.
 const manualTiming=(batch: Product[])=>log.timeOfDay==='morning' && isCleanser(product) && batch.length===2 && batch[0].pairWithId===batch[1].id;
 const candidates: Product[][]=[];
 for (const p of products) {
  if(replaces.includes(p.id) || remaining.some(s=>s.productId===p.id)) continue;
  if(isCleanser(product)) {
   if(!isCleanser(p)) continue;
   if(p.pairWithId) { const partner=products.find(x=>x.id===p.pairWithId);if(partner && rolesFor(partner).some(r=>['second_cleanse','gentle_cleanse'].includes(r))) candidates.push([p,partner]); }
   else if(!rolesFor(p).includes('first_cleanse')) candidates.push([p]);
  } else if(groupsFor(p).some(g=>groupsFor(product).includes(g))) candidates.push([p]);
 }
 return candidates.filter(batch=> {
  if(batch.some(p=>replaces.includes(p.id) || remaining.some(s=>s.productId===p.id))) return false;
  const ids=batch.map(p=>p.id);
  const plan=generateRoutine(products.map(p=>ids.includes(p.id)?(manualTiming(batch)?{...p,timeOfDay:'both'}:p):{...p,status:'paused'}),log.timeOfDay,history,at,isCleanser(product)?{...settings,morningStart:'cleanser'}:settings);
  if(!ids.every(id=>plan.steps.some(s=>s.productId===id))) return false;
  const combined=[...others as Product[],...batch];
  if(batch.some(p=>groupsFor(p).some(g=>combined.some(x=>x.id!==p.id && groupsFor(x).includes(g))))) return false;
  if(combined.filter(p=>schedulingFor(p).intensity==='active').length>{gentle:0,normal:1,active:2}[settings.intensity]) return false;
  const cap=log.timeOfDay==='morning'?Math.min(1,settings.maxOptionalSteps):settings.maxOptionalSteps;
  if(combined.filter(p=>!schedulingFor(p).core).length>cap) return false;
  if(settings.avoidPoreSameDay && combined.some(p=>rolesFor(p).includes('pore_mask')) && combined.some(p=>rolesFor(p).includes('pore_exfoliating'))) return false;
  return true;
 }).map(batch=>({id:batch.map(p=>p.id).join('+'),name:batch.map(p=>p.name).join(' + '),brand:batch.map(p=>p.brand).filter((x,i,a)=>a.indexOf(x)===i).join(' / '),products:batch,replaces,manualTiming:!!manualTiming(batch)})).sort((a,b)=>a.name.localeCompare(b.name));
}
// Kept for callers that only need single-product candidates.
export function swapCandidates(log: RoutineLog, productId: string, products: Product[], history: RoutineLog[], at: Date, settings: RoutineSettings): Product[] {
 return swapChoices(log,productId,products,history,at,settings).filter(c=>c.products.length===1).map(c=>c.products[0]);
}
export function undoRoutineAction(log: RoutineLog, id: string, now: string): RoutineLog {
 const event=log.undoActions?.find(a=>a.id===id);
 if(!event) throw new Error('This action can no longer be undone.');
 const affected=new Set([...event.before.map(s=>s.productId),...event.after.map(s=>s.productId)]);
 const current=log.steps.filter(s=>affected.has(s.productId));
 if(JSON.stringify(current)!==JSON.stringify(event.after)) throw new Error('These steps changed since this action. Undo the later change first.');
 const steps=[...log.steps.filter(s=>!affected.has(s.productId)),...event.before].sort((a,b)=>a.routineOrder-b.routineOrder);
 return {...finishLog({...log,completedAt:null},steps,now),undoActions:log.undoActions?.filter(a=>a.id!==id),decisions:log.decisions?.filter(d=>!affected.has(d.productId))};
}
