import type { LabParams, Profile, Topic } from '@/types';
import { topicById } from '@/data/topics';
import { applyLab, defaultLab, type LabResult } from './lab';
import { overall, scoreCriteria, type OverallScore, type ScoredCriterion } from './feasibility';
import type { PersistedState } from '@/store/useApp';
import { activeFeedback } from './recommend';
import type { CriterionId } from '@/types';

export interface TopicView {
  topic: Topic;
  title: string;
  rq: string;
  lab: LabParams;
  labIsDefault: boolean;
  result: LabResult;
  criteria: ScoredCriterion[];
  overall: OverallScore;
}

/** Combines a topic with the user's lab settings, edits and feedback into the numbers shown everywhere. */
export function viewTopic(id: string, s: Pick<PersistedState, 'labs' | 'edits' | 'pinnedRoles' | 'feedbackLog' | 'criterionWeights'>, profile: Profile): TopicView | null {
  const topic = topicById(id);
  if (!topic) return null;
  const def = defaultLab(topic);
  const lab = s.labs[id] ?? def;
  const result = applyLab(topic, lab, profile);
  const tags = activeFeedback(s.feedbackLog)[id] ?? [];
  const penalties: Partial<Record<CriterionId, number>> = {};
  if (tags.includes('hardToResearch')) { penalties.data = -0.8; penalties.evidence = -0.4; }
  if (tags.includes('tooTechnical')) penalties.methodFit = -0.4;
  const criteria = scoreCriteria(topic, profile, result.deltas, s.pinnedRoles, penalties);
  const edit = s.edits[id];
  return {
    topic, title: edit?.title?.trim() || topic.title, rq: edit?.rq?.trim() || result.rq, lab,
    labIsDefault: JSON.stringify(lab) === JSON.stringify(def), result, criteria, overall: overall(criteria, s.criterionWeights),
  };
}
