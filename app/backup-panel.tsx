'use client';
import { useLocale } from './language';
import { useState, type ChangeEvent } from 'react';
import { makeBackup, parseBackup, MAX_BACKUP_BYTES, type Backup } from '@/lib/backup';
import { readData, restoreBackup, undoRestore } from '@/lib/database';
type Mutate = (action: () => Promise<void>, message?: string) => Promise<boolean>;
export default function BackupPanel({ mutate, busy, canUndo }: { mutate: Mutate; busy: boolean; canUndo: boolean }) {
 const {tr,locale}=useLocale();
 const [preview, setPreview] = useState<Backup | null>(null);
 const [error, setError] = useState('');
 const [undoConfirm, setUndoConfirm] = useState(false);
 const [reading, setReading] = useState(false);
 async function download() {
  try { const { products, routines, settings } = await readData(); const backup = makeBackup({ products, routines, settings });
   const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
   const link = document.createElement('a'); link.href = url; link.download = `skin-ritual-${backup.exportedAt.slice(0, 10)}.json`; link.click();
   setTimeout(() => URL.revokeObjectURL(url), 30000); setError('');
  } catch { setError('Your backup could not be downloaded. Please try again.'); }
 }
 async function choose(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
  setReading(true); setPreview(null); setError('');
  try { if (file.size > MAX_BACKUP_BYTES) throw new Error('Choose a backup smaller than 10 MB.'); setPreview(parseBackup(await file.text())); }
  catch (e) { setError(e instanceof Error ? e.message : 'This backup could not be read.'); }
  finally { setReading(false); }
 }
 return <section className="backup-panel" aria-labelledby="backup-title"><h2 id="backup-title">{tr("Keep a copy.")}</h2><p>{tr("Your backup includes products, preferences, and all usage records. Save it somewhere private, such as Files on your phone.")}</p>
  <div className="backup-actions"><button className="primary" disabled={busy || reading} onClick={() => void download()}>{tr("Download backup")}</button><label className="file-button">{tr("Choose backup to restore")}<input type="file" accept="application/json,.json" disabled={busy || reading} onChange={e => void choose(e)} /></label></div>
  {reading && <p role="status">{tr("Reading backup…")}</p>}{error && <p role="alert" className="alert">{tr(error)}</p>}
  {preview && <div className="restore-preview"><h3>{tr("Review before restoring")}</h3><p>{tr("Saved ")}{new Date(preview.exportedAt).toLocaleString(locale)} · {preview.products.length} {tr("products · ")}{preview.routines.length} {tr("routines.")}</p><p>{tr("This replaces your current cabinet, preferences, and history. A local undo copy is kept until your next restore. Download a backup first if you want a permanent copy.")}</p><button className="primary" disabled={busy} onClick={() => void mutate(() => restoreBackup(preview), 'Backup restored.').then(ok => { if (ok) setPreview(null); })}>{tr("Replace with this backup")}</button><button className="text-button" disabled={busy} onClick={() => setPreview(null)}>{tr("Cancel")}</button></div>}
  {canUndo && <div className="restore-undo">{undoConfirm ? <><p>{tr("Return to the data from just before the last restore? Changes made since that restore will be replaced.")}</p><button className="primary" disabled={busy} onClick={() => void mutate(undoRestore, 'Previous data restored.').then(ok => { if (ok) setUndoConfirm(false); })}>{tr("Confirm undo restore")}</button><button className="text-button" disabled={busy} onClick={() => setUndoConfirm(false)}>{tr("Cancel")}</button></> : <button className="text-button" disabled={busy} onClick={() => setUndoConfirm(true)}>{tr("Undo last restore")}</button>}</div>}
 </section>;
}
