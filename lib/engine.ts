import { type Product, type Period, type RoutineLog, type RoutineSettings, type RoutineStep, defaultSettings, rolesFor, schedulingFor, stageFor, orderFor, localDate } from './model';
export type Decision = { productId: string; selected: boolean; reason: string };
export type Plan = { steps: RoutineStep[]; decisions: Decision[] };
const DAY = 86400000;
// Groups describe primary uses. A brightening moisturizer still occupies the moisturizer slot.
export function groupsFor(p: Product): string[] {
 const stage = stageFor({ ...p, stepOverride: null });
 const roles = rolesFor(p);
 const groups: string[] = [];
 if (roles.includes('sunscreen')) groups.push('sunscreen');
 if (roles.includes('first_cleanse')) groups.push('oil cleanser');
 if (roles.includes('second_cleanse') || roles.includes('gentle_cleanse')) groups.push('water-based cleanser');
 if (roles.includes('moisturizer')) groups.push('moisturizer');
 if (p.category === 'Pad') groups.push('pad');
 if (roles.includes('eye_treatment')) groups.push('eye product');
 if (roles.includes('pore_mask')) groups.push('mask');
 if (roles.includes('brightening') && !['moisturize', 'protect', 'eye'].includes(stage)) groups.push('brightening step');
 if (roles.some(r => r === 'soothing' || r === 'hydrating') && stage === 'serum') groups.push('soothing / hydrating ampoule');
 return groups;
}
export function generateRoutine(products: Product[], period: Period, history: RoutineLog[], now: Date, settings: RoutineSettings = defaultSettings): Plan {
 const time = now.getTime();
 const uses = history.flatMap(log => log.steps.filter(s => !s.skipped && s.completedAt && Date.parse(s.completedAt) <= time).map(s => ({ id: s.productId, at: Date.parse(s.completedAt!), date: log.date })));
 const last = (p: Product) => Math.max(-Infinity, ...uses.filter(u => u.id === p.id).map(u => u.at));
 const rank = (a: Product, b: Product) => { const aLast = last(a), bLast = last(b); return (aLast === bLast ? 0 : aLast < bLast ? -1 : 1) || a.id.localeCompare(b.id); };
 const selected: Product[] = [];
 const decisions = new Map<string, Decision>();
 const reasons = new Map<string, string>();
 const reject = (p: Product, reason: string) => { decisions.set(p.id, { productId: p.id, selected: false, reason }); };
 const intensityCap = { gentle: 0, normal: 1, active: 2 }[settings.intensity];
 const optionalCap = period === 'morning' ? Math.min(1, settings.maxOptionalSteps) : settings.maxOptionalSteps;
 const pore = (p: Product) => rolesFor(p).filter(r => r === 'pore_mask' || r === 'pore_exfoliating');
 const eligible = products.filter(p => {
  const s = schedulingFor(p);
  let reason = '';
  if (p.status !== 'active') reason = `Product is ${p.status}.`;
  else if (period==='morning' && settings.morningStart==='mist' && rolesFor(p).some(r=>['first_cleanse','second_cleanse','gentle_cleanse'].includes(r))) reason='Your morning preference starts without a cleanser.';
  else if (p.timeOfDay !== 'both' && p.timeOfDay !== period) reason = `Assigned to ${p.timeOfDay}.`;
  else if (!s.enabled) reason = 'Automatic suggestions are off; configure your own schedule.';
  else if (time - last(p) < s.minSpacingDays * DAY) reason = `Minimum spacing is ${s.minSpacingDays} days; last use is too recent.`;
  else if (s.maxUsesPerWeek !== null && uses.filter(u => u.id === p.id && u.at > time - 7 * DAY).length >= s.maxUsesPerWeek) reason = `Reached the rolling seven-day limit (${s.maxUsesPerWeek} uses).`;
  else if (settings.avoidPoreSameDay && pore(p).length && uses.some(u => u.date === localDate(now) && products.some(other => other.id === u.id && pore(other).some(r => !pore(p).includes(r))))) reason = 'Another pore-focused product was used today (editable same-day rule).';
  if (reason) { reject(p, reason); return false; }
  return true;
 });
 function problem(p: Product, batch: Product[]): string | undefined {
  const others = [...selected, ...batch.filter(x => x.id !== p.id)];
  const duplicate = groupsFor(p).find(g => others.some(x => groupsFor(x).includes(g)));
  if (duplicate) return `Another ${duplicate} was selected.`;
  if (settings.avoidPoreSameDay && pore(p).length && others.some(x => pore(x).some(r => !pore(p).includes(r)))) return 'A different pore-focused product is already included (editable same-day rule).';
  if (schedulingFor(p).intensity === 'active' && others.filter(x => schedulingFor(x).intensity === 'active').length >= intensityCap) return 'The routine intensity limit is reached; another active may already be included.';
  if (!schedulingFor(p).core && others.filter(x => !schedulingFor(x).core).length >= optionalCap) return `The routine already has its ${optionalCap} optional step${optionalCap === 1 ? '' : 's'}.`;
 }
 function select(p: Product, batch: Product[] = [p]) {
  for (const item of batch) { const issue = problem(item, batch); if (issue) { reject(p, issue); return false; } }
  for (const item of batch) {
   selected.push(item);
   const elapsed = last(item);
   const role = rolesFor(item);
   const purpose = role.includes('sunscreen') ? 'Your one sunscreen for this morning' : role.includes('moisturizer') ? 'The moisturizer step' : role.includes('pore_mask') ? 'A mask slot within your weekly limit' : role.includes('pore_exfoliating') ? 'An exfoliating-pad slot within your spacing limit' : role.includes('brightening') ? 'The rotating brightening step' : role.includes('eye_treatment') ? 'Your optional eye-care step' : role.includes('soothing') || role.includes('hydrating') ? 'The soothing / hydrating step' : 'A step that fits this routine';
   const recent = elapsed === -Infinity ? 'No use recorded yet.' : `Last recorded use: ${Math.floor((time - elapsed) / DAY)} days ago.`;
   reasons.set(item.id, `${purpose}. ${recent}${!schedulingFor(item).core ? ' Chosen within your optional-step budget.' : ''}`);
   if (batch.length > 1) reasons.set(item.id, 'Selected as part of the linked oil → foam double cleanse.');
  }
  return true;
 }
 // Resolve complete double-cleansing pairs before standalone cleanser alternatives.
 if (period === 'evening') for (const oil of eligible.filter(p => rolesFor(p).includes('first_cleanse') && p.pairWithId).sort(rank)) {
  const foam = eligible.find(p => p.id === oil.pairWithId && rolesFor(p).some(r => r === 'second_cleanse' || r === 'gentle_cleanse'));
  if (!foam) reject(oil, 'The linked second cleanser is unavailable; the double cleanse was not selected.');
  else select(oil, [oil, foam]);
 }
 for (const p of [...eligible.filter(p => schedulingFor(p).core).sort(rank), ...eligible.filter(p => !schedulingFor(p).core).sort((a,b)=> { const mistFirst=(p: Product)=>period==='morning' && settings.morningStart==='mist' && p.category==='Mist / toner' && rolesFor(p).includes('hydrating') ? 1 : 0; const padDue=(p: Product)=>period==='evening' && settings.preferEveningPads && p.category==='Pad' && time-last(p)>=2*DAY ? 1 : 0; return mistFirst(b)-mistFirst(a) || padDue(b)-padDue(a) || rank(a,b); })]) {
  if (selected.some(s => s.id === p.id) || decisions.has(p.id)) continue;
  select(p);
 }
 const ordered = selected.sort((a, b) => orderFor(a) - orderFor(b) || a.id.localeCompare(b.id));
 // Keep a linked foam immediately after its oil, including with custom order overrides.
 for (const oil of selected.filter(p => p.pairWithId)) {
  const foamIndex = ordered.findIndex(p => p.id === oil.pairWithId);
  if (foamIndex >= 0) { const [foam] = ordered.splice(foamIndex, 1); ordered.splice(ordered.findIndex(p => p.id === oil.id) + 1, 0, foam); }
 }
 for (const p of ordered) decisions.set(p.id, { productId: p.id, selected: true, reason: reasons.get(p.id)! });
 return { steps: ordered.map(p => ({ productId: p.id, name: p.name, brand: p.brand, category: p.category, instruction: [p.instruction, p.applicationArea && `Area: ${p.applicationArea}`].filter(Boolean).join(' · '), routineOrder: orderFor(p), completedAt: null, skipped: false })), decisions: products.map(p => decisions.get(p.id)!) };
}
