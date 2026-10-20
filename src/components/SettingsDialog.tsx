import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { Dialog, Label, Notice, Segmented } from '@/components/ui';
import { CloudSync } from '@/components/CloudSync';
import { useApp } from '@/store/useApp';
import { MODE_INFO } from '@/data/modes';
import type { ExploreMode } from '@/types';

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const ui = useApp((s) => s.ui);
  const setUi = useApp((s) => s.setUi);
  const toggleMode = useApp((s) => s.toggleMode);
  const resetUi = useApp((s) => s.resetUi);
  const resetAll = useApp((s) => s.resetAll);
  const [confirm, setConfirm] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setConfirm(false); }} side title="How the app looks and behaves" description="These settings change the interface only. Your research interests are in the orientation test.">
      <div className="space-y-6">
        <section aria-labelledby="set-modes" className="space-y-2">
          <h3 id="set-modes">Ways of exploring</h3>
          <p className="small text-muted">Choose one or several. They reorder navigation and change what each page puts first.</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MODE_INFO) as ExploreMode[]).map((m) => (
              <button key={m} type="button" className="chip" aria-pressed={ui.modes.includes(m)} onClick={() => toggleMode(m)}>{MODE_INFO[m].label}</button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <Label>Amount of detail</Label>
          <Segmented label="Amount of detail" value={ui.detail} onChange={(v) => setUi({ detail: v })} options={[{ value: 'brief', label: 'Brief' }, { value: 'standard', label: 'Standard' }, { value: 'deep', label: 'Deep' }]} />
        </section>
        <section className="space-y-2">
          <Label>Exploration</Label>
          <Segmented label="Exploration" value={ui.breadth} onChange={(v) => setUi({ breadth: v })} options={[{ value: 'broad', label: 'Broad: show more options' }, { value: 'focused', label: 'Focused: fewer, clearer picks' }]} />
        </section>
        <section className="space-y-2">
          <Label>Format</Label>
          <Segmented label="Format" value={ui.format} onChange={(v) => setUi({ format: v })} options={[{ value: 'visual', label: 'Visual comparisons' }, { value: 'balanced', label: 'Balanced' }, { value: 'written', label: 'Written explanations' }]} />
        </section>

        <section className="space-y-2">
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={ui.fullOverview} onChange={(e) => setUi({ fullOverview: e.target.checked })} />
            <span><span className="font-medium">Show the complete overview</span><br /><span className="small text-muted">Ignore the ways of exploring above and show every module and section at full detail.</span></span>
          </label>
        </section>

        <div className="flex flex-wrap gap-2 rule-t pt-4">
          <button className="btn btn-sm" onClick={resetUi}><RotateCcw className="h-4 w-4" aria-hidden /> Reset interface settings</button>
          <Link className="btn btn-sm" to="/explore" onClick={() => onOpenChange(false)}>Retake the “How do you want to explore?” test</Link>
        </div>

        <CloudSync />

        <section className="rule-t pt-4 space-y-2">
          <h3>Your data</h3>
          <p className="small text-muted">Everything is stored in this browser, plus an online copy if you turned on saving above. Backups and exports are on the Shortlist page.</p>
          {!confirm ? (
            <button className="btn btn-sm" onClick={() => setConfirm(true)}>Delete all my data…</button>
          ) : (
            <Notice tone="warn" title="Delete answers, topics, notes and settings?">
              <p>This cannot be undone. If saving is on, the online copy is emptied too. Export a backup first if you might want it back.</p>
              <div className="mt-2 flex gap-2">
                <button className="btn btn-sm btn-primary" onClick={() => { resetAll(); setConfirm(false); onOpenChange(false); }}>Yes, delete everything</button>
                <button className="btn btn-sm" onClick={() => setConfirm(false)}>Cancel</button>
              </div>
            </Notice>
          )}
        </section>
      </div>
    </Dialog>
  );
}
