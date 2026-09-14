'use client';
import {useState} from 'react';
import {localDate,type Product} from '@/lib/model';
import {lifecycle} from '@/lib/dates';
import {useLocale} from './language';
export type BottleSave = (openedDate:string,paoMonths:number|null,expirationDate:string)=>Promise<boolean>;
export default function NewBottle({product,busy,error,onSave}:{product:Product;busy:boolean;error:string;onSave:BottleSave}) {
 const {tr,locale}=useLocale();const [editing,setEditing]=useState(false);const [saved,setSaved]=useState(false);
 const [opened,setOpened]=useState(localDate());const [pao,setPao]=useState(product.paoMonths===null?'':String(product.paoMonths));const [expiration,setExpiration]=useState('');
 const life=lifecycle(product,localDate(),locale);
 return <section className="new-bottle"><h3>{tr('Your current bottle')}</h3>{product.openedDate && <p>{tr('Date opened')} · {new Date(`${product.openedDate}T12:00:00`).toLocaleDateString(locale)}</p>}{life && <p className={life.days<=0?'lifecycle-label due':'field-help'}>{life.message}</p>}
 {!editing?<><button className="text-button" disabled={busy} onClick={()=>{setOpened(localDate());setPao(product.paoMonths===null?'':String(product.paoMonths));setExpiration('');setSaved(false);setEditing(true);}}>{tr('New bottle')}</button>{saved && <p role="status">{tr('New bottle saved. Your usage history is unchanged.')}</p>}</>:<form onSubmit={async e=>{e.preventDefault();if(await onSave(opened,pao===''?null:Number(pao),expiration)){setEditing(false);setSaved(true);}}}>
 <p className="field-help">{tr('Replaces the previous bottle’s dates and clears Almost empty and its rebuy reminder. Your usage history, favorites and routine rules stay unchanged.')}</p>
 <div className="form-grid"><label>{tr('Date opened')}<input required type="date" max={localDate()} value={opened} onChange={e=>setOpened(e.target.value)} disabled={busy}/></label><label>{tr('PAO (months)')}<input type="number" min={1} max={120} step={1} value={pao} onChange={e=>setPao(e.target.value)} disabled={busy}/></label></div>
 <label>{tr('Printed expiration date')} · {tr('Optional')}<input type="date" value={expiration} onChange={e=>setExpiration(e.target.value)} disabled={busy}/></label>
 <p className="field-help">{tr('Check the PAO on the new packaging. The previous printed expiration is cleared; enter the new one if shown.')}</p>
 {product.status==='finished' && <p className="field-help">{tr('This finished product will become active again.')}</p>}{product.status==='paused' && <p className="field-help">{tr('This product will stay paused.')}</p>}
 {error && <p role="alert" className="alert">{tr(error)}</p>}<div className="backup-actions"><button type="submit" className="primary" disabled={busy}>{tr('Save new bottle')}</button><button type="button" className="text-button" disabled={busy} onClick={()=>setEditing(false)}>{tr('Cancel')}</button></div>
 </form>}</section>;
}
