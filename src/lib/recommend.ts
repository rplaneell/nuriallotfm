import type { FeedbackEvent, FeedbackTag, Profile, Topic } from '@/types';
import { TOPICS } from '@/data/topics';
import { THEMES, methodById } from '@/data/taxonomy';
import { approachMatch, careerMatch, hasProfile, themeMatch } from './feasibility';
import { biValue, dimScore } from './profile';

export const FEEDBACK_LABEL: Record<FeedbackTag, string> = {
  very: 'Very interesting',
  maybe: 'Potentially interesting',
  notForMe: 'Not for me',
  tooBroad: 'Too broad',
  tooTechnical: 'Too technical',
  notPractical: 'Not practical enough',
  hardToResearch: 'Interesting but difficult to research',
  careerRelevant: 'Relevant to my career',
  otherDirection: 'I want to explore another direction',
};

/** Active feedback = events replayed in order; "remove" cancels a prior "add" of the same tag. */
export function activeFeedback(log: FeedbackEvent[]): Record<string, FeedbackTag[]> {
  const out: Record<string, Set<FeedbackTag>> = {};
  for (const e of log) {
    const set = (out[e.topicId] ??= new Set());
    if (e.action === 'add') {
      // mutually exclusive interest levels
      if (e.tag === 'very' || e.tag === 'maybe' || e.tag === 'notForMe') for (const t of ['very', 'maybe', 'notForMe'] as FeedbackTag[]) set.delete(t);
      set.add(e.tag);
    } else set.delete(e.tag);
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
}

export interface FeedbackEffect { label: string; value: number }

export interface RankedTopic {
  topic: Topic;
  score: number; // 0..1
  base: number;
  parts: { label: string; value: number; weight: number }[];
  reasons: string[];
  effects: FeedbackEffect[];
  tags: FeedbackTag[];
  muted: boolean;
}

function topThemeLabels(topic: Topic, profile: Profile, n = 2) {
  return Object.entries(topic.themes)
    .map(([id, w]) => ({ id, label: THEMES.find((t) => t.id === id)?.label ?? id, v: w * dimScore(profile, `t.${id}`), score: dimScore(profile, `t.${id}`) }))
    .filter((x) => x.score > 0.15)
    .sort((a, b) => b.v - a.v)
    .slice(0, n);
}

function scopeMatch(topic: Topic, profile: Profile): number {
  const lv: Record<string, string> = { local: 's.local', regional: 's.regional', national: 's.national', eu: 's.eu', international: 's.intl' };
  const levelScore = Math.max(0, ...topic.levels.map((l) => dimScore(profile, lv[l])));
  const design = topic.comparative ? dimScore(profile, 's.comparative') : dimScore(profile, 's.single');
  const ambition = biValue(profile, 'b.ambition');
  const techFit = 1 - Math.abs((topic.technical - 1) / 4 - ambition / 100) * 0.8;
  return levelScore * 0.4 + design * 0.2 + techFit * 0.4;
}

function methodMatch(topic: Topic, profile: Profile): number {
  const ids = [topic.primaryMethod, topic.primaryMethod, ...topic.secondaryMethods];
  let sum = 0;
  for (const id of ids) {
    const interest = dimScore(profile, `mi.${id}`);
    const want = dimScore(profile, `mw.${id}`);
    const cap = dimScore(profile, `mc.${id}`);
    sum += Math.min(1, interest * 0.5 + want * 0.35 + cap * 0.35);
  }
  return sum / ids.length;
}

export function rankTopics(profile: Profile, feedbackLog: FeedbackEvent[], pinnedRoles: string[] = [], topics: Topic[] = TOPICS): RankedTopic[] {
  const active = activeFeedback(feedbackLog);
  const personalised = hasProfile(profile);
  const allTags = Object.values(active).flat();
  const nTechnical = allTags.filter((t) => t === 'tooTechnical').length;
  const nNotPractical = allTags.filter((t) => t === 'notPractical').length;
  const careerLikedRoles = new Set<string>();
  for (const [tid, tags] of Object.entries(active)) if (tags.includes('careerRelevant')) topics.find((t) => t.id === tid)?.careers.filter((c) => c.strength === 3).forEach((c) => careerLikedRoles.add(c.roleId));
  const otherDirThemes = new Map<string, number>();
  for (const [tid, tags] of Object.entries(active)) if (tags.includes('otherDirection')) {
    const t = topics.find((x) => x.id === tid);
    if (t) Object.entries(t.themes).sort((a, b) => b[1] - a[1]).slice(0, 2).forEach(([id]) => otherDirThemes.set(id, (otherDirThemes.get(id) ?? 0) + 1));
  }

  const rows = topics.map((topic): RankedTopic => {
    const tags = active[topic.id] ?? [];
    const th = personalised ? themeMatch(topic, profile) : 0.5;
    const ap = personalised ? approachMatch(topic, profile) : 0.5;
    const me = personalised ? methodMatch(topic, profile) : 0.5;
    const sc = personalised ? scopeMatch(topic, profile) : 0.5;
    const ca = personalised ? careerMatch(topic, profile, pinnedRoles) : pinnedRoles.length ? careerMatch(topic, profile, pinnedRoles) : 0.5;
    const parts = [
      { label: 'Subject interest', value: th, weight: 0.35 },
      { label: 'Way of thinking', value: ap, weight: 0.15 },
      { label: 'Methods', value: me, weight: 0.15 },
      { label: 'Scope and ambition', value: sc, weight: 0.1 },
      { label: 'Career direction', value: ca, weight: 0.25 },
    ];
    const base = parts.reduce((s, p) => s + p.value * p.weight, 0);

    const effects: FeedbackEffect[] = [];
    const eff = (label: string, value: number) => { if (value) effects.push({ label, value }); };
    for (const tag of tags) {
      if (tag === 'very') eff('You marked it very interesting', 0.12);
      if (tag === 'maybe') eff('You marked it potentially interesting', 0.04);
      if (tag === 'notForMe') eff('You marked it not for you', -0.18);
      if (tag === 'tooBroad') eff('You found it too broad (try the narrow version in the lab)', -0.02);
      if (tag === 'tooTechnical') eff('You found it too technical', topic.technical >= 4 ? -0.08 : -0.02);
      if (tag === 'notPractical') eff('You found it not practical enough', -0.05);
      if (tag === 'hardToResearch') eff('You flagged it as difficult to research', -0.03);
      if (tag === 'careerRelevant') eff('You flagged it as relevant to your career', 0.06);
      if (tag === 'otherDirection') eff('You asked to explore another direction', -0.06);
    }
    // generalisation from other topics' feedback (small, capped)
    if (nTechnical && topic.technical >= 4 && !tags.includes('tooTechnical')) eff(`Similar to topics you found too technical (${nTechnical})`, -Math.min(0.09, 0.03 * nTechnical));
    if (nNotPractical && (topic.criteria.policy?.score ?? 3) < 4 && !tags.includes('notPractical')) eff('Lower policy relevance, like topics you found not practical enough', -Math.min(0.06, 0.02 * nNotPractical));
    if (topic.careers.some((c) => c.strength === 3 && careerLikedRoles.has(c.roleId)) && !tags.includes('careerRelevant')) eff('Supports a role family you marked as career-relevant', 0.03);
    const shared = Object.entries(topic.themes).sort((a, b) => b[1] - a[1]).slice(0, 2).filter(([id]) => otherDirThemes.has(id)).length;
    if (shared && !tags.includes('otherDirection')) eff('Shares a main theme with a topic you wanted to move away from', -0.03 * shared);

    const adj = effects.reduce((s, e) => s + e.value, 0);
    const score = Math.max(0, Math.min(1, base + adj));

    const reasons: string[] = [];
    if (personalised) {
      const tl = topThemeLabels(topic, profile);
      if (tl.length) reasons.push(`Matches your interest in ${tl.map((x) => x.label.toLowerCase()).join(' and ')}.`);
      const m = methodById(topic.primaryMethod);
      if (m && me > 0.5) reasons.push(`Main method (${m.label.toLowerCase()}) matches methods you like or want to learn.`);
      else if (m && me < 0.2) reasons.push(`Main method (${m.label.toLowerCase()}) is not among your stated interests. Check the learning needs.`);
      if (ca > 0.5) reasons.push('Supports role families in the work environments you rated.');
      if (sc > 0.55) reasons.push('Scope and technical level are close to what you prefer.');
    } else reasons.push('Take the orientation test to personalise this ranking. Currently every topic starts from a neutral baseline.');

    return { topic, score, base, parts, reasons, effects, tags, muted: tags.includes('notForMe') };
  });
  return rows.sort((a, b) => b.score - a.score);
}

/** Tags that exclude a topic from the main list but keep it recoverable. */
export const isMuted = (tags: FeedbackTag[]) => tags.includes('notForMe');
