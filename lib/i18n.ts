import fr from './fr.json';
export type Language = 'en' | 'fr';
const dictionary: Record<string,string> = fr;
const escape = (s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const templates=Object.entries(dictionary).filter(([key])=>/\{\d+\}/.test(key)).map(([key,value])=>({pattern:new RegExp('^'+key.split(/\{\d+\}/).map(escape).join('(.*?)')+'$'),value}));
export function translator(language: Language) {
 return function tr(input:string,...args:(string|number)[]):string {
  const key=input.trim().replace(/\s+/g,' ');let value=language==='fr' ? dictionary[key] ?? key : key;
  if(language==='fr' && !dictionary[key] && !args.length) for(const template of templates) { const match=key.match(template.pattern);if(match){value=template.value.replace(/\{(\d+)\}/g,(_,i)=>match[Number(i)+1] ?? '');break;} }
  value=value.replace(/\{(\d+)\}/g,(token,i)=>args[Number(i)]===undefined ? token : String(args[Number(i)]));
  return (input.startsWith(' ')?' ':'')+value+(input.endsWith(' ')?' ':'');
 };
}
