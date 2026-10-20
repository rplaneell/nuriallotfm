import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, HelpCircle, SkipForward } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '@/store/useApp';
import { STAGES, optionsFor, visibleQuestions } from '@/data/questions';
import { stageProgress, progress } from '@/lib/profile';
import { Meter, PageHeader, Slider } from '@/components/ui';
import type { Question, QOption } from '@/types';

const optionCls = 'flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-rule bg-surface p-3 hover:bg-sunken has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent';

export default function TestPage() {
  const answers = useApp((s) => s.answers);
  const setAnswer = useApp((s) => s.setAnswer);
  const clearAnswer = useApp((s) => s.clearAnswer);
  const resetTest = useApp((s) => s.resetTest);
  const [params, setParams] = useSearchParams();
  const visible = useMemo(() => visibleQuestions(answers), [answers]);
  const prog = progress(answers);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const wanted = params.get('q');
  const found = wanted ? visible.findIndex((q) => q.id === wanted) : -1;
  const idx = Math.max(0, found);
  const q = visible[idx] ?? visible[0];

  // Resume at the first unanswered question once, when the page opens without a ?q= parameter.
  const resumed = useRef(false);
  useEffect(() => {
    if (resumed.current || wanted) return;
    resumed.current = true;
    const first = visible.find((x) => !answers[x.id]) ?? visible[0];
    if (first) setParams({ q: first.id }, { replace: true });
  }, [wanted, visible, answers, setParams]);
  const [confirmReset, setConfirmReset] = useState(false);

  const go = (i: number) => {
    const target = visible[Math.min(visible.length - 1, Math.max(0, i))];
    if (target) setParams({ q: target.id }, { replace: true });
  };
  useEffect(() => { headingRef.current?.focus({ preventScroll: false }); }, [q?.id]);

  if (!q) return null;
  const finished = prog.done >= prog.total;
  const stage = STAGES[q.stage - 1];
  const ans = answers[q.id];
  const answeredEnough = Object.values(answers).filter((a) => !a.skipped && a.value !== undefined).length >= 6;

  return (
    <div>
      <PageHeader eyebrow="Module A · Orientation" title="Find out what you want to investigate">
        Realistic situations, short stages, no right answers. You can skip, say “not sure”, go back and change anything. Skipped questions count as unknown, not as “no”.
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside aria-label="Test stages" className="space-y-4">
          <div>
            <div className="flex justify-between small mb-1"><span>{prog.done} of {prog.total} answered or skipped</span><span className="tabular-nums">{prog.pct}%</span></div>
            <Meter value={prog.pct} max={100} label="Test progress" />
          </div>
          <ol className="space-y-1">
            {STAGES.map((s) => {
              const sp = stageProgress(answers, s.n);
              const firstQ = visible.find((x) => x.stage === s.n);
              const current = q.stage === s.n;
              return (
                <li key={s.n}>
                  <button type="button" className={clsx('flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-sunken', current && 'bg-accent-soft')} aria-current={current ? 'step' : undefined} onClick={() => firstQ && go(visible.indexOf(firstQ))}>
                    <span aria-hidden className={clsx('grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs', sp.done >= sp.total && sp.total > 0 ? 'border-ok bg-ok-soft text-ok' : 'border-rule text-muted')}>{sp.done >= sp.total && sp.total > 0 ? <Check className="h-3.5 w-3.5" /> : s.n}</span>
                    <span className="small"><span className="block font-medium">{s.title}</span><span className="text-muted">{sp.done}/{sp.total}</span></span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="space-y-2 rule-t pt-4">
            <Link className={clsx('btn w-full', answeredEnough && 'btn-primary')} to="/profile" aria-disabled={!answeredEnough} onClick={(e) => { if (!answeredEnough) e.preventDefault(); }}>
              {finished ? 'See my profile' : 'See profile so far'}
            </Link>
            {!answeredEnough && <p className="small text-muted">Answer at least six questions to see a profile.</p>}
            {!confirmReset ? <button className="btn btn-ghost btn-sm w-full" onClick={() => setConfirmReset(true)}>Start over…</button> : (
              <div role="alert" className="small space-y-2"><p>Clear all test answers and profile edits?</p><div className="flex gap-2"><button className="btn btn-sm btn-primary" onClick={() => { resetTest(); setConfirmReset(false); setParams({}, { replace: true }); }}>Clear</button><button className="btn btn-sm" onClick={() => setConfirmReset(false)}>Keep</button></div></div>
            )}
          </div>
        </aside>

        <section aria-labelledby="q-prompt" className="card p-6">
          <p className="eyebrow mb-1">Stage {q.stage} of {STAGES.length} · {stage.title}</p>
          <p className="small text-muted mb-4">{stage.blurb}</p>
          {q.followUpOf && <p className="mb-2"><span className="badge badge-accent">Follow-up to your earlier answer</span></p>}
          <h2 id="q-prompt" ref={headingRef} tabIndex={-1} className="!text-[1.3125rem] outline-none">{q.prompt}</h2>
          {q.help && <p className="mt-2 text-muted small prose-calm">{q.help}</p>}

          <div className="mt-5"><QuestionInput q={q} /></div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rule-t pt-4">
            <button className="btn" onClick={() => go(idx - 1)} disabled={idx === 0}><ArrowLeft className="h-4 w-4" aria-hidden /> Back</button>
            <div className="flex flex-wrap gap-2">
              {q.kind !== 'text' && (
                <button className="btn" aria-pressed={!!ans?.unsure} onClick={() => {
                  if (ans && !ans.skipped && ans.value !== undefined) setAnswer(q.id, { value: ans.value, unsure: !ans.unsure });
                  else if (ans?.skipped && ans.unsure) clearAnswer(q.id);
                  else setAnswer(q.id, { skipped: true, unsure: true });
                }} title="With an answer selected, it counts at half weight. Without one, it records “I don’t know”.">
                  <HelpCircle className="h-4 w-4" aria-hidden /> Not sure
                </button>
              )}
              <button className="btn" onClick={() => { setAnswer(q.id, { skipped: true }); go(idx + 1); }}><SkipForward className="h-4 w-4" aria-hidden /> Skip</button>
              {ans && <button className="btn btn-ghost" onClick={() => clearAnswer(q.id)}>Clear answer</button>}
              {idx < visible.length - 1 ? (
                <button className="btn btn-primary" onClick={() => go(idx + 1)}>Next <ArrowRight className="h-4 w-4" aria-hidden /></button>
              ) : (
                <Link className="btn btn-primary" to="/profile">Finish and see my profile <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              )}
            </div>
          </div>
          <p className="sr-only" role="status" aria-live="polite">Question {idx + 1} of {visible.length}</p>
        </section>
      </div>
    </div>
  );
}

function QuestionInput({ q }: { q: Question }) {
  const answers = useApp((s) => s.answers);
  const setAnswer = useApp((s) => s.setAnswer);
  const ans = answers[q.id];
  const opts = optionsFor(q, answers);
  const val = ans?.skipped ? undefined : ans?.value;
  const unsure = ans?.unsure;
  const save = (value: string | string[] | number) => setAnswer(q.id, { value, unsure });

  if (q.kind === 'single' || q.kind === 'pair') {
    return (
      <fieldset className={clsx('grid gap-3', q.kind === 'pair' && 'sm:grid-cols-2')}>
        <legend className="sr-only">{q.prompt}</legend>
        {opts.map((o) => (
          <label key={o.id} className={optionCls}>
            <input type="radio" name={q.id} className="mt-1 h-4 w-4 accent-[var(--accent)]" checked={val === o.id} onChange={() => save(o.id)} />
            <OptionText o={o} />
          </label>
        ))}
      </fieldset>
    );
  }
  if (q.kind === 'multi') {
    const chosen = Array.isArray(val) ? val : [];
    const max = q.maxSelect ?? opts.length;
    const full = chosen.length >= max;
    return (
      <fieldset>
        <legend className="small text-muted mb-3">{q.maxSelect ? `Choose up to ${q.maxSelect}. ` : ''}{chosen.length} selected</legend>
        <div className={clsx('grid gap-3', opts.length > 8 ? 'md:grid-cols-2' : '')}>
          {opts.map((o) => {
            const on = chosen.includes(o.id);
            return (
              <label key={o.id} className={clsx(optionCls, !on && full && 'opacity-50 cursor-not-allowed')}>
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" checked={on} disabled={!on && full}
                  onChange={() => save(on ? chosen.filter((x) => x !== o.id) : [...chosen, o.id])} />
                <OptionText o={o} />
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }
  if (q.kind === 'rank') return <RankInput q={q} opts={opts} value={Array.isArray(val) ? val : undefined} onChange={save} />;
  if (q.kind === 'slider' && q.slider) {
    const v = typeof val === 'number' ? val : 50;
    const touched = typeof val === 'number';
    return (
      <div className="space-y-3 max-w-xl">
        <Slider value={v} onChange={(x) => save(x)} label={q.prompt} valueText={`${v} out of 100`} />
        <div className="flex justify-between small text-muted"><span>{q.slider.low}</span><span>{q.slider.high}</span></div>
        <p className="small" aria-live="polite">{touched ? <>Your position: <strong>{v}</strong> / 100</> : <span className="text-muted">Move the handle to answer. Leaving it alone means no answer.</span>}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <label htmlFor={`txt-${q.id}`} className="sr-only">{q.prompt}</label>
      <textarea id={`txt-${q.id}`} className="field" maxLength={1200} placeholder="Write a few sentences, or leave it blank." value={typeof val === 'string' ? val : ''} onChange={(e) => setAnswer(q.id, { value: e.target.value })} />
      <p className="small text-muted">Stored only in this browser. Not scored.</p>
    </div>
  );
}

function OptionText({ o }: { o: QOption }) {
  return <span><span className="block">{o.label}</span>{o.detail && <span className="block small text-muted">{o.detail}</span>}</span>;
}

function RankInput({ q, opts, value, onChange }: { q: Question; opts: QOption[]; value?: string[]; onChange: (v: string[]) => void }) {
  const order = useMemo(() => {
    const ids = opts.map((o) => o.id);
    const base = (value ?? []).filter((id) => ids.includes(id));
    return [...base, ...ids.filter((id) => !base.includes(id))];
  }, [opts, value]);
  const [announce, setAnnounce] = useState('');
  const move = (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= order.length) return;
    const next = [...order]; [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    const o = opts.find((x) => x.id === next[j]);
    setAnnounce(`${o?.label} moved to position ${j + 1} of ${order.length}`);
  };
  return (
    <div>
      <ol className="space-y-2" aria-label={q.prompt}>
        {order.map((id, i) => {
          const o = opts.find((x) => x.id === id)!;
          return (
            <li key={id} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-rule bg-surface p-3">
              <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sunken text-sm tabular-nums">{i + 1}</span>
              <span className="flex-1"><span className="block">{o.label}</span></span>
              <button className="btn btn-sm btn-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${o.label} up`}><ArrowUp className="h-4 w-4" aria-hidden /></button>
              <button className="btn btn-sm btn-icon" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move ${o.label} down`}><ArrowDown className="h-4 w-4" aria-hidden /></button>
            </li>
          );
        })}
      </ol>
      {!value && <button className="btn btn-sm mt-3" onClick={() => onChange(order)}>Keep this order</button>}
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
    </div>
  );
}
