import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, BookOpenText, GraduationCap } from 'lucide-react';
import type { FeedbackTag } from '@/types';
import { useApp } from '@/store/useApp';
import { useUiFlags } from '@/store/derived';
import { FEEDBACK_LABEL, type RankedTopic } from '@/lib/recommend';
import { literatureCount, precedentCount } from '@/lib/evidence';
import { methodById } from '@/data/taxonomy';
import { Disclosure, Meter } from '@/components/ui';
import clsx from 'clsx';

const INTEREST: FeedbackTag[] = ['very', 'maybe', 'notForMe'];
const OTHER: FeedbackTag[] = ['tooBroad', 'tooTechnical', 'notPractical', 'hardToResearch', 'careerRelevant', 'otherDirection'];

export function FeedbackBar({ topicId, tags }: { topicId: string; tags: FeedbackTag[] }) {
  const add = useApp((s) => s.addFeedback);
  const remove = useApp((s) => s.removeFeedback);
  const toggle = (t: FeedbackTag) => (tags.includes(t) ? remove(topicId, t) : add(topicId, t));
  return (
    <div role="group" aria-label="Your reaction to this topic" className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {INTEREST.map((t) => <button key={t} type="button" className="chip" aria-pressed={tags.includes(t)} onClick={() => toggle(t)}>{FEEDBACK_LABEL[t]}</button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        {OTHER.map((t) => <button key={t} type="button" className="chip" aria-pressed={tags.includes(t)} onClick={() => toggle(t)}>{FEEDBACK_LABEL[t]}</button>)}
      </div>
    </div>
  );
}

export function TopicCard({ r, rank, personalised }: { r: RankedTopic; rank?: number; personalised: boolean }) {
  const { topic } = r;
  const saved = useApp((s) => s.saved.includes(topic.id));
  const toggleSaved = useApp((s) => s.toggleSaved);
  const { brief, deep, visual, written } = useUiFlags();
  const m = methodById(topic.primaryMethod);
  const pct = Math.round(r.score * 100);

  return (
    <article className={clsx('card p-5', r.muted && 'opacity-70')} aria-labelledby={`t-${topic.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-1">{rank ? `#${rank} · ` : ''}{topic.geography.split(/[(;]/)[0].trim()}</p>
          <h2 id={`t-${topic.id}`} className="!text-[1.1875rem] !leading-snug"><Link to={`/topics/${topic.id}`} className="text-ink no-underline hover:underline">{topic.title}</Link></h2>
          {!brief && <p className="mt-2 text-muted">{topic.tagline}</p>}
        </div>
        <button type="button" className="btn btn-sm shrink-0" aria-pressed={saved} onClick={() => toggleSaved(topic.id)} aria-label={saved ? `Remove “${topic.title}” from shortlist` : `Save “${topic.title}” to shortlist`}>
          {saved ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}{saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 small">
        <span className="badge badge-muted">{m?.label}</span>
        <span className="badge badge-muted">~{topic.workloadWeeks} weeks</span>
        <span className="badge badge-muted">{topic.comparative ? 'Comparative' : 'Single case'}</span>
        <span className="badge badge-muted"><BookOpenText className="h-3 w-3" aria-hidden /> {literatureCount(topic.id)} papers</span>
        <span className="badge badge-muted"><GraduationCap className="h-3 w-3" aria-hidden /> {precedentCount(topic.id)} past theses</span>
        {r.muted && <span className="badge badge-bad">Marked “not for me”</span>}
      </div>

      {(visual || !written) && (
        <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 small">
          <span className="text-muted">{personalised ? 'Match to your profile' : 'Neutral baseline'}</span>
          <Meter value={pct} max={100} label={`Match to your profile for ${topic.title}`} />
          <span className="tabular-nums font-medium">{personalised ? `${pct}%` : 'n/a'}</span>
        </div>
      )}

      <Disclosure title="Why is this recommended?" defaultOpen={deep && !brief} meta={<span>{r.reasons.length} reason{r.reasons.length === 1 ? '' : 's'}</span>}>
        <ul className="space-y-1 small list-disc pl-5">{r.reasons.map((x, i) => <li key={i}>{x}</li>)}</ul>
        {personalised && (
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 small">
            {r.parts.map((p) => <div key={p.label} className="contents"><dt className="text-muted">{p.label} <span className="text-xs">(weight {Math.round(p.weight * 100)}%)</span></dt><dd className="tabular-nums">{Math.round(p.value * 100)}%</dd></div>)}
          </dl>
        )}
        {r.effects.length > 0 && (
          <div className="mt-3 small">
            <p className="font-medium">Your reactions changed this score:</p>
            <ul className="list-disc pl-5">{r.effects.map((e, i) => <li key={i}>{e.label}: {e.value > 0 ? '+' : ''}{Math.round(e.value * 100)} points</li>)}</ul>
          </div>
        )}
      </Disclosure>

      <div className="mt-3 rule-t pt-3"><FeedbackBar topicId={topic.id} tags={r.tags} /></div>
    </article>
  );
}
