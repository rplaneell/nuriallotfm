import type { CriterionId, Profile, Topic } from '@/types';
import { CRITERIA } from '@/data/taxonomy';
import { roleById } from '@/data/careers';
import { dimScore } from './profile';
import type { Deltas } from './lab';

export interface ScoredCriterion {
  id: CriterionId;
  label: string;
  score: number; // 1..5, may be fractional after lab adjustment
  base: number;
  delta: number;
  why: string;
  basis: 'computed from your profile' | 'author judgment' | 'no data yet';
  uncertain: boolean;
}

export const DEFAULT_CRITERION_WEIGHTS: Record<CriterionId, number> = {
  interest: 1, career: 1, track: 1, clarity: 1, academic: 1, policy: 1, evidence: 1, data: 1, methodFit: 1, scope: 1, ethics: 1, interviews: 1, portfolio: 1,
};

const clamp = (n: number, lo = 1, hi = 5) => Math.min(hi, Math.max(lo, n));

/** Weighted mean of the topic’s themes against your theme scores, 0..1. */
export function themeMatch(topic: Topic, profile: Profile): number {
  let num = 0, den = 0;
  for (const [id, w] of Object.entries(topic.themes)) { num += w * dimScore(profile, `t.${id}`); den += w; }
  return den ? num / den : 0;
}
export function approachMatch(topic: Topic, profile: Profile): number {
  let num = 0, den = 0;
  for (const [id, w] of Object.entries(topic.approaches)) { num += w * dimScore(profile, `a.${id}`); den += w; }
  return den ? num / den : 0;
}
export function careerMatch(topic: Topic, profile: Profile, pinnedRoles: string[] = []): number {
  let num = 0, den = 0;
  for (const c of topic.careers) {
    const role = roleById(c.roleId);
    if (!role) continue;
    const envScore = Math.max(0, ...role.environments.map((e) => dimScore(profile, `c.${e}`)));
    const boost = pinnedRoles.includes(c.roleId) ? 0.35 : 0;
    num += (c.strength / 3) * Math.min(1, envScore + boost);
    den += c.strength / 3;
  }
  return den ? num / den : 0;
}

export function hasProfile(profile: Profile) { return profile.answered >= 6; }

export function scoreCriteria(topic: Topic, profile: Profile, deltas: Deltas = {}, pinnedRoles: string[] = [], penalties: Partial<Record<CriterionId, number>> = {}): ScoredCriterion[] {
  const prof = hasProfile(profile);
  return CRITERIA.map((c) => {
    let base: number; let why: string; let basis: ScoredCriterion['basis']; let uncertain = false;
    if (c.id === 'interest') {
      if (prof) {
        const m = themeMatch(topic, profile) * 0.7 + approachMatch(topic, profile) * 0.3;
        base = 1 + 4 * m; basis = 'computed from your profile';
        const top = Object.entries(topic.themes).sort((a, b) => b[1] * dimScore(profile, `t.${b[0]}`) - a[1] * dimScore(profile, `t.${a[0]}`))[0];
        why = `Weighted overlap of the topic’s themes and approaches with your answers (${Math.round(m * 100)}%). Strongest link: ${top ? top[0] : 'n/a'}.`;
      } else { base = 3; why = 'Take the orientation test to compute this. Neutral placeholder (3).'; basis = 'no data yet'; uncertain = true; }
    } else if (c.id === 'career') {
      if (prof) {
        const m = careerMatch(topic, profile, pinnedRoles);
        base = 1 + 4 * m; basis = 'computed from your profile';
        why = `Overlap between the roles this topic supports and the work environments you rated (${Math.round(m * 100)}%).`;
      } else { base = 3; why = 'Take the orientation test or pin target roles to compute this. Neutral placeholder (3).'; basis = 'no data yet'; uncertain = true; }
    } else {
      const own = topic.criteria[c.id];
      base = own?.score ?? 3;
      why = own?.why ?? 'No topic-specific rationale recorded; neutral default.';
      basis = 'author judgment';
      uncertain = true;
    }
    const delta = (deltas[c.id] ?? 0) + (penalties[c.id] ?? 0);
    return { id: c.id, label: c.label, score: clamp(base + delta), base, delta, why, basis, uncertain };
  });
}

export interface OverallScore { score: number; low: number; high: number; pct: number }

/** Overall 1..5 score with an uncertainty band: author-judgment criteria are perturbed by ±0.75. */
export function overall(criteria: ScoredCriterion[], weights: Record<CriterionId, number> = DEFAULT_CRITERION_WEIGHTS): OverallScore {
  let num = 0, lo = 0, hi = 0, den = 0;
  for (const c of criteria) {
    const w = weights[c.id] ?? 1;
    const pert = c.uncertain ? 0.75 : 0.25;
    num += w * c.score; lo += w * clamp(c.score - pert); hi += w * clamp(c.score + pert); den += w;
  }
  if (!den) return { score: 3, low: 3, high: 3, pct: 50 };
  const score = num / den;
  return { score, low: lo / den, high: hi / den, pct: Math.round(((score - 1) / 4) * 100) };
}

export function strongestAndWeakest(criteria: ScoredCriterion[]) {
  const sorted = [...criteria].sort((a, b) => b.score - a.score);
  return { strongest: sorted.slice(0, 3), weakest: sorted.slice(-3).reverse() };
}
