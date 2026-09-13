'use client';
import {useMemo} from 'react';
import {Sun,Moon,ArrowUpRight} from 'lucide-react';
import {useLocale} from './language';
import {type Product,type RoutineLog,type RoutineSettings,type Period} from '@/lib/model';
import {moveDate,dateLabel} from '@/lib/dates';
import {previewRoutine} from '@/lib/insights';
export default function WeekOverview({products,routines,settings,start,onSelect}:{products:Product[];routines:RoutineLog[];settings:RoutineSettings;start:string;onSelect:(date:string,period:Period)=>void}) {
 const {tr,locale}=useLocale();
 const days=useMemo(()=>Array.from({length:7},(_,i)=>{const date=moveDate(start,i);return {date,sessions:(['morning','evening'] as const).map(period=>{const log=routines.find(r=>r.date===date && r.timeOfDay===period);const steps=(log?.steps ?? previewRoutine(products,period,routines,date,settings).steps).filter(s=>!s.skipped && !s.replacedById);return {period,steps,recorded:!!log};})};}),[products,routines,settings,start]);
 return <section className="week-overview" aria-labelledby="week-title"><header className="week-overview-heading"><h2 id="week-title">{tr('Seven days at a glance')}</h2><p>{new Date(`${start}T12:00:00`).toLocaleDateString(locale,{day:'numeric',month:'short'})} — {new Date(`${moveDate(start,6)}T12:00:00`).toLocaleDateString(locale,{day:'numeric',month:'short'})}</p></header>
 <div className="week-sessions-heading"><span/><span><Sun size={15}/>{tr('Morning')}</span><span><Moon size={15}/>{tr('Evening')}</span></div>
 <div className="week-days">{days.map(day=><div className="week-day" key={day.date}><time dateTime={day.date}><span>{new Date(`${day.date}T12:00:00`).toLocaleDateString(locale,{weekday:'short'})}</span><strong>{new Date(`${day.date}T12:00:00`).getDate()}</strong></time>{day.sessions.map(s=>{
 const focus=['Mask','Exfoliant','Pad','Treatment','Serum / ampoule','Mist / toner'].find(category=>s.steps.some(p=>p.category===category));
 const label=focus==='Serum / ampoule'?'Serum care':focus==='Mist / toner'?'Hydration':focus || 'Essentials';
 return <button className="week-session" key={s.period} onClick={()=>onSelect(day.date,s.period)} title={s.steps.map(p=>p.name).join(' · ')} aria-label={`${dateLabel(day.date,locale)} · ${tr(s.period==='morning'?'Morning':'Evening')} · ${tr(label)} · ${s.steps.length} ${tr('steps')}`}><strong>{tr(label)}<ArrowUpRight size={13}/></strong><span>{s.steps.length} {tr('steps')}<span className="week-saved">{s.recorded?tr('Saved'):tr('Preview')}</span></span></button>;
 })}</div>)}</div><p className="week-caption">{tr('Tap a morning or evening to see its products. Future routines are projections, not recorded usage.')}</p></section>;
}
