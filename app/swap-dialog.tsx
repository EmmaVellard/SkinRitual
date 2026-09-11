'use client';
import { useLocale } from './language';
import { useEffect, useRef } from 'react';
import type { SwapChoice } from '@/lib/routine-actions';
export default function SwapDialog({ name, candidates, busy, error, onClose, onSelect }: { name: string; candidates: SwapChoice[]; busy: boolean; error: string; onClose: () => void; onSelect: (id: string) => void }) {
 const {tr}=useLocale();
 const dialog = useRef<HTMLDialogElement>(null);
 useEffect(() => { const previous = document.activeElement as HTMLElement; dialog.current?.showModal(); return () => previous?.focus(); }, []);
 return <dialog className="editor" ref={dialog} aria-labelledby="swap-title" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}><div className="editor-heading"><div><p className="eyebrow">{tr("FOR THIS ROUTINE ONLY")}</p><h2 id="swap-title">{tr("Swap ")}{name}</h2></div><button className="icon-button" disabled={busy} onClick={onClose} aria-label={tr("Close swap options")}>×</button></div><div className="editor-body"><p className="field-help">{tr("Alternatives must fit your spacing, frequency, function, and intensity settings. Used steps stay unchanged. Linked oil and foam are kept together.")}</p>{error && <p role="alert" className="alert">{tr(error)}</p>}{candidates.length ? candidates.map(p => <button key={p.id} className="swap-option" disabled={busy} onClick={() => onSelect(p.id)}><strong>{p.name}</strong><span>{p.brand} · {p.products.length === 2 ? tr("Double cleanse") : tr(p.products[0].category)}</span>{p.manualTiming && <span>{tr("Manual choice for this morning; automatic double cleansing stays in the evening.")}</span>}</button>) : <p className="empty">{tr("No eligible alternatives right now. You can skip this step, or correct the record if you used something else.")}</p>}</div><div className="editor-footer"><button className="text-button" disabled={busy} onClick={onClose}>{tr("Cancel")}</button></div></dialog>;
}
