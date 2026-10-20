import { useMemo } from 'react';
import { useApp } from './useApp';
import { computeProfile, progress } from '@/lib/profile';
import { rankTopics, activeFeedback } from '@/lib/recommend';
import { viewTopic } from '@/lib/view';
import type { ExploreMode } from '@/types';

export function useProfile() {
  const answers = useApp((s) => s.answers);
  const dimOverrides = useApp((s) => s.dimOverrides);
  const biOverrides = useApp((s) => s.biOverrides);
  return useMemo(() => computeProfile(answers, dimOverrides, biOverrides), [answers, dimOverrides, biOverrides]);
}

export function useRanking() {
  const profile = useProfile();
  const feedbackLog = useApp((s) => s.feedbackLog);
  const pinned = useApp((s) => s.pinnedRoles);
  return useMemo(() => rankTopics(profile, feedbackLog, pinned), [profile, feedbackLog, pinned]);
}

export function useFeedbackMap() {
  const log = useApp((s) => s.feedbackLog);
  return useMemo(() => activeFeedback(log), [log]);
}

export function useTopicView(id: string | undefined) {
  const profile = useProfile();
  const labs = useApp((s) => s.labs);
  const edits = useApp((s) => s.edits);
  const pinnedRoles = useApp((s) => s.pinnedRoles);
  const feedbackLog = useApp((s) => s.feedbackLog);
  const criterionWeights = useApp((s) => s.criterionWeights);
  return useMemo(() => (id ? viewTopic(id, { labs, edits, pinnedRoles, feedbackLog, criterionWeights }, profile) : null), [id, labs, edits, pinnedRoles, feedbackLog, criterionWeights, profile]);
}

export function useTestProgress() {
  const answers = useApp((s) => s.answers);
  return useMemo(() => progress(answers), [answers]);
}

/** How the interface adapts. `has(m)` is true if mode m is chosen, or the user asked for the complete overview. */
export function useUiFlags() {
  const ui = useApp((s) => s.ui);
  return useMemo(() => {
    const everything = ui.fullOverview || ui.modes.includes('hybrid');
    const has = (m: ExploreMode) => everything || ui.modes.includes(m);
    const primary: ExploreMode = ui.fullOverview ? 'hybrid' : ui.modes[0] ?? 'guided';
    return {
      ui, has, everything, primary,
      brief: ui.detail === 'brief' && !ui.fullOverview,
      deep: ui.detail === 'deep' || ui.fullOverview,
      visual: ui.format === 'visual' || has('visual'),
      written: ui.format === 'written',
      focused: ui.breadth === 'focused' && !ui.fullOverview,
    };
  }, [ui]);
}
