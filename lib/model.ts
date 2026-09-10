export const categories = ['Cleanser', 'Cleansing oil / balm', 'Mist / toner', 'Serum / ampoule', 'Treatment', 'Moisturizer', 'Sunscreen', 'Mask', 'Exfoliant', 'Pad', 'Eye cream', 'Other'] as const;
export type Period = 'morning' | 'evening';
export type Product = {
  id: string; brand: string; name: string; category: typeof categories[number];
  timeOfDay: Period | 'both'; routineOrder: number; status: 'active' | 'paused' | 'finished';
  instruction: string; notes: string; openedDate: string; paoMonths: number | null;
  roles?: FunctionalRole[]; stepOverride?: RoutineStage | null; autoOrder?: boolean;
  scheduling?: Scheduling; seeded?: boolean; applicationArea?: string; pairWithId?: string;
  expirationDate: string; createdAt: string; updatedAt: string;
};
export type RoutineStep = { productId: string; name: string; brand: string; category: Product['category']; instruction: string; routineOrder: number; completedAt: string | null; skipped: boolean };
export type RoutineLog = { id: string; date: string; timeOfDay: Period; steps: RoutineStep[]; decisions?: { productId: string; selected: boolean; reason: string }[]; completedAt: string | null; updatedAt: string };
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function currentPeriod(date = new Date()): Period { return date.getHours() < 15 ? 'morning' : 'evening'; }
// A started routine is a snapshot. Cabinet edits apply to the next routine.
export function setCompletion(log: RoutineLog, productId: string, completed: boolean, now: string): RoutineLog {
  const steps = log.steps.map(s => s.productId === productId ? { ...s, completedAt: completed ? now : null, skipped: false } : s);
  return { ...log, steps, completedAt: steps.length > 0 && steps.every(s => s.completedAt) ? now : null, updatedAt: now };
}

export const functionalRoles = ['first_cleanse', 'second_cleanse', 'gentle_cleanse', 'hydrating', 'soothing', 'brightening', 'pore_exfoliating', 'pore_mask', 'eye_treatment', 'acne_treatment', 'retinoid_treatment', 'moisturizer', 'sunscreen'] as const;
export type FunctionalRole = typeof functionalRoles[number];
export const stages = { cleanse: 10, second_cleanse: 20, mask: 30, tone: 40, serum: 50, treat: 60, eye: 70, moisturize: 80, protect: 90 } as const;
export type RoutineStage = keyof typeof stages;
export const stageLabels: Record<RoutineStage, string> = { cleanse: 'First cleanse', second_cleanse: 'Cleanse', mask: 'Rinse-off mask', tone: 'Tone', serum: 'Serum / ampoule', treat: 'Treat', eye: 'Eye care', moisturize: 'Moisturize', protect: 'Protect' };
export type Scheduling = { enabled: boolean; core: boolean; intensity: 'gentle' | 'normal' | 'active'; minSpacingDays: number; maxUsesPerWeek: number | null };
export type RoutineSettings = { id: 'routine'; intensity: 'gentle' | 'normal' | 'active'; maxOptionalSteps: number; avoidPoreSameDay: boolean };
export const defaultSettings: RoutineSettings = { id: 'routine', intensity: 'normal', maxOptionalSteps: 2, avoidPoreSameDay: true };
export function rolesFor(p: Product): FunctionalRole[] {
  if (p.roles !== undefined) return p.roles;
  const byCategory: Partial<Record<Product['category'], FunctionalRole[]>> = {
    'Cleanser': ['gentle_cleanse'], 'Cleansing oil / balm': ['first_cleanse'], 'Serum / ampoule': ['hydrating'],
    'Moisturizer': ['moisturizer'], 'Sunscreen': ['sunscreen'], 'Eye cream': ['eye_treatment'], 'Exfoliant': ['pore_exfoliating'],
  };
  return byCategory[p.category] ?? [];
}
export function stageFor(p: Product): RoutineStage {
  if (p.stepOverride) return p.stepOverride;
  const roles = rolesFor(p);
  if (roles.includes('sunscreen')) return 'protect';
  if (roles.includes('first_cleanse')) return 'cleanse';
  if (roles.includes('second_cleanse') || roles.includes('gentle_cleanse')) return 'second_cleanse';
  if (roles.includes('moisturizer')) return 'moisturize';
  if (roles.includes('eye_treatment')) return 'eye';
  if (roles.includes('pore_mask') || p.category === 'Mask') return 'mask';
  if (p.category === 'Pad' || p.category === 'Mist / toner' || roles.includes('pore_exfoliating')) return 'tone';
  if (p.category === 'Treatment' || roles.includes('retinoid_treatment') || roles.includes('acne_treatment')) return 'treat';
  return 'serum';
}
export function orderFor(p: Product): number { return p.autoOrder === false || p.autoOrder === undefined && !p.roles ? p.routineOrder : stages[stageFor(p)]; }
export function schedulingFor(p: Product): Scheduling {
  const roles = rolesFor(p);
  return p.scheduling ?? { enabled: true, core: roles.some(r => ['first_cleanse', 'second_cleanse', 'gentle_cleanse', 'moisturizer', 'sunscreen'].includes(r)), intensity: roles.some(r => ['pore_exfoliating', 'pore_mask', 'acne_treatment', 'retinoid_treatment'].includes(r)) ? 'active' : 'gentle', minSpacingDays: 0, maxUsesPerWeek: null };
}
