'use client';
import { useLocale } from './language';
import { benefitFor, guideFor, reviewedOn } from '@/lib/product-guidance';
import { type Product } from '@/lib/model';
export default function ProductGuide({ product, compact = false }: { product: Product; compact?: boolean }) {
 const {tr}=useLocale();
 const guide = guideFor(product);
 return <section className="product-guide"><h3>{tr("What it brings to your routine")}</h3><p>{tr(benefitFor(product))}</p>{guide ? <>{!compact && <><h4>{tr("Key ingredients")}</h4><p>{tr(guide.ingredients)}</p><h4>{tr("How to use")}</h4><p>{tr(guide.use)}</p><p className="guide-note">{tr(guide.note)}</p></>}<a href={guide.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{guide.source} ↗</a><small>{guide.match === 'named' ? tr("Named product matched; check your own packaging.") : tr("Exact formula or directions need confirmation.")} {tr("Reviewed ")}{tr(guide.reviewedOn ?? reviewedOn)}{tr(". Product benefits summarize manufacturer claims, not guaranteed results.")}</small></> : <p className="field-help">{tr("Based on your assigned role. No reviewed manufacturer information is available for this exact name.")}</p>}</section>;
}
