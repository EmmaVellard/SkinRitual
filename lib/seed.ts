import { type Product, type FunctionalRole, type Period, type Scheduling } from './model';
export function seedProducts(now = new Date().toISOString()): Product[] {
 const rows: [string, string, Product['category'], FunctionalRole[], Period | 'both', Partial<Scheduling>?][] = [
  ['SKIN1004', 'Madagascar Centella Ampoule', 'Serum / ampoule', ['soothing', 'hydrating'], 'both'],
  ['SKIN1004', 'Madagascar Centella Hyalu-Cica Water-Fit Sun Serum', 'Sunscreen', ['sunscreen'], 'morning'],
  ['SKIN1004', 'Centella Air-Fit Suncream Light', 'Sunscreen', ['sunscreen'], 'morning'],
  ['SKIN1004', 'Madagascar Centella Probio-Cica Bakuchiol Eye Cream', 'Eye cream', ['eye_treatment'], 'evening'],
  ['SKIN1004', 'Madagascar Centella Niacinamide 10 Boosting Shot Ampoule', 'Serum / ampoule', ['brightening'], 'evening', { intensity: 'active', maxUsesPerWeek: 2, minSpacingDays: 2 }],
  ['SKIN1004', 'Madagascar Centella Poremizing Quick Clay Stick Mask', 'Mask', ['pore_mask'], 'evening', { maxUsesPerWeek: 1, minSpacingDays: 6, intensity: 'active' }],
  ['SKIN1004', 'Madagascar Centella Tone Brightening Dark Spot Ampoule Pad', 'Pad', ['brightening'], 'both', {intensity:'active',maxUsesPerWeek:3,minSpacingDays:1}],
  ['Medicube', 'Zero Pore Pad', 'Pad', ['pore_exfoliating'], 'evening', { maxUsesPerWeek: 2, minSpacingDays: 3, intensity: 'active' }],
  ['Medicube', 'Deep Vita C Capsule Cream', 'Moisturizer', ['moisturizer', 'brightening'], 'both'],
  ['Beauty of Joseon', 'Relief Sun: Rice + Probiotics', 'Sunscreen', ['sunscreen'], 'morning'],
  ['Round Lab', '1025 Dokdo Cleanser', 'Cleanser', ['second_cleanse', 'gentle_cleanse'], 'both', { maxUsesPerWeek: 2, minSpacingDays: 3 }],
  ['SKIN1004', 'Madagascar Centella Light Cleansing Oil', 'Cleansing oil / balm', ['first_cleanse'], 'evening'],
  ['SKIN1004', 'Madagascar Centella Ampoule Foam', 'Cleanser', ['second_cleanse'], 'evening'],
  ['', 'Differin', 'Treatment', ['retinoid_treatment'], 'evening', { enabled: false, intensity: 'active' }],
  ['', 'Cutacnyl', 'Treatment', ['acne_treatment'], 'evening', { enabled: false, intensity: 'active' }],
  ['Dr.G', 'R.E.D Blemish Clear Soothing Cream', 'Moisturizer', ['moisturizer', 'soothing'], 'both'],
  ['Avène', 'Hydrance Light Hydrating Emulsion', 'Moisturizer', ['moisturizer', 'hydrating'], 'both'],
  ['SKIN1004', 'Madagascar Centella Hyalu-Cica Cloudy Mist', 'Mist / toner', ['hydrating', 'soothing'], 'both'],
 ];
 return rows.map<Product>(([brand, name, category, roles, timeOfDay, schedule], i) => ({
  id: `seed-${String(i + 1).padStart(2, '0')}`, brand, name, category, roles, timeOfDay,
  status: 'active', seeded: true, autoOrder: true, stepOverride: null, routineOrder: 0,
  scheduling: { enabled: true, core: roles.some(r => ['first_cleanse', 'second_cleanse', 'moisturizer', 'sunscreen'].includes(r)), intensity: 'gentle', minSpacingDays: 0, maxUsesPerWeek: null, ...schedule },
  applicationArea: i === 14 ? 'Chin' : '', pairWithId: i === 11 ? 'seed-13' : undefined,
  notes: i >= 13 && i <= 14 ? 'Treatment schedule not configured. Enable suggestions only after setting your own schedule.' : '',
  instruction: '', openedDate: '', paoMonths: null, expirationDate: '', createdAt: now, updatedAt: now,
 })).filter(p=>p.id !== 'seed-03');
}
