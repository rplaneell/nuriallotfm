import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Answer, Answers, DecisionWeights, ExploreMode, FeedbackEvent, FeedbackTag, LabParams, TimelineSettings, UiPrefs, CriterionId } from '@/types';
import { DEFAULT_DECISION_WEIGHTS } from '@/lib/decision';
import { DEFAULT_CRITERION_WEIGHTS } from '@/lib/feasibility';
import { TOPICS } from '@/data/topics';
import { defaultLab } from '@/lib/lab';

export const STORE_KEY = 'migration-tfm-explorer';
export const STORE_VERSION = 1;

// localStorage can be missing or throw (private windows, blocked storage): never let that break the app.
const safeStorage: StateStorage = {
  getItem: (n) => { try { return localStorage.getItem(n); } catch { return null; } },
  setItem: (n, v) => { try { localStorage.setItem(n, v); } catch { /* storage unavailable: state stays in memory */ } },
  removeItem: (n) => { try { localStorage.removeItem(n); } catch { /* ignore */ } },
};

export const DEFAULT_UI: UiPrefs = { modes: ['guided'], detail: 'standard', breadth: 'broad', format: 'balanced', fullOverview: false, completed: false };
export const DEFAULT_TIMELINE: TimelineSettings = { startDate: '', deadline: '', confirmedFromOfficial: false };

export interface Comparison { id: string; a: string; b: string; kind: 'place' ; createdAt: number }
export interface TopicEdit { title?: string; rq?: string }
export interface SourceCheck { ok: boolean; status: number | null; at: string; note?: string }

export interface PersistedState {
  answers: Answers;
  dimOverrides: Record<string, number>;
  biOverrides: Record<string, number>;
  ui: UiPrefs;
  pinnedRoles: string[];
  feedbackLog: FeedbackEvent[];
  saved: string[];
  labs: Record<string, LabParams>;
  edits: Record<string, TopicEdit>;
  notes: Record<string, string>;
  openQuestions: Record<string, string[]>;
  savedPlaces: string[];
  comparisons: Comparison[];
  weights: DecisionWeights;
  criterionWeights: Record<CriterionId, number>;
  timeline: TimelineSettings;
  sourceChecks: Record<string, SourceCheck>;
  targetNotes: string;
}

interface Actions {
  setAnswer: (qid: string, a: Omit<Answer, 'at'>) => void;
  clearAnswer: (qid: string) => void;
  resetTest: () => void;
  setOverride: (key: string, v: number | null) => void;
  setBiOverride: (key: string, v: number | null) => void;
  setUi: (patch: Partial<UiPrefs>) => void;
  toggleMode: (m: ExploreMode) => void;
  resetUi: () => void;
  togglePinnedRole: (id: string) => void;
  addFeedback: (topicId: string, tag: FeedbackTag) => void;
  removeFeedback: (topicId: string, tag: FeedbackTag) => void;
  undoFeedback: () => void;
  clearFeedback: () => void;
  toggleSaved: (topicId: string) => void;
  moveSaved: (topicId: string, dir: -1 | 1) => void;
  setLab: (topicId: string, patch: Partial<LabParams>) => void;
  replaceLab: (topicId: string, lab: LabParams) => void;
  resetLab: (topicId: string) => void;
  setEdit: (topicId: string, patch: TopicEdit) => void;
  clearEdit: (topicId: string) => void;
  setNote: (topicId: string, text: string) => void;
  addOpenQuestion: (topicId: string, text: string) => void;
  removeOpenQuestion: (topicId: string, idx: number) => void;
  toggleSavedPlace: (id: string) => void;
  addComparison: (a: string, b: string) => void;
  removeComparison: (id: string) => void;
  setWeights: (w: Partial<DecisionWeights>) => void;
  setCriterionWeight: (id: CriterionId, v: number) => void;
  resetWeights: () => void;
  setTimeline: (patch: Partial<TimelineSettings>) => void;
  setSourceCheck: (key: string, c: SourceCheck) => void;
  setTargetNotes: (t: string) => void;
  importState: (s: Partial<PersistedState>) => void;
  resetAll: () => void;
}

export type AppState = PersistedState & Actions;

export const initialState = (): PersistedState => ({
  answers: {}, dimOverrides: {}, biOverrides: {}, ui: { ...DEFAULT_UI }, pinnedRoles: [], feedbackLog: [], saved: [], labs: {}, edits: {}, notes: {}, openQuestions: {},
  savedPlaces: [], comparisons: [], weights: { ...DEFAULT_DECISION_WEIGHTS }, criterionWeights: { ...DEFAULT_CRITERION_WEIGHTS }, timeline: { ...DEFAULT_TIMELINE }, sourceChecks: {}, targetNotes: '',
});

