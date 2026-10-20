import type { PersistedState } from '@/store/useApp';
import { progress } from './profile';

export interface NextAction { id: string; title: string; why: string; to: string; cta: string; step: number; of: number }

/** The single most useful next step, derived from what the user has already done. */
export function nextAction(s: PersistedState): NextAction {
  const p = progress(s.answers);
  const answered = Object.values(s.answers).filter((a) => !a.skipped && a.value !== undefined).length;
  const of = 6;
  if (answered < 6) return { id: 'start', step: 1, of, title: 'Start the orientation test', why: 'It takes about 12 minutes and everything else (rankings, careers, map) adapts to your answers. You can skip any question.', to: '/test', cta: answered ? 'Continue the test' : 'Start the test' };
  if (p.pct < 100) return { id: 'finish', step: 1, of, title: `Finish the test (${p.done} of ${p.total})`, why: 'More answers sharpen the profile. Skipped questions count as unknown, not as “no”.', to: '/test', cta: 'Continue the test' };
  if (!s.ui.completed) return { id: 'explore', step: 2, of, title: 'Tell the app how you like to explore', why: 'This changes how the screens are arranged. It is separate from your research interests.', to: '/explore', cta: 'Set my way of exploring' };
  if (!s.feedbackLog.length && !s.saved.length) return { id: 'react', step: 3, of, title: 'React to your top topics', why: 'Tell the app what is “very interesting”, “too broad” or “not for me”. It adjusts, and you can undo any reaction.', to: '/topics', cta: 'See recommended topics' };
  if (s.saved.length < 3) return { id: 'save', step: 4, of, title: `Save ${3 - s.saved.length} more topic${3 - s.saved.length > 1 ? 's' : ''} to compare`, why: 'A comparison needs at least three candidates. Include one you doubt, as a test.', to: '/topics', cta: 'Browse topics' };
  if (!Object.keys(s.labs).length) return { id: 'lab', step: 5, of, title: 'Refine your leading topic in the lab', why: 'Narrow it, change the scope, try the lower-risk version and watch the feasibility change.', to: `/topics/${s.saved[0]}?tab=lab`, cta: 'Open the lab' };
  return { id: 'decide', step: 6, of, title: 'Compare your shortlist and test your priorities', why: 'Change the weights and see whether your leading topic stays on top.', to: '/dashboard', cta: 'Open the dashboard' };
}
