import type { Answers, DimensionResult, Profile, QOption, Question, SignalStrength, Weights } from '@/types';
import { QUESTIONS, optionsFor, visibleQuestions } from '@/data/questions';

const RANK_DECAY = [1, 0.8, 0.6, 0.45, 0.3, 0.2, 0.15];

interface Touch { qid: string; prompt: string; label: string; weight: number; max: number }

/** Contributions a single answer makes to each dimension, plus the maximum it could have made. */
function answerTouches(q: Question, a: Answers): { dims: Map<string, Touch[]>; bipolar: Map<string, { sample: number; conf: number }[]> } {
  const dims = new Map<string, Touch[]>();
  const bipolar = new Map<string, { sample: number; conf: number }[]>();
  const ans = a[q.id];
  const opts: QOption[] = optionsFor(q, a);
  const push = (key: string, t: Touch) => dims.set(key, [...(dims.get(key) ?? []), t]);
  const pushBi = (key: string, sample: number, conf: number) => bipolar.set(key, [...(bipolar.get(key) ?? []), { sample, conf }]);

  // maximum possible positive contribution per dimension for this question (denominator)
  const maxFor = (key: string): number => {
    let m = 0;
    for (const o of opts) m = Math.max(m, o.w[key] ?? 0);
    return m;
  };
  const dimsInQuestion = new Set<string>();
  for (const o of opts) for (const k of Object.keys(o.w)) if (!k.startsWith('b.')) dimsInQuestion.add(k);

  if (!ans || ans.skipped || ans.value === undefined) {
    return { dims, bipolar };
  }
  const factor = ans.unsure ? 0.5 : 1;

  const apply = (o: QOption, scale: number) => {
    for (const [k, wt] of Object.entries(o.w)) {
      if (k.startsWith('b.')) { pushBi(k, 50 + 50 * Math.max(-1, Math.min(1, wt)), Math.abs(wt) * scale * factor); continue; }
      const signed = q.negative ? -Math.abs(wt) * 0.7 : wt;
      push(k, { qid: q.id, prompt: q.prompt, label: o.label, weight: signed * scale * factor, max: maxFor(k) });
    }
  };

  if (q.kind === 'slider' && q.slider && typeof ans.value === 'number') {
    pushBi(q.slider.dim, ans.value, 1 * factor);
    return { dims, bipolar };
  }
  if ((q.kind === 'single' || q.kind === 'pair') && typeof ans.value === 'string') {
    const o = opts.find((x) => x.id === ans.value);
    if (o) apply(o, 1);
  }
  if (q.kind === 'multi' && Array.isArray(ans.value)) {
    for (const id of ans.value) { const o = opts.find((x) => x.id === id); if (o) apply(o, 1); }
  }
  if (q.kind === 'rank' && Array.isArray(ans.value)) {
    ans.value.forEach((id, i) => { const o = opts.find((x) => x.id === id); if (o) apply(o, RANK_DECAY[i] ?? 0.1); });
  }
  // mark dimensions asked but not touched (so denominators include the question)
  for (const k of dimsInQuestion) if (!dims.has(k)) dims.set(k, []);
  return { dims, bipolar };
}

function strengthOf(score: number, evidence: number): SignalStrength {
  if (evidence === 0) return 'none';
  if (score >= 0.6 && evidence >= 3) return 'strong';
  if (score >= 0.4 && evidence >= 2) return 'moderate';
  if (score >= 0.2) return 'tentative';
  return 'none';
}