const uid = () => Math.random().toString(36).slice(2, 10);

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState(),
      setAnswer: (qid, a) => set((s) => ({ answers: { ...s.answers, [qid]: { ...a, at: Date.now() } } })),
      clearAnswer: (qid) => set((s) => { const rest = { ...s.answers }; delete rest[qid]; return { answers: rest }; }),
      resetTest: () => set({ answers: {}, dimOverrides: {}, biOverrides: {} }),
      setOverride: (key, v) => set((s) => { const o = { ...s.dimOverrides }; if (v === null) delete o[key]; else o[key] = v; return { dimOverrides: o }; }),
      setBiOverride: (key, v) => set((s) => { const o = { ...s.biOverrides }; if (v === null) delete o[key]; else o[key] = v; return { biOverrides: o }; }),
      setUi: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),
      toggleMode: (m) => set((s) => {
        const has = s.ui.modes.includes(m);
        let modes = has ? s.ui.modes.filter((x) => x !== m) : [...s.ui.modes, m];
        if (m === 'hybrid' && !has) modes = ['hybrid'];
        else if (m !== 'hybrid') modes = modes.filter((x) => x !== 'hybrid');
        return { ui: { ...s.ui, modes: modes.length ? modes : ['guided'] } };
      }),
      resetUi: () => set({ ui: { ...DEFAULT_UI } }),
      togglePinnedRole: (id) => set((s) => ({ pinnedRoles: s.pinnedRoles.includes(id) ? s.pinnedRoles.filter((x) => x !== id) : [...s.pinnedRoles, id] })),
      addFeedback: (topicId, tag) => set((s) => ({ feedbackLog: [...s.feedbackLog, { topicId, tag, at: Date.now(), action: 'add' }] })),
      removeFeedback: (topicId, tag) => set((s) => ({ feedbackLog: [...s.feedbackLog, { topicId, tag, at: Date.now(), action: 'remove' }] })),
      undoFeedback: () => set((s) => ({ feedbackLog: s.feedbackLog.slice(0, -1) })),
      clearFeedback: () => set({ feedbackLog: [] }),
      toggleSaved: (topicId) => set((s) => ({ saved: s.saved.includes(topicId) ? s.saved.filter((x) => x !== topicId) : [...s.saved, topicId] })),
      moveSaved: (topicId, dir) => set((s) => {
        const i = s.saved.indexOf(topicId); const j = i + dir;
        if (i < 0 || j < 0 || j >= s.saved.length) return {};
        const next = [...s.saved]; [next[i], next[j]] = [next[j], next[i]];
        return { saved: next };
      }),
      setLab: (topicId, patch) => set((s) => {
        const topic = TOPICS.find((t) => t.id === topicId);
        const cur = s.labs[topicId] ?? (topic ? defaultLab(topic) : undefined);
        if (!cur) return {};
        return { labs: { ...s.labs, [topicId]: { ...cur, ...patch } } };
      }),
      replaceLab: (topicId, lab) => set((s) => ({ labs: { ...s.labs, [topicId]: lab } })),
      resetLab: (topicId) => set((s) => { const rest = { ...s.labs }; delete rest[topicId]; return { labs: rest }; }),
      setEdit: (topicId, patch) => set((s) => ({ edits: { ...s.edits, [topicId]: { ...s.edits[topicId], ...patch } } })),
      clearEdit: (topicId) => set((s) => { const rest = { ...s.edits }; delete rest[topicId]; return { edits: rest }; }),
      setNote: (topicId, text) => set((s) => ({ notes: { ...s.notes, [topicId]: text } })),
      addOpenQuestion: (topicId, text) => set((s) => text.trim() ? ({ openQuestions: { ...s.openQuestions, [topicId]: [...(s.openQuestions[topicId] ?? []), text.trim()] } }) : {}),
      removeOpenQuestion: (topicId, idx) => set((s) => ({ openQuestions: { ...s.openQuestions, [topicId]: (s.openQuestions[topicId] ?? []).filter((_, i) => i !== idx) } })),
      toggleSavedPlace: (id) => set((s) => ({ savedPlaces: s.savedPlaces.includes(id) ? s.savedPlaces.filter((x) => x !== id) : [...s.savedPlaces, id] })),
      addComparison: (a, b) => set((s) => (a && b && a !== b && !s.comparisons.some((c) => (c.a === a && c.b === b) || (c.a === b && c.b === a)) ? { comparisons: [...s.comparisons, { id: uid(), a, b, kind: 'place', createdAt: Date.now() }] } : {})),
      removeComparison: (id) => set((s) => ({ comparisons: s.comparisons.filter((c) => c.id !== id) })),
      setWeights: (w) => set((s) => ({ weights: { ...s.weights, ...w } })),
      setCriterionWeight: (id, v) => set((s) => ({ criterionWeights: { ...s.criterionWeights, [id]: v } })),
      resetWeights: () => set({ weights: { ...DEFAULT_DECISION_WEIGHTS }, criterionWeights: { ...DEFAULT_CRITERION_WEIGHTS } }),
      setTimeline: (patch) => set((s) => ({ timeline: { ...s.timeline, ...patch } })),
      setSourceCheck: (key, c) => set((s) => ({ sourceChecks: { ...s.sourceChecks, [key]: c } })),
      setTargetNotes: (t) => set({ targetNotes: t }),
      importState: (incoming) => set({ ...initialState(), ...incoming }),
      resetAll: () => { set(initialState()); void get; },
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s): PersistedState => ({
        answers: s.answers, dimOverrides: s.dimOverrides, biOverrides: s.biOverrides, ui: s.ui, pinnedRoles: s.pinnedRoles, feedbackLog: s.feedbackLog, saved: s.saved, labs: s.labs, edits: s.edits,
        notes: s.notes, openQuestions: s.openQuestions, savedPlaces: s.savedPlaces, comparisons: s.comparisons, weights: s.weights, criterionWeights: s.criterionWeights, timeline: s.timeline,
        sourceChecks: s.sourceChecks, targetNotes: s.targetNotes,
      }),
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<PersistedState>), ui: { ...current.ui, ...((persisted as Partial<PersistedState>)?.ui ?? {}) } }),
    },
  ),
);
