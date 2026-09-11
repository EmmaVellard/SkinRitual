'use client';
import {createContext,useContext,useEffect,type ReactNode} from 'react';
import {translator,type Language} from '@/lib/i18n';
const LanguageContext=createContext<Language>('en');
export function LanguageProvider({language,children}:{language:Language;children:ReactNode}) {
 useEffect(()=>{document.documentElement.lang=language;},[language]);
 return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}
export function useLocale(){const language=useContext(LanguageContext);return {tr:translator(language),language,locale:language==='fr'?'fr-FR':'en-US'};}
