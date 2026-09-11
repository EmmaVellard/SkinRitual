import { categories, functionalRoles, stages, type Product, type RoutineLog, type RoutineSettings } from './model';
import { validDate } from './dates';
export type AppData = { products: Product[]; routines: RoutineLog[]; settings: RoutineSettings };
export type Backup = AppData & { app: 'skin-ritual'; version: 1; exportedAt: string };
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
function insist(test: unknown, message: string): asserts test { if (!test) throw new Error(`Invalid backup: ${message}`); }
function object(v: unknown): asserts v is Record<string, unknown> { insist(v && typeof v === 'object' && !Array.isArray(v), 'expected an object.'); }
const text = (v: unknown, max = 4000) => typeof v === 'string' && v.length <= max;
const id = (v: unknown) => text(v, 200) && (v as string).length > 0;
const integer = (v: unknown, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;
const timestamp = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) && validDate(v.slice(0, 10)) && /(Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v));
function choices(v: unknown, list: readonly string[]) { return typeof v === 'string' && list.includes(v); }
function unique(items: Record<string, unknown>[], key: string) { insist(new Set(items.map(i => i[key])).size === items.length, `duplicate ${key}.`); }
function array(v: unknown, max: number): asserts v is Record<string, unknown>[] { insist(Array.isArray(v) && v.length <= max, 'invalid list size.'); v.forEach(object); }
function optional(p: Record<string, unknown>, field: string, test: (v: unknown) => boolean) { insist(p[field] === undefined || test(p[field]), `invalid ${field}.`); }
export function validateBackup(value: unknown): Backup {
 object(value); insist(value.app === 'skin-ritual' && value.version === 1, 'unsupported file or version.'); insist(timestamp(value.exportedAt), 'invalid export date.');
 array(value.products, 5000); array(value.routines, 50000); unique(value.products, 'id'); unique(value.routines, 'id');
 for (const p of value.products) {
  insist(id(p.id) && text(p.name, 160) && !!(p.name as string).trim() && text(p.brand, 100), 'invalid product identity.');
  insist(choices(p.category, categories) && choices(p.status, ['active', 'paused', 'finished']) && choices(p.timeOfDay, ['morning', 'evening', 'both']), 'invalid product classification.');
  insist(integer(p.routineOrder, 999) && text(p.instruction) && text(p.notes), 'invalid product details.');
  insist((p.openedDate === '' || validDate(p.openedDate)) && (p.expirationDate === '' || validDate(p.expirationDate)) && (p.paoMonths === null || integer(p.paoMonths, 120) && p.paoMonths !== 0), 'invalid lifecycle date or PAO.');
  insist(timestamp(p.createdAt) && timestamp(p.updatedAt), 'invalid product timestamp.');
  optional(p, 'roles', v => Array.isArray(v) && v.length <= functionalRoles.length && new Set(v).size === v.length && v.every(r => choices(r, functionalRoles)));
  optional(p, 'stepOverride', v => v === null || choices(v, Object.keys(stages)));
  for (const field of ['autoOrder', 'seeded', 'almostEmpty']) optional(p, field, v => typeof v === 'boolean');
  optional(p, 'rebuyUrl', v => typeof v === 'string' && (v === '' || /^https:\/\/(www\.)?yesstyle\.com\//.test(v)));
  optional(p, 'applicationArea', v => text(v)); optional(p, 'pairWithId', v => id(v) && v !== p.id);
  if (p.scheduling !== undefined) { object(p.scheduling); const s = p.scheduling; insist(typeof s.enabled === 'boolean' && typeof s.core === 'boolean' && choices(s.intensity, ['gentle', 'normal', 'active']) && integer(s.minSpacingDays, 365) && (s.maxUsesPerWeek === null || integer(s.maxUsesPerWeek, 14) && s.maxUsesPerWeek !== 0), 'invalid schedule.'); }
 }
 for (const log of value.routines) {
  insist(validDate(log.date) && choices(log.timeOfDay, ['morning', 'evening']) && log.id === `${log.date}:${log.timeOfDay}`, 'invalid routine date or ID.');
  insist(timestamp(log.updatedAt) && (log.completedAt === null || timestamp(log.completedAt)), 'invalid routine timestamp.');
  array(log.steps, 5000); unique(log.steps, 'productId');
  for (const s of log.steps) insist(id(s.productId) && text(s.name, 160) && text(s.brand, 100) && choices(s.category, categories) && text(s.instruction) && integer(s.routineOrder, 999) && typeof s.skipped === 'boolean' && (s.completedAt === null || timestamp(s.completedAt)) && !(s.completedAt && s.skipped), 'invalid routine step.');
  for (const s of log.steps) optional(s, 'replacedById', v => id(v) && v !== s.productId && s.skipped === true && log.steps instanceof Array && log.steps.some(other => other.productId === v));
  insist(!log.completedAt || log.steps.length > 0 && log.steps.every(s => s.completedAt || s.skipped), 'inconsistent routine completion.');
  if (log.undoActions !== undefined) { array(log.undoActions, 20); unique(log.undoActions,'id'); for(const event of log.undoActions) { insist(id(event.id) && choices(event.kind,['skip','swap']) && text(event.label,160),'invalid undo action.'); for(const field of ['before','after']) { array(event[field],5000); unique(event[field] as Record<string,unknown>[],'productId'); for(const s of event[field] as Record<string,unknown>[]) insist(id(s.productId) && text(s.name,160) && text(s.brand,100) && choices(s.category,categories) && text(s.instruction) && integer(s.routineOrder,999) && typeof s.skipped === 'boolean' && (s.completedAt === null || timestamp(s.completedAt)) && !(s.skipped && s.completedAt),'invalid undo step.'); } } }
  if (log.decisions !== undefined) { array(log.decisions, 10000); for (const d of log.decisions) insist(id(d.productId) && typeof d.selected === 'boolean' && text(d.reason), 'invalid decision.'); }
 }
 object(value.settings); const settings = value.settings;
 insist(settings.id === 'routine' && choices(settings.intensity, ['gentle', 'normal', 'active']) && integer(settings.maxOptionalSteps, 3) && typeof settings.avoidPoreSameDay === 'boolean', 'invalid preferences.');
 optional(settings,'morningStart',v=>choices(v,['cleanser','mist']));
 optional(settings,'language',v=>choices(v,['en','fr'])); optional(settings,'preferEveningPads',v=>typeof v === 'boolean');
 // Structured data only. No executable payloads, HTML interpretation, or network access.
 return structuredClone(value) as unknown as Backup;
}
export function parseBackup(source: string): Backup {
 if (new TextEncoder().encode(source).byteLength > MAX_BACKUP_BYTES) throw new Error('Backup is larger than 10 MB.');
 let value: unknown; try { value = JSON.parse(source); } catch { throw new Error('This file is not valid JSON.'); }
 return validateBackup(value);
}
export function makeBackup(data: AppData): Backup { return { app: 'skin-ritual', version: 1, exportedAt: new Date().toISOString(), ...data }; }
