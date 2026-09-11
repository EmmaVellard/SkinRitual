import {expect,it} from 'vitest';
import {seedProducts} from '../lib/seed';
import {updateCabinet} from '../lib/cabinet-update';
import {guideFor} from '../lib/product-guidance';
import {translator} from '../lib/i18n';
const now='2026-09-10T12:00:00Z';
it('replaces COSRX with Round Lab without losing identity, usage preferences or personal details',()=>{
 const old={...seedProducts(now).find(p=>p.id==='seed-11')!,brand:'COSRX',name:'Cleanser',openedDate:'2026-08-01',notes:'My note',status:'paused' as const};
 const updated=updateCabinet([old],now);const cleanser=updated.find(p=>p.id===old.id)!;
 expect(cleanser).toMatchObject({brand:'Round Lab',name:'1025 Dokdo Cleanser',openedDate:old.openedDate,notes:old.notes,status:'paused',scheduling:old.scheduling});
 expect(guideFor(cleanser)?.key).toBe('roundlab');
 expect(updateCabinet(updated,now)).toHaveLength(3);
});
it('removes only the unowned Air-Fit and adds each new moisturizer once',()=>{
 const seed=seedProducts(now);const airfit={...seed[1],id:'old-airfit',name:'Centella Air-Fit Suncream Light'};
 const updated=updateCabinet([...seed,airfit],now);
 expect(updated).toHaveLength(17);expect(updated.some(p=>p.id==='old-airfit')).toBe(false);
 expect(updated.filter(p=>p.category==='Moisturizer')).toHaveLength(3);
 expect(updateCabinet(updated,now)).toHaveLength(17);
 expect(updateCabinet([],now)).toEqual([]);
});
it('translates benefits and dynamic advice without translating product names or saved data',()=>{
 const tr=translator('fr');const cleanser=seedProducts(now).find(p=>p.id==='seed-11')!;
 expect(tr('Morning')).toBe('Matin');expect(tr(cleanser.name)).toBe(cleanser.name);
 expect(tr(guideFor(cleanser)!.benefit)).toContain('nettoyant');
 expect(tr('Your cabinet contains 4 products to review for intensive or overlapping care. Masks and exfoliation are optional, not missing essentials.')).toContain('4 soins');
 expect(tr('{0} products used',3)).toBe('3 produits utilisés');
 expect(translator('en')('Morning')).toBe('Morning');
});
