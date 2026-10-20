import { useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { useApp } from '@/store/useApp';
import { useBackend } from '@/lib/backend';
import { useProfile, useTopicView } from '@/store/derived';
import { ambitionTradeoffs, defaultLab, LEVEL_OPTIONS, POP_LABEL, SCOPE_LABEL } from '@/lib/lab';
import { overall, scoreCriteria } from '@/lib/feasibility';
import { METHODS } from '@/data/taxonomy';
import { ROLES } from '@/data/careers';
import { topicById } from '@/data/topics';
import { EvidenceBadge, Label, Notice, SelectField, Segmented, Slider, ErrorNote } from '@/components/ui';
import type { Ambition, LabParams, ScopeId } from '@/types';

const AMB_LABEL: Record<Ambition, string> = { ambitious: 'Ambitious', balanced: 'Balanced and feasible', 'lower-risk': 'Lower risk' };

export function TopicLab({ topicId }: { topicId: string }) {
  const topic = topicById(topicId)!;
  const view = useTopicView(topicId)!;
  const profile = useProfile();
  const setLab = useApp((s) => s.setLab);
  const replaceLab = useApp((s) => s.replaceLab);
  const resetLab = useApp((s) => s.resetLab);
  const edits = useApp((s) => s.edits);
  const setEdit = useApp((s) => s.setEdit);
  const clearEdit = useApp((s) => s.clearEdit);
  const lab = view.lab;
  const backend = useBackend();
  const versions = ambitionTradeoffs(topic, profile);

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <form className="card h-fit space-y-4 p-4" aria-label="Refinement controls" onSubmit={(e) => e.preventDefault()}>
        <div className="flex items-center justify-between"><h3>Controls</h3><button type="button" className="btn btn-sm btn-ghost" onClick={() => resetLab(topicId)} disabled={view.labIsDefault}><RotateCcw className="h-4 w-4" aria-hidden /> Reset</button></div>
        <SelectField<ScopeId> label="Geographic scope" value={lab.scope} onChange={(v) => setLab(topicId, { scope: v })} options={(Object.keys(SCOPE_LABEL) as ScopeId[]).map((k) => ({ value: k, label: SCOPE_LABEL[k] }))} />
        <SelectField label="Institutional level" value={lab.level} onChange={(v) => setLab(topicId, { level: v })} options={LEVEL_OPTIONS.map((l) => ({ value: l, label: l === 'eu' ? 'EU' : l[0].toUpperCase() + l.slice(1) }))} />
        <div className="space-y-1"><Label hint={`${lab.cases}`}>Comparative cases</Label><Slider value={lab.cases} min={1} max={6} onChange={(v) => setLab(topicId, { cases: v })} label="Number of comparative cases" valueText={`${lab.cases} cases`} /></div>
        <div><Label>Breadth of the question</Label><Segmented label="Breadth" value={lab.breadth} onChange={(v) => setLab(topicId, { breadth: v })} options={[{ value: 'narrow', label: 'Narrow' }, { value: 'medium', label: 'Medium' }, { value: 'broad', label: 'Broad' }]} /></div>
        <div><Label>Focus</Label><Segmented label="Focus" value={lab.focus} onChange={(v) => setLab(topicId, { focus: v })} options={[{ value: 'design', label: 'Design' }, { value: 'implementation', label: 'Implementation' }, { value: 'evaluation', label: 'Evaluation' }]} /></div>
        <SelectField label="Method" value={lab.method} onChange={(v) => setLab(topicId, { method: v })} options={[{ value: 'auto', label: 'Recommended for these settings' }, ...METHODS.map((m) => ({ value: m.id, label: m.label }))]} />
        <div className="space-y-1"><Label hint={lab.orientation < 35 ? 'academic' : lab.orientation > 65 ? 'practical' : 'balanced'}>Academic ↔ practical</Label><Slider value={lab.orientation} onChange={(v) => setLab(topicId, { orientation: v })} label="Academic versus practical emphasis" valueText={`${lab.orientation} out of 100`} /></div>
        <div className="space-y-1"><Label hint={`${lab.technical} of 5`}>Technical ambition</Label><Slider value={lab.technical} min={1} max={5} onChange={(v) => setLab(topicId, { technical: v as LabParams['technical'] })} label="Technical ambition" valueText={`${lab.technical} out of 5`} /></div>
        <div><Label>Data-collection load</Label><Segmented label="Data load" value={lab.dataLoad} onChange={(v) => setLab(topicId, { dataLoad: v })} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} /></div>
        <SelectField label="Target population" value={lab.population} onChange={(v) => setLab(topicId, { population: v })} options={(Object.keys(POP_LABEL) as LabParams['population'][]).map((k) => ({ value: k, label: POP_LABEL[k] || 'All migrants / no specific group' }))} />
        <SelectField label="Professional direction" value={lab.careerRole} onChange={(v) => setLab(topicId, { careerRole: v })} options={[{ value: 'none', label: 'None chosen' }, ...ROLES.map((r) => ({ value: r.id, label: r.label }))]} />
      </form>

      <div className="space-y-6">
        <section className="card p-5" aria-labelledby="lab-rq" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2"><h3 id="lab-rq">Research question</h3>{edits[topicId]?.rq ? <EvidenceBadge status="interpretation" label="Edited by you" /> : <EvidenceBadge status="hypothesis" />}</div>
          <p className="mt-2 text-[1.0625rem]">{view.rq}</p>
          <RqEditor topicId={topicId} generated={view.result.rq} current={edits[topicId]?.rq} onSave={(t) => setEdit(topicId, { rq: t })} onClear={() => clearEdit(topicId)} />
          <ul className="mt-4 list-disc space-y-1 pl-5 small">{view.result.subs.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>

        <section className="card p-5">
          <h3>Method and evidence needed</h3>
          <p className="mt-2 small">{view.result.methodWhy}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 small">{view.result.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>
          <p className="mt-3 small text-muted">Estimated workload: about <strong className="text-ink">{view.result.workloadWeeks} weeks</strong> part-time{view.result.workloadNotes.length ? ` (${view.result.workloadNotes.join('; ')})` : ''}. A planning estimate, not a measurement.</p>
          {view.result.warnings.map((w, i) => <div key={i} className="mt-3"><Notice tone="warn">{w}</Notice></div>)}
        </section>

        <section className="card p-5" aria-labelledby="lab-eff">
          <h3 id="lab-eff">What your changes did to feasibility</h3>
          {view.result.reasons.length === 0 ? <p className="mt-2 small text-muted">No changes from the default. Adjust a control to see its effect.</p> : (
            <ul className="mt-2 space-y-1 small">{view.result.reasons.map((r, i) => <li key={i}><span className={r.delta > 0 ? 'text-ok' : 'text-bad'}>{r.delta > 0 ? '+' : ''}{r.delta.toFixed(1)}</span> {view.criteria.find((c) => c.id === r.criterion)?.label}: {r.reason}</li>)}</ul>
          )}
          <p className="mt-3 small">Overall (1–5): <strong>{view.overall.score.toFixed(2)}</strong> <span className="text-muted">(plausible range {view.overall.low.toFixed(1)}–{view.overall.high.toFixed(1)})</span></p>
        </section>

        <section className="card p-5" aria-labelledby="lab-3">
          <h3 id="lab-3">Three versions of this topic</h3>
          <p className="mt-1 small text-muted">Generated from the same engine with different settings. Pick one to load it into the controls.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {versions.map(({ ambition, lab: l, res }) => {
              const sc = scoreCriteria(topic, profile, res.deltas);
              const ov = overall(sc);
              return (
                <div key={ambition} className="rounded-md border border-rule p-3 small">
                  <p className="font-medium">{AMB_LABEL[ambition]}</p>
                  <p className="mt-1">{res.rq}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-2 text-muted"><dt>Workload</dt><dd className="text-ink">~{res.workloadWeeks} wks</dd><dt>Method</dt><dd className="text-ink">{METHODS.find((m) => m.id === res.methodId)?.label}</dd><dt>Overall</dt><dd className="text-ink">{ov.score.toFixed(2)}</dd><dt>Scope score</dt><dd className="text-ink">{sc.find((c) => c.id === 'scope')!.score.toFixed(1)}</dd></dl>
                  <p className="mt-2 text-muted">{ambition === 'ambitious' ? 'Trade-off: stronger contribution and portfolio, but more reading, more data work and a higher chance of not finishing.' : ambition === 'lower-risk' ? 'Trade-off: finishes reliably with public documents, but is less distinctive and says less about generalisation.' : 'Trade-off: the defaults for this topic.'}</p>
                  <button className="btn btn-sm mt-2" onClick={() => replaceLab(topicId, l)}>Load this version</button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-5">
          <h3>Alternative narrower questions</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 small">{topic.alternatives.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </section>

        {backend && <AiPanel question={view.rq} topicTitle={topic.title} />}
        <p className="small text-muted">The default lab is {defaultLab(topic).focus}-focused with {defaultLab(topic).cases} case(s) for this topic.</p>
      </div>
    </div>
  );
}

function RqEditor({ generated, current, onSave, onClear }: { topicId: string; generated: string; current?: string; onSave: (t: string) => void; onClear: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(current ?? generated);
  if (!open) return <div className="mt-3 flex gap-2"><button className="btn btn-sm" onClick={() => { setText(current ?? generated); setOpen(true); }}>Edit in my own words</button>{current && <button className="btn btn-sm btn-ghost" onClick={onClear}>Use generated question</button>}</div>;
  return (
    <div className="mt-3 space-y-2">
      <label htmlFor="rq-edit" className="small font-medium">Your version of the question</label>
      <textarea id="rq-edit" className="field" maxLength={600} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2"><button className="btn btn-sm btn-primary" onClick={() => { onSave(text); setOpen(false); }}>Save</button><button className="btn btn-sm" onClick={() => setOpen(false)}>Cancel</button></div>
    </div>
  );
}

function AiPanel({ question, topicTitle }: { question: string; topicTitle: string }) {
  const [instr, setInstr] = useState('Suggest narrower and more researchable versions.');
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'ok' | 'error'; text?: string; error?: string }>({ status: 'idle' });
  const run = async () => {
    setState({ status: 'loading' });
    try {
      const r = await fetch('/api/ai/refine', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question, instruction: instr, context: topicTitle }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setState({ status: 'error', error: j.error ?? `Service returned ${r.status}. Is the local research service running (npm run start)?` });
      else setState({ status: 'ok', text: j.text });
    } catch { setState({ status: 'error', error: 'Could not reach the local research service. Start it with “npm run start”. The rest of the app works without it.' }); }
  };
  return (
    <section className="card p-5" aria-labelledby="ai-h">
      <div className="flex flex-wrap items-center gap-2"><h3 id="ai-h"><Sparkles className="mr-1 inline h-4 w-4" aria-hidden />Optional AI brainstorming</h3><span className="badge badge-warn">AI-generated, not evidence</span></div>
      <p className="mt-1 small text-muted">Needs the local service and an API key set on the server (see README). Nothing here is verified; the app sends only the question text you see above.</p>
      <label htmlFor="ai-i" className="mt-3 block small font-medium">What do you want help with?</label>
      <input id="ai-i" className="field" value={instr} maxLength={300} onChange={(e) => setInstr(e.target.value)} />
      <button className="btn btn-sm mt-2" onClick={run} disabled={state.status === 'loading'}>{state.status === 'loading' ? 'Asking…' : 'Suggest alternatives'}</button>
      {state.status === 'error' && <div className="mt-3"><ErrorNote title="AI help is not available">{state.error}</ErrorNote></div>}
      {state.status === 'ok' && (
        <div className="mt-3 space-y-2"><pre className="whitespace-pre-wrap rounded-md bg-sunken p-3 small font-sans">{state.text}</pre><p className="small text-muted">Copy anything useful into “Edit in my own words” and check it yourself.</p>
          <button className="btn btn-sm" onClick={() => setState({ status: 'idle' })}>Dismiss</button></div>
      )}
    </section>
  );
}
