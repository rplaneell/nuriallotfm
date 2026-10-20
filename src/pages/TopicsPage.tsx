import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Undo2 } from 'lucide-react';
import { useApp } from '@/store/useApp';
import { useProfile, useRanking, useUiFlags } from '@/store/derived';
import { TopicCard } from '@/components/TopicCard';
import { Empty, Notice, PageHeader, SelectField } from '@/components/ui';
import { METHODS, THEMES } from '@/data/taxonomy';
import { FEEDBACK_LABEL } from '@/lib/recommend';
import { topicById } from '@/data/topics';
import type { Level } from '@/types';

type Sort = 'match' | 'workload' | 'policy';

export default function TopicsPage() {
  const ranking = useRanking();
  const profile = useProfile();
  const { focused } = useUiFlags();
  const log = useApp((s) => s.feedbackLog);
  const undo = useApp((s) => s.undoFeedback);
  const clearFeedback = useApp((s) => s.clearFeedback);
  const removeFeedback = useApp((s) => s.removeFeedback);
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState<Sort>('match');
  const [showAll, setShowAll] = useState(false);
  const personalised = profile.answered >= 6;

  const q = params.get('q') ?? '';
  const theme = params.get('theme') ?? '';
  const method = params.get('method') ?? '';
  const level = (params.get('level') ?? '') as Level | '';
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ranking.filter((r) => {
      const t = r.topic;
      if (needle && !`${t.title} ${t.tagline} ${t.problem} ${t.geography} ${t.institutions.join(' ')} ${t.rq}`.toLowerCase().includes(needle)) return false;
      if (theme && !(t.themes[theme] >= 0.5)) return false;
      if (method && t.primaryMethod !== method && !t.secondaryMethods.includes(method)) return false;
      if (level && !t.levels.includes(level)) return false;
      return true;
    });
  }, [ranking, q, theme, method, level]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === 'workload') arr.sort((a, b) => a.topic.workloadWeeks - b.topic.workloadWeeks);
    if (sort === 'policy') arr.sort((a, b) => (b.topic.criteria.policy?.score ?? 0) - (a.topic.criteria.policy?.score ?? 0));
    return arr;
  }, [filtered, sort]);

  const active = sorted.filter((r) => !r.muted);
  const muted = sorted.filter((r) => r.muted);
  const limit = focused && !showAll && !q && !theme && !method && !level ? 5 : active.length;
  const shown = active.slice(0, limit);

  return (
    <div>
      <PageHeader eyebrow="Module C · Topic explorer" title="Research opportunities">
        {personalised ? 'Ranked by how well each topic matches your profile.' : 'Take the orientation test to rank these by fit. Until then every topic starts from the same neutral baseline.'} Every topic is a <strong>generated hypothesis</strong> to examine, not a confirmed gap in the literature.
      </PageHeader>

      <form className="card mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5" role="search" aria-label="Filter topics" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1 lg:col-span-2"><label htmlFor="tq" className="block small font-medium">Search</label><input id="tq" className="field" value={q} onChange={(e) => set('q', e.target.value)} placeholder="Title, institution, place…" /></div>
        <SelectField label="Theme" value={theme} onChange={(v) => set('theme', v)} options={[{ value: '', label: 'Any theme' }, ...THEMES.map((t) => ({ value: t.id, label: t.label }))]} />
        <SelectField label="Method" value={method} onChange={(v) => set('method', v)} options={[{ value: '', label: 'Any method' }, ...METHODS.map((m) => ({ value: m.id, label: m.label }))]} />
        <SelectField label="Level" value={level} onChange={(v) => set('level', v)} options={[{ value: '', label: 'Any level' }, { value: 'local', label: 'Local' }, { value: 'regional', label: 'Regional' }, { value: 'national', label: 'National' }, { value: 'eu', label: 'EU' }, { value: 'international', label: 'International' }]} />
      </form>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="small text-muted" role="status" aria-live="polite">{active.length} topic{active.length === 1 ? '' : 's'}{muted.length ? ` · ${muted.length} set aside` : ''}</p>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="sort" className="small">Sort</label>
          <select id="sort" className="field !w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="match">Best match</option><option value="workload">Shortest workload</option><option value="policy">Policy relevance</option>
          </select>
          <button className="btn btn-sm" onClick={undo} disabled={!log.length}><Undo2 className="h-4 w-4" aria-hidden /> Undo last reaction</button>
          {(q || theme || method || level) && <button className="btn btn-sm btn-ghost" onClick={() => setParams({}, { replace: true })}>Clear filters</button>}
        </div>
      </div>

      {shown.length === 0 ? (
        <Empty title="No topics match these filters" action={<button className="btn" onClick={() => setParams({}, { replace: true })}>Clear filters</button>}>Try a broader search, or remove the method or level filter.</Empty>
      ) : (
        <div className="grid gap-4">
          {shown.map((r, i) => <TopicCard key={r.topic.id} r={r} rank={sort === 'match' ? i + 1 : undefined} personalised={personalised} />)}
        </div>
      )}
      {limit < active.length && <div className="mt-4 text-center"><button className="btn" onClick={() => setShowAll(true)}>Show the other {active.length - limit} topics</button></div>}

      {muted.length > 0 && (
        <section className="mt-10" aria-labelledby="muted-h">
          <h2 id="muted-h">Set aside ({muted.length})</h2>
          <p className="mt-1 mb-3 small text-muted">One negative reaction is not permanent. Restore a topic any time; it comes back with its original score.</p>
          <ul className="space-y-2">
            {muted.map((r) => (
              <li key={r.topic.id} className="card flex flex-wrap items-center justify-between gap-2 p-3">
                <Link to={`/topics/${r.topic.id}`}>{r.topic.title}</Link>
                <button className="btn btn-sm" onClick={() => removeFeedback(r.topic.id, 'notForMe')}>Restore</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {log.length > 0 && (
        <section className="mt-10" aria-labelledby="log-h">
          <h2 id="log-h">Your reactions</h2>
          <Notice>Recommendations shift slightly with each reaction, and you can reverse any of them.</Notice>
          <ul className="mt-3 space-y-1 small">
            {[...log].reverse().slice(0, 8).map((e, i) => <li key={`${e.at}-${i}`} className="text-muted">{e.action === 'add' ? 'Marked' : 'Removed'} “{FEEDBACK_LABEL[e.tag]}” on {topicById(e.topicId)?.title.split(':')[0]}</li>)}
          </ul>
          <button className="btn btn-sm mt-3" onClick={clearFeedback}>Forget all reactions</button>
        </section>
      )}
    </div>
  );
}
