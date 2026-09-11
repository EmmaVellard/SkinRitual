'use client';
import { useLocale } from './language';
import {useEffect,useRef} from 'react';
import type {Product} from '@/lib/model';
import ProductGuide from './product-guide';
export default function ProductDetails({product,onClose,onEdit,onTag,busy}:{product:Product;onClose:()=>void;onEdit:()=>void;onTag:()=>void;busy:boolean}) {
 const {tr}=useLocale();
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement;dialog.current?.showModal();return()=>previous?.focus();},[]);
 return <dialog className="editor product-details" ref={dialog} onCancel={onClose} aria-labelledby="product-details-title"><div className="editor-heading"><div><p className="eyebrow">{product.brand}</p><h2 id="product-details-title">{product.name}</h2></div><button className="icon-button" aria-label={tr("Close product details")} onClick={onClose}>×</button></div><div className="editor-body"><ProductGuide product={product}/><p className="field-help">{product.timeOfDay==='both'?tr("Morning & evening"):product.timeOfDay==='morning'?tr("Morning"):tr("Evening")}</p>{product.notes && <section className="personal-notes"><h3>{tr("Your notes")}</h3><p>{product.notes}</p></section>}<button className="stock-tag" aria-pressed={!!product.almostEmpty} disabled={busy} onClick={onTag}>{product.almostEmpty?tr("On your rebuy list · undo"):tr("Almost empty · add to rebuy")}</button></div><div className="editor-footer"><button className="text-button" onClick={onClose}>{tr("Close")}</button><button className="primary" onClick={onEdit}>{tr("Edit product settings")}</button></div></dialog>;
}
