import type { TimelineSettings } from '@/types';

/** Relative share of the available time each stage receives. Planning heuristic, not a university rule. */
export const STAGES = [
  { id: 'refine', label: 'Refine the research question', share: 0.08 },
  { id: 'lit', label: 'Literature review', share: 0.14 },
  { id: 'theory', label: 'Theoretical framework', share: 0.08 },
  { id: 'design', label: 'Research design', share: 0.08 },
  { id: 'ethics', label: 'Ethics and access', share: 0.06 },
  { id: 'data', label: 'Data collection', share: 0.17 },
  { id: 'analysis', label: 'Analysis', share: 0.14 },
  { id: 'draft', label: 'Drafting', share: 0.14 },
  { id: 'feedback', label: 'Feedback and revision', share: 0.07 },
  { id: 'submit', label: 'Final checks and submission', share: 0.04 },
] as const;

export interface PlanStage { id: string; label: string; weeks: number; start?: string; end?: string }
export interface Plan { confirmed: boolean; totalWeeks: number; stages: PlanStage[]; warning?: string }

const parse = (s: string) => { const d = new Date(`${s}T00:00:00Z`); return Number.isNaN(d.getTime()) ? null : d; };
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function buildTimeline(t: TimelineSettings, fallbackWeeks = 20): Plan {
  const start = t.startDate ? parse(t.startDate) : null;
  const end = t.deadline ? parse(t.deadline) : null;
  let totalWeeks = fallbackWeeks;
  let warning: string | undefined;
  const confirmed = !!(start && end && end > start);
  if (confirmed) totalWeeks = Math.max(2, Math.round((end!.getTime() - start!.getTime()) / (7 * 86400000)));
  else if (t.startDate || t.deadline) warning = 'Enter both a start date and a later deadline to schedule the stages.';
  if (confirmed && totalWeeks < 12) warning = `Only ${totalWeeks} weeks available: consider the lower-risk version of your topic.`;
  let cursor = confirmed ? start!.getTime() : 0;
  const stages = STAGES.map((s) => {
    const weeks = Math.max(1, Math.round(s.share * totalWeeks));
    const out: PlanStage = { id: s.id, label: s.label, weeks };
    if (confirmed) { out.start = iso(new Date(cursor)); cursor += weeks * 7 * 86400000; out.end = iso(new Date(Math.min(cursor, end!.getTime()))); }
    return out;
  });
  return { confirmed, totalWeeks, stages, warning };
}
