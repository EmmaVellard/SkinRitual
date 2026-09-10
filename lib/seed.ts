import { type Product, type FunctionalRole, type Period, type Scheduling } from './model';
export function seedProducts(now = new Date().toISOString()): Product[] {
 const rows: [string, string, Product['category'], FunctionalRole[], Period | 'both', Partial<Scheduling>?][] = [
  ['SKIN1004', 'Madagascar Centella Ampoule', 'Serum / ampoule', ['soothing', 'hydrating'], 'both'],
  ['SKIN1004', 'Hyalu-Cica Water-Fit Sun Serum', 'Sunscreen', ['sunscreen'], 'morning'],
  ['SKIN1004', 'Centella Air-Fit Suncream Light', 'Sunscreen', ['sunscreen'], 'morning'],
  ['SKIN1004', 'Probio-Cica Bakuchiol Eye Cream', 'Eye cream', ['eye_treatment'], 'evening'],
  ['SKIN1004', 'Niacinamide 10 Boosting Shot Ampoule', 'Serum / ampoule', ['brightening'], 'both'],
  ['SKIN1004', 'Poremizing Quick Clay Stick Mask', 'Mask', ['pore_mask'], 'evening', { maxUsesPerWeek: 1, minSpacingDays: 6, intensity: 'active' }],
  ['SKIN1004', 'Tone Brightening Dark Spot Ampoule Pad', 'Pad', ['brightening'], 'both'],
  ['Medicube', 'Zero Pore Pad', 'Pad', ['pore_exfoliating'], 'evening', { maxUsesPerWeek: 2, minSpacingDays: 3, intensity: 'active' }],
  ['Medicube', 'Deep Vita C Capsule Cream', 'Moisturizer', ['moisturizer', 'brightening'], 'both'],
  ['Beauty of Joseon', 'Sunscreen', 'Sunscreen', ['sunscreen'], 'morning'],
  ['COSRX', 'Cleanser', 'Cleanser', ['second_cleanse'], 'both', { maxUsesPerWeek: 2, minSpacingDays: 3 }],
  ['SKIN1004', 'Cleansing oil', 'Cleansing oil / balm', ['first_cleanse'], 'evening'],
  ['SKIN1004', 'Cleansing foam', 'Cleanser', ['second_cleanse'], 'evening'],
  ['', 'Differin', 'Treatment', ['retinoid_treatment'], 'evening', { enabled: false, intensity: 'active' }],
  ['', 'Cutacnyl', 'Treatment', ['acne_treatment'], 'evening', { enabled: false, intensity: 'active' }],
 ];
 return rows.map(([brand, name, category, roles, timeOfDay, schedule], i) => ({
  id: `seed-${String(i + 1).padStart(2, '0')}`, brand, name, category, roles, timeOfDay,
  status: 'active', seeded: true, autoOrder: true, stepOverride: null, routineOrder: 0,
  scheduling: { enabled: true, core: roles.some(r => ['first_cleanse', 'second_cleanse', 'moisturizer', 'sunscreen'].includes(r)), intensity: 'gentle', minSpacingDays: 0, maxUsesPerWeek: null, ...schedule },
  applicationArea: i === 14 ? 'Chin' : '', pairWithId: i === 11 ? 'seed-13' : undefined,
  notes: i >= 13 ? 'Treatment schedule not configured. Enable suggestions only after setting your own schedule.' : [9, 10, 11, 12].includes(i) ? 'Exact product variant not specified. Classification uses your description only.' : '',
  instruction: '', openedDate: '', paoMonths: null, expirationDate: '', createdAt: now, updatedAt: now,
 }));
}
