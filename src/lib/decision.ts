import type { CriterionId, DecisionWeights } from '@/types';
import type { ScoredCriterion } from './feasibility';

export const DEFAULT_DECISION_WEIGHTS: DecisionWeights = { interest: 3, feasibility: 3, career: 3, academic: 2, policy: 2 };

export const DECISION_GROUPS: { id: keyof DecisionWeights; label: string; criteria: CriterionId[]; help: string }[] = [
  { id: 'interest', label: 'Personal interest', criteria: ['interest'], help: 'How much you want to spend months on it.' },
  { id: 'feasibility', label: 'Feasibility', criteria: ['clarity', 'evidence', 'data', 'methodFit', 'scope', 'ethics', 'interviews'], help: 'Whether you can finish it well in the time available.' },
  { id: 'career', label: 'Professional value', criteria: ['career', 'portfolio'], help: 'How it supports your first job.' },
  { id: 'academic', label: 'Academic contribution', criteria: ['academic', 'track'], help: 'Scholarly quality and fit with the track.' },
  { id: 'policy', label: 'Policy relevance', criteria: ['policy'], help: 'Usefulness for public administrations.' },
];

export function groupScores(criteria: ScoredCriterion[]): Record<keyof DecisionWeights, number> {
  const out = {} as Record<keyof DecisionWeights, number>;
  for (const g of DECISION_GROUPS) {
    const cs = criteria.filter((c) => g.criteria.includes(c.id));
    out[g.id] = cs.length ? cs.reduce((s, c) => s + c.score, 0) / cs.length : 3;
  }
  return out;
}

export const weightedTotal = (groups: Record<keyof DecisionWeights, number>, w: DecisionWeights): number => {
  const den = (Object.values(w) as number[]).reduce((s, x) => s + x, 0);
  if (!den) return 0;
  let num = 0;
  for (const k of Object.keys(w) as (keyof DecisionWeights)[]) num += (w[k] / den) * groups[k];
  return ((num - 1) / 4) * 100; // 0..100
};

export interface DecisionRow {
  topicId: string;
  groups: Record<keyof DecisionWeights, number>;
  total: number;
  rank: number;
}

export function rankDecision(items: { topicId: string; criteria: ScoredCriterion[] }[], w: DecisionWeights): DecisionRow[] {
  const rows = items.map((it) => {
    const groups = groupScores(it.criteria);
    return { topicId: it.topicId, groups, total: weightedTotal(groups, w), rank: 0 };
  });
  rows.sort((a, b) => b.total - a.total);
  rows.forEach((r, i) => { r.rank = i + 1; });
  return rows;
}

/** Small deterministic PRNG so the sensitivity analysis is reproducible. */
function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface SensitivityRow {
  topicId: string;
  winShare: number; // share of scenarios in which the topic ranks first
  topThreeShare: number;
  meanRank: number;
  bestRank: number;
  worstRank: number;
}
export interface Sensitivity {
  scenarios: number;
  rows: SensitivityRow[];
  leaderId: string | null;
  leaderStable: boolean;
  byPriority: { priority: string; winnerId: string }[];
  message: string;
}

export function sensitivity(items: { topicId: string; criteria: ScoredCriterion[] }[], current: DecisionWeights, runs = 600, seed = 42): Sensitivity {
  if (items.length < 2) return { scenarios: 0, rows: [], leaderId: items[0]?.topicId ?? null, leaderStable: true, byPriority: [], message: 'Add at least two topics to compare.' };
  const rand = mulberry32(seed);
  const keys = DECISION_GROUPS.map((g) => g.id);
  const groupsByTopic = new Map(items.map((i) => [i.topicId, groupScores(i.criteria)]));
  const stats = new Map(items.map((i) => [i.topicId, { wins: 0, top3: 0, ranks: [] as number[] }]));
  const run = (w: DecisionWeights) => {
    const scored = items.map((i) => ({ id: i.topicId, v: weightedTotal(groupsByTopic.get(i.topicId)!, w) })).sort((a, b) => b.v - a.v);
    scored.forEach((s, idx) => { const st = stats.get(s.id)!; st.ranks.push(idx + 1); if (idx === 0) st.wins++; if (idx < 3) st.top3++; });
    return scored[0].id;
  };
  let n = 0;
  for (let r = 0; r < runs; r++) {
    // random weights on the 0..5 scale, at least a bit of weight everywhere
    const w = Object.fromEntries(keys.map((k) => [k, 0.3 + rand() * 4.7])) as unknown as DecisionWeights;
    run(w); n++;
  }
  const byPriority = keys.map((k) => {
    const w = Object.fromEntries(keys.map((x) => [x, x === k ? 5 : 1])) as unknown as DecisionWeights;
    const scored = items.map((i) => ({ id: i.topicId, v: weightedTotal(groupsByTopic.get(i.topicId)!, w) })).sort((a, b) => b.v - a.v);
    return { priority: DECISION_GROUPS.find((g) => g.id === k)!.label, winnerId: scored[0].id };
  });
  const rows = items.map((i): SensitivityRow => {
    const st = stats.get(i.topicId)!;
    return { topicId: i.topicId, winShare: st.wins / n, topThreeShare: st.top3 / n, meanRank: st.ranks.reduce((s, x) => s + x, 0) / n, bestRank: Math.min(...st.ranks), worstRank: Math.max(...st.ranks) };
  }).sort((a, b) => b.winShare - a.winShare || a.meanRank - b.meanRank);
  const currentLeader = rankDecision(items, current)[0]?.topicId ?? null;
  const leaderRow = rows.find((r) => r.topicId === currentLeader);
  const leaderStable = !!leaderRow && leaderRow.winShare >= 0.6;
  const message = !currentLeader ? '' : leaderStable
    ? 'Your current leader stays first in most weightings tested. That is a sign of robustness, not proof it is the right choice.'
    : leaderRow && leaderRow.winShare >= 0.3
      ? 'Your current leader wins under many weightings but not most. The decision depends on what you prioritise.'
      : 'Your current leader wins only under a narrow range of priorities. Treat the ranking as fragile.';
  return { scenarios: n, rows, leaderId: currentLeader, leaderStable, byPriority, message };
}
