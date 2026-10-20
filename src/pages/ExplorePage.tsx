import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '@/store/useApp';
import { MODE_INFO } from '@/data/modes';
import { Notice, PageHeader, Segmented } from '@/components/ui';
import type { ExploreMode, UiPrefs } from '@/types';

const MODES = Object.keys(MODE_INFO) as ExploreMode[];

/** Module B. Deliberately separate from the research-interest test: this changes the interface, not the topics. */
export default function ExplorePage() {
  const ui = useApp((s) => s.ui);
  const setUi = useApp((s) => s.setUi);
  const toggleMode = useApp((s) => s.toggleMode);
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  const steps = ['Ways of exploring', 'Detail and breadth', 'Format'];
  const finish = () => { setUi({ completed: true }); nav('/'); };

  return (
    <div>
      <PageHeader eyebrow="Module B · Interface" title="How do you want to explore?">
        This changes how the app is laid out and what it puts first. It does not change your research interests: preferring maps does not mean you prefer geographic research. You can change it any time in Settings.
      </PageHeader>

      <ol className="mb-6 flex flex-wrap gap-2" aria-label="Steps">
        {steps.map((s, i) => <li key={s}><button className="chip" aria-current={i === step ? 'step' : undefined} aria-pressed={i === step} onClick={() => setStep(i)}>{i + 1}. {s}</button></li>)}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section className="card p-6">
          {step === 0 && (
            <fieldset>
              <legend className="mb-1 font-medium">Which of these suit you? Choose one or combine several.</legend>
              <p className="mb-4 small text-muted">The first one you choose decides the navigation order and the page that leads.</p>
              <div className="grid gap-3">
                {MODES.map((m) => {
                  const on = ui.modes.includes(m);
                  return (
                    <label key={m} className={clsx('flex cursor-pointer gap-3 rounded-[var(--radius-card)] border p-3 hover:bg-sunken has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent', on ? 'border-accent bg-accent-soft' : 'border-rule bg-surface')}>
                      <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" checked={on} onChange={() => toggleMode(m)} />
                      <span><span className="block font-medium">{MODE_INFO[m].label}</span><span className="block small text-muted">{MODE_INFO[m].blurb}</span><span className="block small mt-1">What changes: {MODE_INFO[m].effect}</span></span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
          {step === 1 && (
            <div className="space-y-6">
              <div><p className="mb-2 font-medium">How much detail do you prefer?</p>
                <Segmented label="Detail" value={ui.detail} onChange={(v: UiPrefs['detail']) => setUi({ detail: v })} options={[{ value: 'brief', label: 'Brief: essentials only' }, { value: 'standard', label: 'Standard' }, { value: 'deep', label: 'Deep: everything open' }]} /></div>
              <div><p className="mb-2 font-medium">Broad exploration or focused recommendations?</p>
                <Segmented label="Breadth" value={ui.breadth} onChange={(v: UiPrefs['breadth']) => setUi({ breadth: v })} options={[{ value: 'broad', label: 'Broad: show many options' }, { value: 'focused', label: 'Focused: a few clear picks' }]} /></div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div><p className="mb-2 font-medium">Visual comparisons or written explanations?</p>
                <Segmented label="Format" value={ui.format} onChange={(v: UiPrefs['format']) => setUi({ format: v })} options={[{ value: 'visual', label: 'Visual: charts and bars' }, { value: 'balanced', label: 'Balanced' }, { value: 'written', label: 'Written: prose first' }]} /></div>
              <Notice>Prefer to see everything? Turn on the complete overview in Settings. It ignores these choices and shows every module and section.</Notice>
            </div>
          )}
          <div className="mt-6 flex justify-between gap-2 rule-t pt-4">
            <button className="btn" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</button>
            {step < 2 ? <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Next</button> : <button className="btn btn-primary" onClick={finish}><Check className="h-4 w-4" aria-hidden /> Apply and go to Home</button>}
          </div>
        </section>

        <aside aria-label="Preview" className="card h-fit p-5 small">
          <p className="eyebrow mb-2">Your current choices</p>
          <p><strong>Modes:</strong> {ui.fullOverview ? 'complete overview' : ui.modes.map((m) => MODE_INFO[m].label).join(', ')}</p>
          <p><strong>Detail:</strong> {ui.detail}</p>
          <p><strong>Exploration:</strong> {ui.breadth}</p>
          <p><strong>Format:</strong> {ui.format}</p>
          <p className="mt-3 text-muted">{MODE_INFO[ui.modes[0]].effect}</p>
          <Link to="/" className="mt-3 inline-block">See Home with these settings</Link>
        </aside>
      </div>
    </div>
  );
}