export function computeProfile(answers: Answers, overrides: Record<string, number> = {}, bipolarOverrides: Record<string, number> = {}): Profile {
  const num = new Map<string, number>();
  const den = new Map<string, number>();
  const ev = new Map<string, number>();
  const contrib = new Map<string, Touch[]>();
  const bi = new Map<string, { sample: number; conf: number }[]>();

  let skipped = 0, unsure = 0, answered = 0;
  const openText: Profile['openText'] = [];

  for (const q of visibleQuestions(answers)) {
    const ans = answers[q.id];
    if (!ans) continue;
    if (ans.skipped) { if (ans.unsure) unsure++; else skipped++; continue; }
    if (q.kind === 'text') {
      if (typeof ans.value === 'string' && ans.value.trim()) { openText.push({ qid: q.id, prompt: q.prompt, text: ans.value.trim() }); answered++; }
      continue;
    }
    answered++;
    if (ans.unsure) unsure++;
    const { dims, bipolar } = answerTouches(q, answers);
    for (const [k, touches] of dims) {
      const max = touches[0]?.max ?? maxOfQuestionDim(q, answers, k);
      // denominator: question could have contributed `max`; for multi/rank, one slot per question
      den.set(k, (den.get(k) ?? 0) + (max || 1));
      for (const t of touches) {
        num.set(k, (num.get(k) ?? 0) + t.weight);
        if (Math.abs(t.weight) > 0.01) ev.set(k, (ev.get(k) ?? 0) + 1);
        contrib.set(k, [...(contrib.get(k) ?? []), { qid: t.qid, prompt: t.prompt, label: t.label, weight: t.weight, max: t.max }]);
      }
    }
    for (const [k, samples] of bipolar) bi.set(k, [...(bi.get(k) ?? []), ...samples]);
  }

  const dimsOut: Record<string, DimensionResult> = {};
  const keys = new Set([...den.keys(), ...Object.keys(overrides)]);
  for (const k of keys) {
    const raw = (num.get(k) ?? 0) / Math.max(den.get(k) ?? 1, 1);
    const score = Math.max(0, Math.min(1, raw));
    const e = ev.get(k) ?? 0;
    const overridden = k in overrides;
    dimsOut[k] = {
      id: k, score: overridden ? overrides[k] : score, evidence: e, overridden,
      strength: overridden ? 'strong' : strengthOf(score, e),
      contributions: (contrib.get(k) ?? []).filter((c) => Math.abs(c.weight) > 0.01).map(({ qid, prompt, label, weight }) => ({ qid, prompt, label, weight })),
    };
  }

  const bipolarOut: Profile['bipolar'] = {};
  const biKeys = new Set([...bi.keys(), ...Object.keys(bipolarOverrides)]);
  for (const k of biKeys) {
    const samples = bi.get(k) ?? [];
    const conf = samples.reduce((s, x) => s + x.conf, 0);
    const mean = conf > 0 ? samples.reduce((s, x) => s + x.sample * x.conf, 0) / conf : 50;
    const overridden = k in bipolarOverrides;
    bipolarOut[k] = { value: overridden ? bipolarOverrides[k] : mean, evidence: samples.length, overridden };
  }
  return { dims: dimsOut, bipolar: bipolarOut, answered, skipped, unsure, openText };
}

function maxOfQuestionDim(q: Question, a: Answers, key: string): number {
  let m = 0;
  for (const o of optionsFor(q, a)) m = Math.max(m, o.w[key] ?? 0);
  return m;
}

export const dimScore = (p: Profile, key: string): number => p.dims[key]?.score ?? 0;
export const biValue = (p: Profile, key: string): number => p.bipolar[key]?.value ?? 50;

export function topDims(p: Profile, prefix: string, n = 5, minScore = 0.15): DimensionResult[] {
  return Object.values(p.dims)
    .filter((d) => d.id.startsWith(prefix) && d.score >= minScore)
    .sort((a, b) => b.score - a.score || b.evidence - a.evidence)
    .slice(0, n);
}

export function progress(answers: Answers) {
  const vis = visibleQuestions(answers);
  const done = vis.filter((q) => answers[q.id] && (answers[q.id].skipped || answers[q.id].value !== undefined)).length;
  return { total: vis.length, done, pct: vis.length ? Math.round((done / vis.length) * 100) : 0 };
}

export function stageProgress(answers: Answers, stage: number) {
  const vis = visibleQuestions(answers).filter((q) => q.stage === stage);
  const done = vis.filter((q) => answers[q.id] && (answers[q.id].skipped || answers[q.id].value !== undefined)).length;
  return { total: vis.length, done };
}

/** Preference conflicts: pairs of signals that pull in different directions. Each is a prompt to reflect, not a verdict. */
export interface Tension { id: string; title: string; detail: string }

