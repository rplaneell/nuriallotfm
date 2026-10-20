import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BookmarkCheck, Bookmark, ExternalLink, Search } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { useApp } from '@/store/useApp';
import { useBackend } from '@/lib/backend';
import { useFeedbackMap, useTopicView, useUiFlags } from '@/store/derived';
import { FeedbackBar } from '@/components/TopicCard';
import { TopicLab } from '@/components/TopicLab';
import { Disclosure, Empty, EvidenceBadge, Meter, Notice, PageHeader, Tab, TabList, TabPanel, Tabs, toneFor } from '@/components/ui';
import { DOC_LANGS, methodById, regionLabel, theoryById } from '@/data/taxonomy';
import { sourceById } from '@/data/sources';
import { outputById, roleById } from '@/data/careers';
import { placeById } from '@/data/places';
import { linkInfo, literatureFetched, literatureFor, precedentsFetched, literatureMeta, manualSearchLinks, precedentMeta, precedentsFor, workKind } from '@/lib/evidence';
import { strongestAndWeakest } from '@/lib/feasibility';
import type { ExploreMode } from '@/types';

const FIRST_TAB: Partial<Record<ExploreMode, string>> = { research: 'evidence', career: 'careers', method: 'method', visual: 'feasibility', policy: 'overview' };

