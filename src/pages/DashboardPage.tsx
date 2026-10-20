import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Download, Printer, Upload, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp, type PersistedState } from '@/store/useApp';
import { useProfile } from '@/store/derived';
import { viewTopic } from '@/lib/view';
import { DECISION_GROUPS, DEFAULT_DECISION_WEIGHTS, rankDecision, sensitivity } from '@/lib/decision';
import { strongestAndWeakest } from '@/lib/feasibility';
import { buildBackup, buildCsv, buildHtml, buildMarkdown, downloadText, parseBackup } from '@/lib/io';
import { buildTimeline } from '@/lib/timeline';
import { nextAction } from '@/lib/next';
import { topDims } from '@/lib/profile';
import { DIM_LABELS } from '@/data/questions';
import { CRITERIA } from '@/data/taxonomy';
import { roleById } from '@/data/careers';
import { Empty, ErrorNote, Meter, Notice, PageHeader, Slider, toneFor } from '@/components/ui';
import type { DecisionWeights } from '@/types';

export default function DashboardPage() {
  const state = useApp();
  const profile = useProfile();
  const { saved, weights, setWeights, resetWeights, toggleSaved, moveSaved, timeline, setTimeline } = state;
  const persisted = state as PersistedState;

  const views = useMemo(() => saved.map((id) => viewTopic(id, persisted, profile)).filter((v): v is NonNullable<typeof v> => !!v),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saved, state.labs, state.edits, state.pinnedRoles, state.feedbackLog, state.criterionWeights, profile]);
  const items = views.map((v) => ({ topicId: v.topic.id, criteria: v.criteria }));
  const ranked = useMemo(() => rankDecision(items, weights), [items, weights]);
  const sens = useMemo(() => sensitivity(items, weights), [items, weights]);
  const plan = buildTimeline(timeline);
  const next = nextAction(persisted);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const viewById = new Map(views.map((v) => [v.topic.id, v]));
  const exportInput = { state: persisted, profile };
  const today = new Date().toISOString().slice(0, 10);

  const openReport = () => {
    const w = window.open('', '_blank');
    if (!w) { downloadText(`tfm-shortlist-${today}.html`, buildHtml(exportInput), 'text/html'); return; }
    w.document.open(); w.document.write(buildHtml(exportInput)); w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  };

  const onImport = async (file?: File) => {
    if (!file) return;
    if (file.size > 2_000_000) { setImportMsg({ ok: false, text: 'File is too large.' }); return; }
    const res = parseBackup(await file.text());
    if (!res.ok) setImportMsg({ ok: false, text: res.error });
    else { state.importState(res.state); setImportMsg({ ok: true, text: `Backup restored.${res.warnings.length ? ' ' + res.warnings.join(' ') : ''}` }); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const themes = topDims(profile, 't.', 4);
  const chart = ranked.map((r) => ({ name: (viewById.get(r.topicId)?.title ?? '').split(':')[0].slice(0, 28), score: Math.round(r.total) }));

  return (
    <div>
      <PageHeader eyebrow="Module H · Shortlist and decision" title="Compare, weigh and test your choice">
        The app does not choose for you. It shows how the candidates compare under the priorities you set, how fragile that comparison is, and what remains uncertain.
      </PageHeader>

      <section className="card mb-6 p-5" aria-labelledby="sum-h">
        <h2 id="sum-h">Where you are</h2>
        <div className="mt-3 grid gap-4 small md:grid-cols-4">
          <div><p className="text-muted">Orientation test</p><p>{profile.answered >= 6 ? `${profile.answered} answers` : 'Not enough answers'} · <Link to="/profile">profile</Link></p>{themes.length > 0 && <p className="text-muted">{themes.map((d) => DIM_LABELS[d.id]).join(', ')}</p>}</div>
          <div><p className="text-muted">Interface</p><p>{state.ui.fullOverview ? 'Complete overview' : state.ui.modes.join(' + ')}</p></div>
          <div><p className="text-muted">Career objectives</p><p>{state.pinnedRoles.length ? state.pinnedRoles.map((r) => roleById(r)?.label).join(', ') : 'None pinned'} · <Link to="/careers">edit</Link></p></div>
          <div><p className="text-muted">Next recommended step</p><p><Link to={next.to}>{next.title}</Link></p></div>
        </div>
      </section>

      <section aria-labelledby="saved-h" className="mb-8">
        <h2 id="saved-h">Saved topics ({saved.length})</h2>
        {saved.length === 0 ? <div className="mt-3"><Empty title="Nothing saved yet" action={<Link className="btn btn-primary" to="/topics">Browse topics</Link>}>Save at least three topics to compare them. Include one you doubt: it is a useful test.</Empty></div> : (
          <ul className="mt-3 space-y-2">
            {views.map((v, i) => (
              <li key={v.topic.id} className="card flex flex-wrap items-center gap-3 p-3">
                <span className="tabular-nums text-muted w-5">{i + 1}</span>
                <div className="min-w-0 flex-1"><Link to={`/topics/${v.topic.id}`} className="font-medium">{v.title}</Link><p className="small text-muted">{v.rq}</p>{(state.openQuestions[v.topic.id]?.length ?? 0) > 0 && <p className="small">{state.openQuestions[v.topic.id].length} outstanding question(s)</p>}</div>
                <button className="btn btn-sm btn-icon" onClick={() => moveSaved(v.topic.id, -1)} disabled={i === 0} aria-label={`Move ${v.title} up`}><ArrowUp className="h-4 w-4" aria-hidden /></button>
                <button className="btn btn-sm btn-icon" onClick={() => moveSaved(v.topic.id, 1)} disabled={i === views.length - 1} aria-label={`Move ${v.title} down`}><ArrowDown className="h-4 w-4" aria-hidden /></button>
                <button className="btn btn-sm btn-icon" onClick={() => toggleSaved(v.topic.id)} aria-label={`Remove ${v.title} from shortlist`}><X className="h-4 w-4" aria-hidden /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {views.length >= 2 && (
        <>
          <section aria-labelledby="w-h" className="card mb-8 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="w-h">What matters most to you?</h2><button className="btn btn-sm" onClick={resetWeights} disabled={JSON.stringify(weights) === JSON.stringify(DEFAULT_DECISION_WEIGHTS)}>Reset weights</button></div>
            <p className="mt-1 small text-muted">0 = ignore, 5 = most important. The ranking below updates immediately.</p>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {DECISION_GROUPS.map((g) => (
                <div key={g.id}><div className="flex justify-between small"><label htmlFor={`w-${g.id}`} className="font-medium">{g.label}</label><span className="tabular-nums">{weights[g.id]}</span></div>
                  <Slider value={weights[g.id]} min={0} max={5} onChange={(v) => setWeights({ [g.id]: v } as Partial<DecisionWeights>)} label={`Importance of ${g.label}`} valueText={`${weights[g.id]} out of 5`} /><p className="small text-muted">{g.help}</p></div>
              ))}
            </div>
            <div className="mt-6 h-56" role="img" aria-label="Bar chart of weighted scores per topic"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} layout="vertical" margin={{ left: 8, right: 16 }}><CartesianGrid horizontal={false} stroke="var(--rule)" /><XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 12 }} /><YAxis type="category" dataKey="name" width={150} tick={{ fill: 'var(--ink)', fontSize: 12 }} /><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--rule)', color: 'var(--ink)' }} /><Bar dataKey="score" fill="var(--data)" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></div>
          </section>

          <section aria-labelledby="mx-h" className="mb-8">
            <h2 id="mx-h">Side-by-side comparison</h2>
            <div className="mt-3 overflow-x-auto card">
              <table className="w-full small">
                <caption className="sr-only">Comparison of saved topics by weighted score and by criterion</caption>
                <thead><tr className="text-left"><th scope="col" className="sticky left-0 bg-surface p-3 font-medium text-muted">Criterion</th>{ranked.map((r) => <th key={r.topicId} scope="col" className="min-w-44 p-3 align-top"><span className="badge badge-accent">#{r.rank}</span> <Link to={`/topics/${r.topicId}`}>{viewById.get(r.topicId)?.title.split(':')[0]}</Link></th>)}</tr></thead>
                <tbody>
                  <tr className="rule-t font-medium"><th scope="row" className="sticky left-0 bg-surface p-3 text-left">Weighted score (0–100)</th>{ranked.map((r) => <td key={r.topicId} className="p-3 tabular-nums">{r.total.toFixed(0)}</td>)}</tr>
                  {DECISION_GROUPS.map((g) => <tr key={g.id} className="rule-t"><th scope="row" className="sticky left-0 bg-surface p-3 text-left font-normal">{g.label}</th>{ranked.map((r) => <td key={r.topicId} className="p-3"><div className="flex items-center gap-2"><span className="tabular-nums w-8">{r.groups[g.id].toFixed(1)}</span><div className="w-20"><Meter value={r.groups[g.id]} label={`${g.label}`} tone={toneFor(r.groups[g.id])} /></div></div></td>)}</tr>)}
                  <tr className="rule-t"><th scope="row" className="sticky left-0 bg-surface p-3 text-left font-normal">Method</th>{ranked.map((r) => <td key={r.topicId} className="p-3">{viewById.get(r.topicId)?.result.methodId}</td>)}</tr>
                  <tr className="rule-t"><th scope="row" className="sticky left-0 bg-surface p-3 text-left font-normal">Workload</th>{ranked.map((r) => <td key={r.topicId} className="p-3">~{viewById.get(r.topicId)?.result.workloadWeeks} weeks</td>)}</tr>
                  <tr className="rule-t"><th scope="row" className="sticky left-0 bg-surface p-3 text-left font-normal">Strongest</th>{ranked.map((r) => <td key={r.topicId} className="p-3">{strongestAndWeakest(viewById.get(r.topicId)!.criteria).strongest.map((c) => c.label).join('; ')}</td>)}</tr>
                  <tr className="rule-t"><th scope="row" className="sticky left-0 bg-surface p-3 text-left font-normal">Main trade-off (weakest)</th>{ranked.map((r) => <td key={r.topicId} className="p-3">{strongestAndWeakest(viewById.get(r.topicId)!.criteria).weakest.map((c) => `${c.label} (${c.score.toFixed(1)})`).join('; ')}</td>)}</tr>
                  <tr className="rule-t"><th scope="row" className="sticky left-0 bg-surface p-3 text-left font-normal">Top careers</th>{ranked.map((r) => <td key={r.topicId} className="p-3">{viewById.get(r.topicId)?.topic.careers.slice(0, 2).map((c) => roleById(c.roleId)?.label).join('; ')}</td>)}</tr>
                  <tr className="rule-t"><th scope="row" className="sticky left-0 bg-surface p-3 text-left font-normal">Claims to verify</th>{ranked.map((r) => <td key={r.topicId} className="p-3">{viewById.get(r.topicId)?.topic.claims.length}</td>)}</tr>
                  {CRITERIA.map((c) => <tr key={c.id} className="rule-t"><th scope="row" className="sticky left-0 bg-surface p-3 text-left font-normal text-muted">{c.label}</th>{ranked.map((r) => { const cs = viewById.get(r.topicId)!.criteria.find((x) => x.id === c.id)!; return <td key={r.topicId} className="p-3 tabular-nums">{cs.score.toFixed(1)}</td>; })}</tr>)}
                </tbody>
              </table>
            </div>
            {views.length < 3 && <div className="mt-3"><Notice>Compare at least three topics for a more useful picture. <Link to="/topics">Add another</Link>.</Notice></div>}
          </section>

          <section aria-labelledby="sens-h" className="card mb-8 p-5">
            <h2 id="sens-h">How robust is the leader?</h2>
            <p className="mt-1 small text-muted">The app re-ranks your topics under {sens.scenarios} random weightings and under five “one priority dominates” scenarios.</p>
            <p className="mt-3" role="status"><strong>{sens.message}</strong></p>
            <div className="mt-4 overflow-x-auto"><table className="w-full small"><caption className="sr-only">Sensitivity analysis results</caption>
              <thead><tr className="text-left text-muted"><th scope="col" className="py-2 pr-3 font-medium">Topic</th><th scope="col" className="px-2 font-medium">Ranks first</th><th scope="col" className="px-2 font-medium">In top three</th><th scope="col" className="px-2 font-medium">Rank range</th></tr></thead>
              <tbody>{sens.rows.map((r) => <tr key={r.topicId} className="rule-t"><th scope="row" className="py-2 pr-3 text-left font-normal">{viewById.get(r.topicId)?.title.split(':')[0]}</th><td className="px-2 tabular-nums">{Math.round(r.winShare * 100)}%</td><td className="px-2 tabular-nums">{Math.round(r.topThreeShare * 100)}%</td><td className="px-2 tabular-nums">{r.bestRank}–{r.worstRank}</td></tr>)}</tbody></table></div>
            <h3 className="mt-5">If one priority dominated</h3>
            <ul className="mt-1 list-disc pl-5 small">{sens.byPriority.map((b) => <li key={b.priority}>Prioritising <strong>{b.priority.toLowerCase()}</strong>: {viewById.get(b.winnerId)?.title.split(':')[0]} leads.</li>)}</ul>
          </section>
        </>
      )}

      <section aria-labelledby="tl-h" className="card mb-8 p-5">
        <h2 id="tl-h">Preliminary work plan</h2>
        <Notice title="Deadlines are yours to confirm">
          UPF’s thesis page (checked during development) describes: topic and two supervisor preferences in <strong>February</strong>, supervisor allocation in <strong>March</strong>, submission in <strong>mid-June</strong>, public defence in the <strong>last week of June or early July</strong>, a thesis of up to <strong>10,000 words</strong> in article format. Exact dates are published each year, so enter the confirmed ones below. This app does not assume any. <a href="https://www.upf.edu/web/master-governance/master-thesis" target="_blank" rel="noreferrer">Official page</a>
        </Notice>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1"><label htmlFor="tl-s" className="block small font-medium">Start of thesis work</label><input id="tl-s" type="date" className="field" value={timeline.startDate} onChange={(e) => setTimeline({ startDate: e.target.value })} /></div>
          <div className="space-y-1"><label htmlFor="tl-d" className="block small font-medium">Submission deadline (confirmed)</label><input id="tl-d" type="date" className="field" value={timeline.deadline} onChange={(e) => setTimeline({ deadline: e.target.value })} /></div>
          <label className="flex items-end gap-2 pb-2 small"><input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={timeline.confirmedFromOfficial} onChange={(e) => setTimeline({ confirmedFromOfficial: e.target.checked })} /> I confirmed this with UPF</label>
        </div>
        {plan.warning && <div className="mt-3"><ErrorNote title="Check the dates">{plan.warning}</ErrorNote></div>}
        <p className="mt-4 small text-muted">{plan.confirmed ? `${plan.totalWeeks} weeks between your dates, divided by a rule of thumb. Adjust to your supervisor’s advice.` : `Showing stage lengths for a ${plan.totalWeeks}-week example. Enter dates to schedule.`}</p>
        <ol className="mt-2 space-y-1 small">{plan.stages.map((s) => <li key={s.id} className="flex justify-between gap-3 rule-t py-1"><span>{s.label}</span><span className="tabular-nums text-muted">{s.weeks} wk{s.start ? ` · ${s.start} → ${s.end}` : ''}</span></li>)}</ol>
      </section>

      <section aria-labelledby="ex-h" className="card p-5">
        <h2 id="ex-h">Export and backup</h2>
        {saved.length === 0 && <p className="mt-1 small text-muted">Save at least one topic to export a shortlist. Backups work any time.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn" disabled={!saved.length} onClick={() => downloadText(`tfm-shortlist-${today}.md`, buildMarkdown(exportInput), 'text/markdown')}><Download className="h-4 w-4" aria-hidden /> Markdown</button>
          <button className="btn" disabled={!saved.length} onClick={() => downloadText(`tfm-comparison-${today}.csv`, buildCsv(exportInput), 'text/csv')}><Download className="h-4 w-4" aria-hidden /> CSV</button>
          <button className="btn" disabled={!saved.length} onClick={() => downloadText(`tfm-report-${today}.html`, buildHtml(exportInput), 'text/html')}><Download className="h-4 w-4" aria-hidden /> HTML report</button>
          <button className="btn" disabled={!saved.length} onClick={openReport}><Printer className="h-4 w-4" aria-hidden /> Print or save as PDF</button>
        </div>
        <div className="mt-5 rule-t pt-4">
          <h3>Full backup (all your data)</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button className="btn" onClick={() => downloadText(`tfm-backup-${today}.json`, buildBackup(persisted), 'application/json')}><Download className="h-4 w-4" aria-hidden /> Download backup</button>
            <label className="btn cursor-pointer"><Upload className="h-4 w-4" aria-hidden /> Restore from backup<input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void onImport(e.target.files?.[0])} /></label>
          </div>
          <p className="mt-2 small text-muted">Restoring replaces current data. The file is checked before use; unknown content is ignored.</p>
          {importMsg && <div className="mt-2" role="status">{importMsg.ok ? <Notice>{importMsg.text}</Notice> : <ErrorNote title="Could not restore">{importMsg.text}</ErrorNote>}</div>}
        </div>
      </section>
    </div>
  );
}
