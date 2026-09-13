import { translator } from './i18n';
import { localDate, type Period, type Product } from './model';
export function validDate(value: unknown): value is string {
 if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
 const d = new Date(`${value}T12:00:00`);
 return Number.isFinite(d.getTime()) && localDate(d) === value;
}
export function moveDate(date: string, days: number): string {
 const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + days); return localDate(d);
}
export function routineTime(date: string, period: Period, now = new Date()): Date {
 if (!validDate(date)) throw new Error('Choose a valid date.');
 return date === localDate(now) ? now : new Date(`${date}T${period === 'morning' ? '08' : '20'}:00:00`);
}
export function addMonths(date: string, months: number): string {
 const [year, month, day] = date.split('-').map(Number);
 const target = new Date(year, month - 1 + months, 1, 12);
 const end = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate();
 target.setDate(Math.min(day, end)); return localDate(target);
}
export function dateLabel(date: string, locale = 'en-US'): string { return new Date(`${date}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }); }
export function rebuyDue(product: Product, today = localDate()) {
 const life = lifecycle(product, today);
 return product.status !== 'finished' && !!life && life.days <= 0 && product.rebuyDismissedDate !== life.date;
}
export function clearRebuyReminder(product: Product, today = localDate()): Product {
 return {...product,almostEmpty:false,rebuyDismissedDate:rebuyDue(product,today)?lifecycle(product,today)!.date:product.rebuyDismissedDate,updatedAt:new Date().toISOString()};
}
export function lifecycle(product: Product, today = localDate(), locale = 'en-US') {
 const tr=translator(locale==='fr-FR'?'fr':'en');
 const paoDate = validDate(product.openedDate) && product.paoMonths && Number.isInteger(product.paoMonths) && product.paoMonths > 0 ? addMonths(product.openedDate, product.paoMonths) : null;
 const printedDate = validDate(product.expirationDate) ? product.expirationDate : null;
 const date = [paoDate, printedDate].filter((d): d is string => !!d).sort()[0];
 if (!date) return null;
 const source = date === paoDate && date === printedDate ? 'PAO and printed expiration' : date === paoDate ? 'PAO' : 'Printed expiration';
 const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
 return { date, source, days, paoDate, printedDate, message: `${tr(source)}: ${dateLabel(date,locale)}${days < 0 ? tr(' · recorded date has passed') : days === 0 ? tr(' · today') : days <= 30 ? tr(' · in {0} days',days) : ''}` };
}
