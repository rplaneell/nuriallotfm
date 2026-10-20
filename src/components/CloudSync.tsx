import { useState } from 'react';
import { Cloud, Copy, Download } from 'lucide-react';
import { Notice } from '@/components/ui';
import { downloadText } from '@/lib/io';
import { cloudAvailable, enableSaving, formatCode, resolveConflict, loadWithCode, stopSaving, syncNow, useCloud } from '@/lib/cloud';

const STATUS_TEXT = { off: '', inactive: '', checking: 'Checking your saved copy…', conflict: 'Needs your decision', synced: 'Saved', saving: 'Saving…', error: 'Could not save' } as const;

/** Settings section: keep shortlist and preferences across devices with a private recovery code (no email, no account). Hidden when the build has no cloud settings. */
export function CloudSync() {
  const { status, code, error, conflict } = useCloud();
  const [entering, setEntering] = useState(false);
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!cloudAvailable) return null;

  const shown = code ? formatCode(code) : '';
  const copy = async () => { try { await navigator.clipboard.writeText(shown); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* user can select the text */ } };

  return (
    <section className="rule-t pt-4 space-y-2" aria-labelledby="set-cloud">
      <h3 id="set-cloud" className="flex items-center gap-2"><Cloud className="h-4 w-4" aria-hidden /> Keep my data across devices</h3>
      <p className="small text-muted">Optional. No email and no account. Turn on saving to get a private recovery code, then type that code on any other browser or device to load your answers, shortlist, notes and settings there. Without it, everything stays in this browser only.</p>

      {!code ? (
        <div className="space-y-2">
          {!entering ? (
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-sm btn-primary" disabled={busy} onClick={async () => { setBusy(true); await enableSaving(); setBusy(false); }}>Turn on saving</button>
              <button className="btn btn-sm" onClick={() => { setEntering(true); setMsg(null); }}>I already have a code</button>
            </div>
          ) : (
            <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const err = await loadWithCode(input); setBusy(false); setMsg(err); if (!err) { setEntering(false); setInput(''); } }}>
              <label className="block small font-medium" htmlFor="cloud-code">Your recovery code</label>
              <input id="cloud-code" autoComplete="off" autoCapitalize="characters" spellCheck={false} className="min-h-10 w-full rounded-md border border-[var(--border)] bg-surface px-3 font-mono" value={input} onChange={(e) => setInput(e.target.value)} placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" />
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-sm btn-primary" disabled={busy || !input.trim()}>Load my data</button>
                <button type="button" className="btn btn-sm" onClick={() => { setEntering(false); setMsg(null); }}>Cancel</button>
              </div>
            </form>
          )}
          {msg && <div role="alert"><Notice tone="warn" title="Could not use that code">{msg}</Notice></div>}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="small" role="status">Saving is on. <span className="text-muted">{STATUS_TEXT[status]}</span></p>
          <div>
            <p className="small font-medium">Your recovery code</p>
            <p className="mt-1 select-all break-all rounded-md bg-sunken px-3 py-2 font-mono text-base" aria-label={`Recovery code: ${shown.split('').join(' ')}`}>{shown}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="btn btn-sm" onClick={() => void copy()}><Copy className="h-4 w-4" aria-hidden /> {copied ? 'Copied' : 'Copy code'}</button>
              <button className="btn btn-sm" onClick={() => downloadText('tfm-recovery-code.txt', `Migration Policy TFM Explorer recovery code\n\n${shown}\n\nAnyone with this code can open and change your saved data. Keep it private.\n`, 'text/plain')}><Download className="h-4 w-4" aria-hidden /> Save as a file</button>
            </div>
            <div className="mt-2"><Notice tone="warn" title="Keep this code safe">If you lose it and also clear this browser, your data cannot be recovered by anyone. Anyone who has the code can open and change your saved data, so do not share it.</Notice></div>
          </div>

          {status === 'conflict' && conflict && (
            <Notice tone="warn" title="This device and your saved copy have different data">
              <p>The saved copy was last updated {new Date(conflict.remoteAt).toLocaleString()}. Choose which to keep. The other one is overwritten, so download a backup first if unsure.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn btn-sm btn-primary" onClick={() => void resolveConflict('cloud')}>Use the saved copy</button>
                <button className="btn btn-sm" onClick={() => void resolveConflict('device')}>Keep this device’s copy</button>
              </div>
            </Notice>
          )}

          <div className="flex flex-wrap gap-2">
            {status === 'error' && <button className="btn btn-sm" onClick={() => void syncNow()}>Try again</button>}
            {!confirmStop ? <button className="btn btn-sm" onClick={() => setConfirmStop(true)}>Stop saving…</button> : (
              <Notice tone="warn" title="Stop saving on this device?">
                <p>Your data stays in this browser. You can also erase the saved copy, which makes the code stop working.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="btn btn-sm" onClick={() => { void stopSaving(false); setConfirmStop(false); }}>Stop, keep the saved copy</button>
                  <button className="btn btn-sm btn-primary" onClick={() => { void stopSaving(true); setConfirmStop(false); }}>Stop and erase the saved copy</button>
                  <button className="btn btn-sm" onClick={() => setConfirmStop(false)}>Cancel</button>
                </div>
              </Notice>
            )}
          </div>
        </div>
      )}
      {error && <div role="alert"><Notice tone="warn" title="Saving problem">{error}</Notice></div>}
    </section>
  );
}
