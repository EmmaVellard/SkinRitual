import 'fake-indexeddb/auto';
import {beforeEach,it,expect} from 'vitest';
import {database,initializeCabinet,readData,saveProduct,openNewBottle,changeRoutine} from '../lib/database';
import {localDate} from '../lib/model';
import {rebuyDue,lifecycle} from '../lib/dates';
beforeEach(async()=>{const db=await database();for(const store of ['products','routines','settings','meta'] as const)await db.clear(store);await initializeCabinet();});
it('opens a replacement bottle without changing history, favorites or schedules',async()=>{
 await changeRoutine(localDate(),'morning','seed-01','used');const data=await readData();
 const product={...data.products.find(p=>p.id==='seed-01')!,favorite:true,almostEmpty:true,status:'finished' as const,openedDate:'2024-01-01',paoMonths:12,expirationDate:'2025-01-01',rebuyDismissedDate:'2025-01-01',notes:'Keep this'};
 await saveProduct(product);await openNewBottle(product.id,product.updatedAt,localDate(),12,'');
 const next=await readData();const bottle=next.products.find(p=>p.id===product.id)!;
 expect(bottle).toMatchObject({...product,openedDate:localDate(),expirationDate:'',almostEmpty:false,rebuyDismissedDate:'',status:'active',updatedAt:expect.any(String)});
 expect(next.routines).toEqual(data.routines);expect(rebuyDue(bottle)).toBe(false);expect(lifecycle(bottle)!.days).toBeGreaterThan(300);
});
it('keeps paused products paused and allows unknown PAO and a new printed date',async()=>{
 const product={...(await readData()).products[0],status:'paused' as const};await saveProduct(product);
 await openNewBottle(product.id,product.updatedAt,localDate(),null,'2030-04-20');
 const bottle=(await readData()).products.find(p=>p.id===product.id)!;
 expect(bottle.status).toBe('paused');expect(bottle.paoMonths).toBeNull();expect(lifecycle(bottle)!.date).toBe('2030-04-20');
});
it('rejects stale saves and invalid dates or PAO without altering the product',async()=>{
 const product=(await readData()).products[0];
 await expect(openNewBottle(product.id,'stale',localDate(),12,'')).rejects.toThrow('changed');
 for(const [opened,pao,expiration] of [['2099-01-01',12,''],['2026-02-30',12,''],[localDate(),0,''],[localDate(),1.5,''],[localDate(),12,'invalid']] as const) await expect(openNewBottle(product.id,product.updatedAt,opened,pao,expiration)).rejects.toThrow();
 expect((await readData()).products.find(p=>p.id===product.id)).toEqual(product);
});
