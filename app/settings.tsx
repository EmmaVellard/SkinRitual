'use client';
import { useLocale } from './language';
import type { RoutineSettings } from '@/lib/model';
import BackupPanel from './backup-panel';
type Mutate = (action:()=>Promise<void>,message?:string)=>Promise<boolean>;
function Choices({title,value,options,busy,onChange}:{title:string;value:string;options:{value:string;label:string}[];busy:boolean;onChange:(value:string)=>void}) {
 return <fieldset className="setting-choices" disabled={busy}><legend>{title}</legend><div className="choice-menu">{options.map(option=><button type="button" key={option.value} aria-pressed={value===option.value} onClick={()=>onChange(option.value)}>{option.label}</button>)}</div></fieldset>;
}
export default function SettingsPage({settings,onSave,mutate,busy,canUndo}:{settings:RoutineSettings;onSave:(s:RoutineSettings)=>void;mutate:Mutate;busy:boolean;canUndo:boolean}) {
 const {tr}=useLocale();
 return <><div className="page-heading"><div><p className="eyebrow">{tr('MAKE IT YOURS')}</p><h1>{tr('Settings.')}</h1></div></div>
 <div className="settings-grid">
  <section className="settings-card"><h2>{tr('Language')}</h2><Choices title={tr('App language')} value={settings.language ?? 'en'} busy={busy} options={[{value:'en',label:'English'},{value:'fr',label:'Français'}]} onChange={language=>onSave({...settings,language:language as 'en'|'fr'})}/><p className="field-help">{tr('Your product names and personal notes stay as you wrote them.')}</p></section>
  <section className="settings-card"><h2>{tr('Routine preferences')}</h2>
   <Choices title={tr('Morning start')} value={settings.morningStart ?? 'cleanser'} busy={busy} options={[{value:'cleanser',label:tr('Cleanser when eligible')},{value:'mist',label:tr('Mist first · no cleanser suggested')}]} onChange={value=>onSave({...settings,morningStart:value as 'cleanser'|'mist'})}/>
   <p className="field-help">{tr('A mist hydrates; it does not cleanse. Water-only morning washing may suit dry or sensitive skin. This preference applies to unstarted routines and keeps your optional-step limit.')} <a href="https://health.clevelandclinic.org/how-often-should-you-wash-your-face" target="_blank" rel="noopener noreferrer">Cleveland Clinic ↗</a></p>
   <Choices title={tr('Routine intensity')} value={settings.intensity} busy={busy} options={[{value:'gentle',label:tr('Gentle · no intensive optional products')},{value:'normal',label:tr('Normal · at most one intensive product')},{value:'active',label:tr('Active · at most two intensive products')}]} onChange={intensity=>onSave({...settings,intensity:intensity as RoutineSettings['intensity']})}/>
   <Choices title={tr('Optional steps (evening)')} value={String(settings.maxOptionalSteps)} busy={busy} options={[0,1,2,3].map(n=>({value:String(n),label:String(n)}))} onChange={value=>onSave({...settings,maxOptionalSteps:Number(value)})}/>
   <Choices title={tr('Evening pads')} value={settings.preferEveningPads?'prefer':'rotate'} busy={busy} options={[{value:'prefer',label:tr('Prioritize a pad when eligible')},{value:'rotate',label:tr('Rotate all optional products equally')}]} onChange={value=>onSave({...settings,preferEveningPads:value==='prefer'})}/>
   <Choices title={tr('Pore pads and clay masks')} value={settings.avoidPoreSameDay?'separate':'allow'} busy={busy} options={[{value:'separate',label:tr('Keep on separate days')},{value:'allow',label:tr('Use my intensity limit only')}]} onChange={value=>onSave({...settings,avoidPoreSameDay:value==='separate'})}/>
   <p className="field-help">{tr('Morning has at most one optional step. Preferences apply to unstarted routines; they do not guarantee skin tolerance.')}</p>
  </section>
  <section className="settings-card"><h2>{tr('Your device & privacy')}</h2><p>{tr('Your cabinet and history stay in this browser. No account, analytics or cloud sync.')}</p><p>{tr('Clearing website data removes your records. Keep a backup somewhere private.')}</p><p>{tr('On iPhone: Safari → Share → Add to Home Screen. Use the same browser or Home Screen app consistently.')}</p></section>
 </div><BackupPanel mutate={mutate} busy={busy} canUndo={canUndo}/></>;
}