export default function TopicDetail() {
  const { id } = useParams();
  const view = useTopicView(id);
  const [params, setParams] = useSearchParams();
  const { primary, everything, deep, brief } = useUiFlags();
  const saved = useApp((s) => s.saved.includes(id ?? ''));
  const toggleSaved = useApp((s) => s.toggleSaved);
  const tags = useFeedbackMap()[id ?? ''] ?? [];
  const hasEditedRq = useApp((s) => !!s.edits[id ?? '']?.rq);
  const tab = params.get('tab') ?? (everything ? 'overview' : FIRST_TAB[primary] ?? 'overview');
  if (!view) return <Empty title="Topic not found" action={<Link className="btn" to="/topics">Back to topics</Link>}>That topic id does not exist.</Empty>;
  const { topic } = view;

  return (
    <div>
      <p className="mb-3 small"><Link to="/topics">← All topics</Link></p>
      <PageHeader eyebrow={topic.geography} title={view.title}>{topic.tagline}</PageHeader>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button className="btn" aria-pressed={saved} onClick={() => toggleSaved(topic.id)}>{saved ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />} {saved ? 'Saved to shortlist' : 'Save to shortlist'}</button>
        <span className="badge badge-warn">Generated hypothesis: not a confirmed gap</span>
        <span className="small text-muted">Overall feasibility {view.overall.score.toFixed(1)}/5 (range {view.overall.low.toFixed(1)}–{view.overall.high.toFixed(1)})</span>
      </div>

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <TabList label="Topic sections">
          <Tab value="overview">Overview</Tab><Tab value="evidence">Evidence</Tab><Tab value="precedents">Past theses</Tab><Tab value="method">Method</Tab><Tab value="feasibility">Feasibility</Tab><Tab value="careers">Careers</Tab><Tab value="lab">Refine (lab)</Tab><Tab value="notes">Notes</Tab>
        </TabList>

        <TabPanel value="overview" label="Overview">
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-6">
              <section><h2>Policy problem</h2><p className="mt-2 prose-calm">{topic.problem}</p></section>
              <section className="card p-5">
                <div className="flex flex-wrap items-center gap-2"><h2>Research question</h2>{hasEditedRq ? <EvidenceBadge status="interpretation" label="Edited by you" /> : <EvidenceBadge status="hypothesis" />}</div>
                <p className="mt-2 text-[1.0625rem]">{view.rq}</p>
                <p className="mt-2 small text-muted">Shown for your current lab settings. <Link to="?tab=lab">Change them</Link></p>
                <h3 className="mt-4">Subquestions</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5">{view.result.subs.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </section>
              <section>
                <h3>Provisional hypotheses <EvidenceBadge status="hypothesis" /></h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 small">{topic.hypotheses.map((h, i) => <li key={i}>{h}</li>)}</ul>
              </section>
              {(primary === 'policy' || everything || deep) && (
                <section className="card p-5"><h3>Practical value for public administration</h3><p className="mt-1 small">{topic.publicValue}</p><h3 className="mt-3">Implementation challenges to expect</h3><ul className="mt-1 list-disc pl-5 small">{topic.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul></section>
              )}
              {!brief && (
                <>
                  <Disclosure title="Scope, outcomes and explanatory factors" defaultOpen={deep}>
                    <dl className="grid gap-x-6 gap-y-2 small sm:grid-cols-[10rem_1fr]">
                      <dt className="text-muted">Geography</dt><dd>{topic.geography}</dd>
                      <dt className="text-muted">Levels</dt><dd>{topic.levels.join(', ')}</dd>
                      <dt className="text-muted">World regions</dt><dd>{topic.regions.map(regionLabel).join(', ')}</dd>
                      <dt className="text-muted">Documents mainly in</dt><dd>{topic.docLangs.length ? `English plus ${topic.docLangs.map((l) => DOC_LANGS.find((x) => x.id === l)?.label ?? l).join(', ')}` : 'English suffices'}</dd>
                      <dt className="text-muted">Institutions</dt><dd>{topic.institutions.join('; ')}</dd>
                      <dt className="text-muted">Time period</dt><dd>{topic.timePeriod}</dd>
                      <dt className="text-muted">Outcomes</dt><dd>{topic.dimensions.join('; ')}</dd>
                      <dt className="text-muted">Explanatory factors</dt><dd>{topic.factors.join('; ')}</dd>
                    </dl>
                  </Disclosure>
                  <Disclosure title="Contribution, limitations and ethics" defaultOpen={deep}>
                    <p className="small"><strong>Potential contribution (author judgment):</strong> {topic.contribution}</p>
                    <h3 className="mt-3">Limitations and risks</h3><ul className="list-disc pl-5 small">{topic.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
                    <h3 className="mt-3">Ethical considerations</h3><ul className="list-disc pl-5 small">{topic.ethics.map((l, i) => <li key={i}>{l}</li>)}</ul>
                  </Disclosure>
                  <Disclosure title="Claims to verify before relying on them" defaultOpen={topic.claims.length > 0}>
                    {topic.claims.length === 0 ? <p className="small text-muted">No factual claims flagged for this topic.</p> : <ul className="space-y-3 small">{topic.claims.map((c, i) => <li key={i}><EvidenceBadge status={c.status} /> {c.text}<br /><span className="text-muted">Check: {c.check}</span></li>)}</ul>}
                  </Disclosure>
                </>
              )}
            </div>
            <aside className="space-y-4">
              <div className="card p-4"><h3>Your reaction</h3><div className="mt-2"><FeedbackBar topicId={topic.id} tags={tags} /></div></div>
              <div className="card p-4 small"><h3>At a glance</h3>
                <dl className="mt-2 grid grid-cols-2 gap-y-1"><dt className="text-muted">Method</dt><dd>{methodById(view.result.methodId)?.label}</dd><dt className="text-muted">Workload</dt><dd>~{view.result.workloadWeeks} weeks</dd><dt className="text-muted">Language</dt><dd>{topic.lang}</dd><dt className="text-muted">Places</dt><dd>{topic.placeIds.map((p) => placeById(p)?.name).join(', ')}</dd></dl>
                <Link className="mt-3 inline-block" to={`/map?topic=${topic.id}`}>Show on the map</Link>
              </div>
            </aside>
          </div>
        </TabPanel>

        <TabPanel value="evidence" label="Evidence"><EvidenceTab topicId={topic.id} /></TabPanel>
        <TabPanel value="precedents" label="Similar past theses"><PrecedentsTab topicId={topic.id} rq={view.rq} /></TabPanel>

        <TabPanel value="method" label="Method">
          <div className="space-y-6">
            <section className="card p-5"><h2>{methodById(view.result.methodId)?.label}</h2><p className="mt-2 small">{view.result.methodWhy}</p><p className="mt-2 small text-muted">{topic.methodNote}</p></section>
            <div className="grid gap-6 md:grid-cols-2">
              <section className="card p-5"><h3>Evidence required</h3><ul className="mt-2 list-disc pl-5 small">{view.result.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul></section>
              <section className="card p-5"><h3>How the analysis could proceed</h3><p className="mt-2 small">{methodById(view.result.methodId)?.analysis}</p><h3 className="mt-3">What it can claim</h3><p className="small">{methodById(view.result.methodId)?.causal === 'credible-causal' ? 'Within-case causal claims, if the evidence tests support them.' : methodById(view.result.methodId)?.causal === 'comparative' ? 'Comparative claims and plausible explanations. Not strong causal inference unless the design includes a credible counterfactual.' : methodById(view.result.methodId)?.causal === 'descriptive' ? 'Descriptive claims only.' : 'Interpretive claims about meaning, framing and practice.'}</p></section>
            </div>
            <section className="card p-5"><h3>Skills you would develop</h3><p className="mt-1 small">{[...topic.skills, ...(methodById(view.result.methodId)?.skills ?? [])].join(' · ')}</p><p className="mt-2 small text-muted">Learning plan: {methodById(view.result.methodId)?.learning}</p></section>
            <section className="card p-5"><h3>Frameworks to look up</h3><p className="small text-muted">Named from background knowledge of the field. They are not verified citations; use the search link to find the actual literature.</p>
              <ul className="mt-2 space-y-2 small">{topic.foundationalFrameworks.map((f) => { const t = theoryById(f)!; return <li key={f}><strong>{t.label}</strong>: {t.idea} <span className="text-muted">({t.origin})</span> <EvidenceBadge status="unverified" label="Citation unverified" /> <a href={`https://openalex.org/works?search=${encodeURIComponent(t.searchQuery)}`} target="_blank" rel="noreferrer">Search the literature <ExternalLink className="inline h-3 w-3" aria-hidden /></a></li>; })}</ul></section>
          </div>
        </TabPanel>

        <TabPanel value="feasibility" label="Feasibility">
          <FeasibilityTab topicId={topic.id} />
        </TabPanel>

        <TabPanel value="careers" label="Careers">
          <div className="space-y-6">
            <Notice>These are illustrative possibilities, not guaranteed outcomes. A thesis can show skills; some experience can only come from employment.</Notice>
            <ul className="grid gap-4 md:grid-cols-2">
              {topic.careers.map((c) => { const r = roleById(c.roleId)!; return (
                <li key={c.roleId} className="card p-4"><div className="flex items-baseline justify-between gap-2"><Link className="font-medium" to={`/careers?role=${r.id}`}>{r.label}</Link><span className="badge badge-data">{c.strength === 3 ? 'Strong link' : c.strength === 2 ? 'Moderate link' : 'Some link'}</span></div><p className="mt-1 small">{c.note}</p><p className="mt-2 small text-muted">Your IR background: {r.irLink}</p></li>
              ); })}
            </ul>
            <section><h2>Portfolio outputs to build alongside</h2>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">{topic.outputs.map((o) => { const out = outputById(o.outputId)!; return <li key={o.outputId} className="card p-4 small"><p className="font-medium">{out.label}</p><p>{out.what}</p><p className="mt-1 text-muted">Realistic within the timeline? {o.realism === 3 ? 'Yes' : o.realism === 2 ? 'Probably, if scoped small' : 'Only with extra time'}. {o.note}</p><p className="mt-1 text-muted">Useful for: {out.bestFor.map((r) => roleById(r)?.label).join(', ')}</p></li>; })}</ul></section>
            <section className="card p-5"><h3>How the method you chose connects to roles</h3><ul className="mt-2 list-disc pl-5 small">{view.result.careerNotes.map((c) => <li key={c.roleId}><strong>{c.label}:</strong> {c.note}</li>)}</ul></section>
          </div>
        </TabPanel>

        <TabPanel value="lab" label="Refine this topic"><TopicLab topicId={topic.id} /></TabPanel>
        <TabPanel value="notes" label="Notes"><NotesTab topicId={topic.id} /></TabPanel>
      </Tabs>
    </div>
  );
}

function EvidenceTab({ topicId }: { topicId: string }) {
  const topic = useTopicView(topicId)!.topic;
  const groups = useMemo(() => literatureFor(topicId), [topicId]);
  return (
    <div className="space-y-8">
      <section>
        <h2>Literature candidates</h2>
        <Notice tone="warn" title="How to read this list">
          <p>Metadata from OpenAlex, retrieved {literatureMeta.retrievedAt}. Each record exists in that index, but relevance was <strong>not</strong> checked by a person and abstracts have not been read in full. “Journal article” means the venue is a journal, not that peer review is confirmed. A thin list here is not evidence of a research gap.</p>
        </Notice>
        {groups.length === 0 ? <div className="mt-4"><Empty title={literatureFetched(topicId) ? 'No literature retrieved for this topic' : 'Literature snapshot not yet fetched for this topic'}>{literatureFetched(topicId) ? 'Use the search links below to search manually.' : 'This topic was added after the last literature snapshot, so nothing is shown here and that says nothing about the literature. Use the live search or the manual links below, or run npm run snapshot:literature -- --missing.'}</Empty></div> : (
          <ul className="mt-4 space-y-4">
            {groups.map((g) => { const w = g.primary; return (
              <li key={w.openalexId} className="card p-4">
                <p className="font-medium">{w.title}</p>
                <p className="small text-muted">{w.authors.join(', ')}{w.authorCount > w.authors.length ? ' et al.' : ''} · {w.year} · {w.venue ?? 'venue not listed'}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 small"><EvidenceBadge status="verified-metadata" /><span className="badge badge-muted">{workKind(w)}</span><span className="badge badge-muted">{w.citedBy} citations in OpenAlex</span>{w.openAccess && <span className="badge badge-ok">Open access</span>}{g.duplicates.length > 0 && <span className="badge badge-warn">{g.duplicates.length} duplicate record{g.duplicates.length > 1 ? 's' : ''} merged</span>}</p>
                {w.abstractExcerpt && <p className="mt-2 small text-muted">Abstract excerpt: {w.abstractExcerpt}</p>}
                <p className="mt-2 small"><a href={w.url} target="_blank" rel="noreferrer">{w.doi ? 'Open DOI' : 'Open record'} <ExternalLink className="inline h-3 w-3" aria-hidden /></a> <span className="text-muted">· Retrieved {w.retrievedAt}</span></p>
              </li>
            ); })}
          </ul>
        )}
        <p className="mt-3 small"><a href={`https://openalex.org/works?search=${encodeURIComponent(topic.title)}`} target="_blank" rel="noreferrer">Search this topic yourself on OpenAlex</a></p>
      </section>
      <section>
        <h2>Official sources and datasets</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {topic.sourceIds.map((sid) => { const s = sourceById(sid)!; const li = linkInfo(s.url); return (
            <li key={sid} className="card p-4 small"><p className="font-medium">{s.name}</p><p className="text-muted">{s.publisher} · {s.geo} · access: {s.access}</p><p className="mt-1">{s.notes}</p>
              <p className="mt-2 flex flex-wrap items-center gap-2"><a href={s.url} target="_blank" rel="noreferrer">Open <ExternalLink className="inline h-3 w-3" aria-hidden /></a>
                {li ? (li.ok ? <EvidenceBadge status="link-checked" label={`Link checked ${li.checkedAt}`} /> : <span className="badge badge-warn" title={li.error}>Could not be checked automatically ({li.status ?? li.error}). Try it in your browser.</span>) : <span className="badge badge-muted">Not checked</span>}</p></li>
          ); })}
        </ul>
        <p className="mt-3 small text-muted">Evidence needed for this topic: {topic.evidenceNeeded.join('; ')}.</p>
      </section>
      <section>
        <h2>Manual research workflow</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 small"><li>Search Google Scholar and OpenAlex with the topic’s key terms. Note review articles first.</li><li>Check that each important source exists and its details match (DOI, authors, year).</li><li>Read abstracts, then the full text of the five most relevant items. Only then judge whether a gap exists.</li><li>Record anything you cannot access as “abstract only”.</li></ol>
      </section>
    </div>
  );
}

function PrecedentsTab({ topicId, rq }: { topicId: string; rq: string }) {
  const items = useMemo(() => precedentsFor(topicId, rq), [topicId, rq]);
  const topic = useTopicView(topicId)!.topic;
  const backend = useBackend();
  const [live, setLive] = useState<{ status: 'idle' | 'loading' | 'ok' | 'error'; results?: { label: string; status: string; error?: string; items: ReturnType<typeof precedentsFor> }[]; error?: string }>({ status: 'idle' });
  const [query, setQuery] = useState(topic.title.split(':')[0]);
  useEffect(() => setQuery(topic.title.split(':')[0]), [topic.title]);
  const searchLive = async () => {
    setLive({ status: 'loading' });
    try {
      const r = await fetch(`/api/precedents?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setLive({ status: 'ok', results: j.results });
    } catch (e) { setLive({ status: 'error', error: e instanceof Error ? e.message : 'failed' }); }
  };
  return (
    <div className="space-y-6">
      <Notice title="Past master’s theses on similar questions">
        <p>Retrieved {precedentMeta.retrievedAt} from UPF’s e-repository (including IBEI programmes), Utrecht University and Swedish university repositories (DiVA). Coverage is partial: repositories hold only deposited theses, and UPF holds few. Overlap with your question is a rough word-overlap signal. Read the thesis before judging.</p>
      </Notice>
      {items.length === 0 ? <Empty title={precedentsFetched(topicId) ? 'No past theses were retrieved for this topic' : 'Past thesis snapshot not yet fetched for this topic'}>{precedentsFetched(topicId) ? 'Try the live search below or the manual links.' : 'This topic was added after the last repository snapshot, so an empty list says nothing about past theses. Try the live search below or the manual links, or run npm run snapshot:precedents -- --missing.'}</Empty> : (
        <ul className="space-y-4">
          {items.map((p) => (
            <li key={p.id} className="card p-4">
              <p className="font-medium">{p.title}</p>
              <p className="small text-muted">{p.authors.join(', ')} · {p.year ?? 'year n/a'} · {p.institution}{p.programme ? ` · ${p.programme.slice(0, 80)}` : ''}</p>
              <p className="mt-1 flex flex-wrap gap-2 small"><EvidenceBadge status="verified-metadata" label="Repository record" /><span className="badge badge-muted">{p.similarity === 'same-department' ? 'Same department as your master' : p.similarity === 'same-university' ? 'Same university' : 'Comparable programme elsewhere'}</span>{p.open && <span className="badge badge-ok">Open access</span>}{p.methods.map((m) => <span key={m} className="badge badge-data">{m}</span>)}
                {p.overlapWithRq >= 0.5 ? <span className="badge badge-bad">High wording overlap with your question ({Math.round(p.overlapWithRq * 100)}%)</span> : p.overlapWithRq >= 0.25 ? <span className="badge badge-warn">Some overlap ({Math.round(p.overlapWithRq * 100)}%)</span> : <span className="badge badge-muted">Low overlap ({Math.round(p.overlapWithRq * 100)}%)</span>}</p>
              {p.abstract && <p className="mt-2 small text-muted">{p.abstract}</p>}
              <p className="mt-2 small"><a href={p.url} target="_blank" rel="noreferrer">Open in repository <ExternalLink className="inline h-3 w-3" aria-hidden /></a></p>
              <p className="mt-1 small text-muted">Methods tags come from words in the title and abstract only. {p.overlapWithRq >= 0.25 ? 'To stand apart, change the case, level, period or method.' : ''}</p>
            </li>
          ))}
        </ul>
      )}
      <section className="card p-5">
        <h3>Search for more past theses</h3>
        {backend ? (<>
        <p className="small text-muted">Uses the local research service. If it is not running you get a clear message, and the links below always work.</p>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void searchLive(); }}><label htmlFor="live-q" className="sr-only">Search terms</label><input id="live-q" className="field" value={query} onChange={(e) => setQuery(e.target.value)} /><button className="btn btn-primary" type="submit" disabled={live.status === 'loading' || query.trim().length < 3}><Search className="h-4 w-4" aria-hidden /> Search</button></form>
        {live.status === 'loading' && <p className="mt-3 small text-muted" role="status">Searching repositories…</p>}
        {live.status === 'error' && <div className="mt-3"><Notice tone="warn" title="Live search unavailable">{live.error}. Start the local service with “npm run start”, or use the manual links.</Notice></div>}
        {live.status === 'ok' && live.results?.map((r) => (
          <div key={r.label} className="mt-4"><p className="font-medium small">{r.label} {r.status === 'error' && <span className="badge badge-bad">failed: {r.error}</span>}</p>
            <ul className="mt-1 space-y-1 small">{r.items.length === 0 && r.status === 'ok' && <li className="text-muted">No master-level results.</li>}{r.items.map((p, i) => <li key={i}><a href={p.url} target="_blank" rel="noreferrer">{p.title}</a> <span className="text-muted">({p.year ?? 'n/a'})</span></li>)}</ul></div>
        ))}
        </>) : <p className="small text-muted">This copy of the app has no live search. The snapshot above was retrieved on {precedentMeta.retrievedAt}. Use the links below to search each repository yourself.</p>}
        <div className="mt-4 rule-t pt-3"><p className="small font-medium">Manual search links</p><ul className="mt-1 flex flex-wrap gap-2">{manualSearchLinks(query).map((l) => <li key={l.url}><a className="chip no-underline" href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>)}</ul></div>
      </section>
    </div>
  );
}

function FeasibilityTab({ topicId }: { topicId: string }) {
  const view = useTopicView(topicId)!;
  const cw = useApp((s) => s.criterionWeights);
  const setCw = useApp((s) => s.setCriterionWeight);
  const { strongest, weakest } = strongestAndWeakest(view.criteria);
  const radar = view.criteria.map((c) => ({ k: c.label.split(' ')[0], v: c.score }));
  return (
    <div className="space-y-6">
      <Notice>Scores are 1–5. “Computed” ones come from your profile; the rest are the author’s judgments, shown with reasons so you can disagree. Change a weight to say what matters more to you.</Notice>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <ul className="space-y-4">
          {view.criteria.map((c) => (
            <li key={c.id} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-medium">{c.label}</span><span className="small tabular-nums"><strong>{c.score.toFixed(1)}</strong>/5 {c.delta !== 0 && <span className={c.delta > 0 ? 'text-ok' : 'text-bad'}>({c.delta > 0 ? '+' : ''}{c.delta.toFixed(1)} from your lab settings)</span>}</span></div>
              <div className="mt-2"><Meter value={c.score} label={c.label} tone={toneFor(c.score)} /></div>
              <p className="mt-2 small text-muted">{c.why}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className={clsx('badge', c.basis === 'computed from your profile' ? 'badge-data' : c.basis === 'no data yet' ? 'badge-muted' : 'badge-warn')}>{c.basis}</span>
                <label className="flex items-center gap-2 small">Importance <input type="range" min={0} max={3} step={1} value={cw[c.id]} onChange={(e) => setCw(c.id, Number(e.target.value))} aria-label={`Importance of ${c.label}`} /> <span className="tabular-nums w-4">{cw[c.id]}</span></label></div>
            </li>
          ))}
        </ul>
        <aside className="space-y-4">
          <div className="card p-4"><h3>Overall</h3><p className="statement mt-1">{view.overall.score.toFixed(1)}<span className="text-base text-muted"> / 5</span></p><p className="small text-muted">Plausible range {view.overall.low.toFixed(1)}–{view.overall.high.toFixed(1)} given that judged scores are uncertain.</p></div>
          <div className="card p-4 small"><h3>Strongest</h3><ul className="mt-1 list-disc pl-5">{strongest.map((c) => <li key={c.id}>{c.label} ({c.score.toFixed(1)})</li>)}</ul><h3 className="mt-3">Weakest</h3><ul className="mt-1 list-disc pl-5">{weakest.map((c) => <li key={c.id}>{c.label} ({c.score.toFixed(1)})</li>)}</ul></div>
          <div className="card p-3 h-64" role="img" aria-label="Radar chart of feasibility criteria scores"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radar}><PolarGrid stroke="var(--rule)" /><PolarAngleAxis dataKey="k" tick={{ fill: 'var(--muted)', fontSize: 10 }} /><Radar dataKey="v" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} /></RadarChart></ResponsiveContainer></div>
        </aside>
      </div>
    </div>
  );
}

const NO_QUESTIONS: string[] = [];

function NotesTab({ topicId }: { topicId: string }) {
  const note = useApp((s) => s.notes[topicId] ?? '');
  const setNote = useApp((s) => s.setNote);
  const qs = useApp((s) => s.openQuestions[topicId]) ?? NO_QUESTIONS;
  const add = useApp((s) => s.addOpenQuestion);
  const remove = useApp((s) => s.removeOpenQuestion);
  const [q, setQ] = useState('');
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section><label htmlFor="notes" className="font-medium">Research notes</label><textarea id="notes" className="field mt-2 !min-h-64" value={note} maxLength={20000} onChange={(e) => setNote(topicId, e.target.value)} /><p className="small text-muted mt-1">Saved automatically in this browser.</p></section>
      <section><h3>Outstanding questions</h3>
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(topicId, q); setQ(''); }}><label htmlFor="oq" className="sr-only">New question</label><input id="oq" className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Which services legally require registration?" /><button className="btn" type="submit">Add</button></form>
        {qs.length === 0 ? <p className="mt-3 small text-muted">None yet.</p> : <ul className="mt-3 space-y-2">{qs.map((x, i) => <li key={i} className="flex items-start justify-between gap-2 small"><span>{x}</span><button className="btn btn-sm btn-ghost" onClick={() => remove(topicId, i)} aria-label={`Remove question: ${x}`}>Remove</button></li>)}</ul>}
      </section>
    </div>
  );
}