export function findTensions(p: Profile): Tension[] {
  const out: Tension[] = [];
  const amb = biValue(p, 'b.ambition');
  const techApp = biValue(p, 'b.technical');
  const quantCap = dimScore(p, 'mc.quant') + dimScore(p, 'mc.opendata') + dimScore(p, 'mc.geospatial');
  const quantWish = dimScore(p, 'mw.quant') + dimScore(p, 'mw.geospatial') + dimScore(p, 'mi.quant');
  if (amb > 65 && quantCap < 0.3 && techApp < 40)
    out.push({ id: 'ambition-skills', title: 'Technical ambition without time to learn', detail: 'You lean towards a technically challenging project but report little prior technical experience and limited time to learn. Consider a staged plan: start descriptive, add complexity if time allows.' });
  if (quantWish > 0.6 && quantCap < 0.3 && techApp >= 50)
    out.push({ id: 'learn-quant', title: 'Wanting to learn quantitative methods', detail: 'You want quantitative skills and are willing to invest time. Plan 4–6 weeks early in the project and choose open, well-documented data.' });
  if (biValue(p, 'b.stakeholder') > 65 && dimScore(p, 's.exploratory') < 0.1 && biValue(p, 'b.ambition') < 35)
    out.push({ id: 'stakeholder-risk', title: 'Stakeholder work with a lower-risk preference', detail: 'You enjoy working with stakeholders but also prefer low risk. Stakeholder access is a main source of delay: have a document-based fallback.' });
  if (biValue(p, 'b.applied') > 65 && dimScore(p, 'c.academia') > 0.4)
    out.push({ id: 'applied-academia', title: 'Applied orientation with an academic career interest', detail: 'You prefer applied work but also like academic careers. A thesis with a clear theoretical frame and a policy product can serve both.' });
  if (dimScore(p, 's.eu') > 0.4 && biValue(p, 'b.mobility') < 30)
    out.push({ id: 'eu-mobility', title: 'EU focus but low mobility', detail: 'EU-level roles are concentrated outside Catalonia. Regional or Spanish topics with EU links may fit your plans better.' });
  if (dimScore(p, 'c.admin') > 0.4 && dimScore(p, 'c.thinktank') > 0.4 && biValue(p, 'b.implement') > 60)
    out.push({ id: 'admin-vs-research', title: 'Delivery roles and research roles both attract you', detail: 'Public administration rewards implementation understanding; think tanks reward publications. A policy-analysis thesis with a brief can serve both, but you may later need to choose.' });
  if (dimScore(p, 's.comparative') > 0.4 && biValue(p, 'b.stakeholder') > 60 && biValue(p, 'b.ambition') < 40)
    out.push({ id: 'comp-lowrisk', title: 'Comparison and interviews, but low risk', detail: 'Comparing cases with interviews multiplies access risk. Comparative document analysis keeps the comparison but reduces risk.' });
  return out;
}

/** Uncertainties worth exploring: weak or contradictory signals. */
export function findUncertainties(p: Profile): string[] {
  const out: string[] = [];
  if (p.skipped > 0) out.push(`${p.skipped} question${p.skipped > 1 ? 's' : ''} skipped. The profile may change when they are answered.`);
  if (p.unsure > 0) out.push(`${p.unsure} answer${p.unsure > 1 ? 's' : ''} marked “not sure”, counted at half weight.`);
  const tentativeThemes = topDims(p, 't.', 8, 0.2).filter((d) => d.strength === 'tentative');
  if (tentativeThemes.length) out.push(`Tentative interest in ${tentativeThemes.slice(0, 3).length} theme(s) with only one or two supporting answers.`);
  const careers = topDims(p, 'c.', 3, 0.2);
  if (careers.length >= 3 && Math.abs(careers[0].score - careers[2].score) < 0.15) out.push('No clear professional direction yet: the top three environments are close in score.');
  const themeTop = topDims(p, 't.', 3, 0.2);
  if (themeTop.length >= 3 && Math.abs(themeTop[0].score - themeTop[2].score) < 0.12) out.push('No single dominant subject yet: your top themes are close.');
  return out;
}

export function allQuestionIds(): string[] { return QUESTIONS.map((q) => q.id); }
export type { Weights };
