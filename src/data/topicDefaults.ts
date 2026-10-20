import type { CriterionId, CriterionScore, Topic } from '@/types';

type Input = Omit<Topic, 'criteria'> & { criteria: Partial<Record<CriterionId, { score: number; why: string }>> };

const clamp5 = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

/** Normalises author-entered criterion scores (1–5) and records that they are judgments. */
export function mk(input: Input): Topic {
  const criteria: Topic['criteria'] = {};
  for (const [k, v] of Object.entries(input.criteria)) {
    const cs: CriterionScore = { score: clamp5(v.score), why: v.why };
    criteria[k as CriterionId] = cs;
  }
  return { ...input, criteria };
}
