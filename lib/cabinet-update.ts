import { type Product } from './model';
import { guideFor } from './product-guidance';
import { seedProducts } from './seed';
export const canonicalNames: Record<string,string> = {
 centella:'Madagascar Centella Ampoule',hyalu:'Madagascar Centella Hyalu-Cica Water-Fit Sun Serum',eye:'Madagascar Centella Probio-Cica Bakuchiol Eye Cream',niacinamide:'Madagascar Centella Niacinamide 10 Boosting Shot Ampoule',mask:'Madagascar Centella Poremizing Quick Clay Stick Mask',brightpad:'Madagascar Centella Tone Brightening Dark Spot Ampoule Pad',porepad:'Zero Pore Pad',vitac:'Deep Vita C Capsule Cream',boj:'Relief Sun: Rice + Probiotics',roundlab:'1025 Dokdo Cleanser',oil:'Madagascar Centella Light Cleansing Oil',foam:'Madagascar Centella Ampoule Foam',drg:'R.E.D Blemish Clear Soothing Cream',avene:'Hydrance Light Hydrating Emulsion',differin:'Differin',cutacnyl:'Cutacnyl'
};
export function updateCabinet(products: Product[], now: string): Product[] {
 const result: Product[]=[];
 for(const p of products) {
  const guide=guideFor(p);
  const staleDefault=p.seeded && p.notes==='Exact product variant not specified. Classification uses your description only.';
  const notes=staleDefault && (guide?.match==='named' || p.brand.toLowerCase()==='cosrx') ? '' : p.notes;
  if(guide?.key==='airfit') continue;
  if(p.brand.toLowerCase()==='cosrx' && p.category==='Cleanser') {
   result.push({...p,notes,brand:'Round Lab',name:'1025 Dokdo Cleanser',roles:['second_cleanse','gentle_cleanse'],updatedAt:now});continue;
  }
  if(!guide){result.push(p);continue;}
  const scheduling=guide?.key==='brightpad' && p.scheduling?.intensity==='gentle' && p.scheduling.maxUsesPerWeek===null && p.scheduling.minSpacingDays===0 ? {...p.scheduling,intensity:'active' as const,maxUsesPerWeek:3,minSpacingDays:1} : p.scheduling;
  result.push({...p,notes,scheduling,brand:guide?.brand || p.brand.trim(),name:canonicalNames[guide?.key ?? ''] ?? p.name.trim().replace(/\s+/g,' '),updatedAt:now});
 }
 if(!products.some(p=>guideFor(p) || p.brand.toLowerCase()==='cosrx')) return result;
 for(const addition of seedProducts(now).filter(p=>['seed-16','seed-17'].includes(p.id))) {
  if(!result.some(p=>guideFor(p)?.key===guideFor(addition)?.key)) result.push({...addition,id:result.some(p=>p.id===addition.id)?crypto.randomUUID():addition.id});
 }
 return result;
}
