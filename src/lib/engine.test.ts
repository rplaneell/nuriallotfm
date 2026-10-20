import { describe, expect, it } from 'vitest';
import type { Answers, FeedbackEvent } from '@/types';
import { computeProfile, findTensions, progress } from './profile';
import { QUESTIONS, visibleQuestions, optionsFor } from '@/data/questions';
import { activeFeedback, rankTopics } from './recommend';
import { TOPICS } from '@/data/topics';
import { applyLab, defaultLab, presetFor } from './lab';
import { overall, scoreCriteria } from './feasibility';
import { DEFAULT_DECISION_WEIGHTS, rankDecision, sensitivity } from './decision';
import { buildTimeline } from './timeline';
import { dedupeWorks, overlap, type Work } from './evidence';
import { buildBackup, buildCsv, buildHtml, buildMarkdown, parseBackup } from './io';
import { initialState } from '@/store/useApp';

const at = 1;
const ans = (o: Record<string, Answers[string]['value']>): Answers => Object.fromEntries(Object.entries(o).map(([k, value]) => [k, { value, at }]));

/** An answer set of a person drawn to local implementation and integration. */
const localImplementer = ans({
  'q1-pick': ['sc-munis', 'sc-eval'], 'q1-why-sc-munis': 'm-comp', 'q1-why-sc-eval': 'm-eval', 'q1-answer': 'ans-rec',
  'q2-pick': ['local', 'integration', 'implementation', 'capacity'], 'q2-pair1': 'p1a', 'q2-pair2': 'p2b',
  'q2-rank': ['local', 'integration', 'implementation', 'capacity'],
  'q3-pick': ['o-gap', 'o-compare', 'o-rec'], 'q4-int': ['comparative', 'documents', 'interviews'], 'q4-cap': ['documents'],
  'q5-days': ['admin', 'pm', 'ngo'], 'q6-level': ['lv-local', 'lv-regional'], 'q6-design': 'd-two',
});

/** An answer set of a person drawn to EU politics, discourse and quantitative work. */
const euQuant = ans({
  'q1-pick': ['sc-eu', 'sc-opinion'], 'q1-why-sc-eu': 'm-comp', 'q1-why-sc-opinion': 'm-inst',
  'q2-pick': ['eu', 'asylum', 'opinion', 'externalisation'], 'q2-pair1': 'p1b', 'q2-pair2': 'p2a', 'q2-pair3': 'p3b',
  'q3-pick': ['o-decide', 'o-conflict'], 'q4-int': ['quant', 'content'], 'q4-cap': ['quant'], 'q5-days': ['eu', 'thinktank', 'academia'], 'q6-level': ['lv-eu', 'lv-intl'],
});

describe('orientation profile', () => {
  it('produces explainable, ordered theme scores with strength labels', () => {
    const p = computeProfile(localImplementer);
    expect(p.dims['t.local'].score).toBeGreaterThan(0.6);
    expect(p.dims['t.local'].contributions.length).toBeGreaterThan(2);
    expect(p.dims['t.local'].strength).toBe('strong');
    expect(p.dims['t.eu']?.score ?? 0).toBeLessThan(p.dims['t.local'].score);
  });

  it('shows follow-up questions only when their trigger holds', () => {
    const none = visibleQuestions({}).map((q) => q.id);
    expect(none).not.toContain('q1-why-sc-munis');
    const withPick = visibleQuestions(ans({ 'q1-pick': ['sc-munis'] })).map((q) => q.id);
    expect(withPick).toContain('q1-why-sc-munis');
    expect(withPick).not.toContain('q1-why-sc-eu');
  });

  it('builds the ranking question from the user’s own earlier picks', () => {
    const q = QUESTIONS.find((x) => x.id === 'q2-rank')!;
    const opts = optionsFor(q, ans({ 'q2-pick': ['eu', 'local'] }));
    expect(opts.map((o) => o.id)).toEqual(['eu', 'local']);
  });

  it('counts skipped questions and treats "not sure" as half weight', () => {
    const sure = computeProfile({ 'q2-pick': { value: ['local'], at } });
    const unsure = computeProfile({ 'q2-pick': { value: ['local'], unsure: true, at } });
    expect(unsure.dims['t.local'].score).toBeLessThan(sure.dims['t.local'].score);
    const skipped = computeProfile({ 'q2-pick': { skipped: true, at }, 'q2-avoid': { skipped: true, at } });
    expect(skipped.skipped).toBe(2);
    expect(skipped.dims['t.local']?.score ?? 0).toBe(0);
  });

  it('lets the user override a score, and marks it as theirs', () => {
    const p = computeProfile(localImplementer, { 't.eu': 0.9 });
    expect(p.dims['t.eu'].score).toBe(0.9);
    expect(p.dims['t.eu'].overridden).toBe(true);
  });

  it('subtracts evidence for subjects the user wants to avoid, without going below zero', () => {
    const p = computeProfile({ 'q2-pick': { value: ['local'], at }, 'q2-avoid': { value: ['local'], at } });
    expect(p.dims['t.local'].score).toBeLessThan(0.6);
    expect(p.dims['t.local'].score).toBeGreaterThanOrEqual(0);
  });

  it('reports preference tensions as prompts', () => {
    const p = computeProfile(ans({ 'q6-risk': 90, 'q4-tech': 10 }));
    expect(findTensions(p).map((t) => t.id)).toContain('ambition-skills');
  });

  it('tracks progress as follow-ups appear', () => {
    expect(progress({}).done).toBe(0);
    const before = progress({}).total;
    expect(progress(ans({ 'q1-pick': ['sc-munis', 'sc-eu'] })).total).toBe(before + 2);
  });
});

describe('recommendations', () => {
  it('ranks differently for different profiles (interests influence topics)', () => {
    const a = rankTopics(computeProfile(localImplementer), []);
    const b = rankTopics(computeProfile(euQuant), []);
    const topA = a.slice(0, 3).map((r) => r.topic.id);
    const topB = b.slice(0, 3).map((r) => r.topic.id);
    expect(topA).toContain('municipal-integration-catalonia');
    expect(topB).toContain('eu-pact-implementation');
    expect(topA).not.toEqual(topB);
  });

  it('explains why a topic is recommended', () => {
    const r = rankTopics(computeProfile(localImplementer), [])[0];
    expect(r.reasons.join(' ')).toMatch(/interest in/i);
    expect(r.parts.reduce((s, p) => s + p.weight, 0)).toBeCloseTo(1);
  });

  it('applies feedback and fully restores the ranking when it is undone', () => {
    const profile = computeProfile(localImplementer);
    const before = rankTopics(profile, []);
    const top = before[0].topic.id;
    const log: FeedbackEvent[] = [{ topicId: top, tag: 'notForMe', at: 1, action: 'add' }];
    const after = rankTopics(profile, log);
    expect(after.find((r) => r.topic.id === top)!.score).toBeLessThan(before[0].score);
    expect(after.find((r) => r.topic.id === top)!.muted).toBe(true);
    const undone = rankTopics(profile, log.slice(0, -1));
    expect(undone.map((r) => r.topic.id)).toEqual(before.map((r) => r.topic.id));
    const removed = rankTopics(profile, [...log, { topicId: top, tag: 'notForMe', at: 2, action: 'remove' }]);
    expect(removed.find((r) => r.topic.id === top)!.score).toBeCloseTo(before[0].score);
  });

  it('keeps one negative response non-permanent: a later "very interesting" replaces it', () => {
    const log: FeedbackEvent[] = [{ topicId: 'padron-access-rights', tag: 'notForMe', at: 1, action: 'add' }, { topicId: 'padron-access-rights', tag: 'very', at: 2, action: 'add' }];
    expect(activeFeedback(log)['padron-access-rights']).toEqual(['very']);
  });

  it('generalises "too technical" to other technical topics only mildly', () => {
    const profile = computeProfile(localImplementer);
    const base = rankTopics(profile, []);
    const log: FeedbackEvent[] = [{ topicId: 'geospatial-service-access', tag: 'tooTechnical', at: 1, action: 'add' }];
    const after = rankTopics(profile, log);
    const tech = TOPICS.find((t) => t.technical >= 4 && t.id !== 'geospatial-service-access');
    if (tech) {
      const d = after.find((r) => r.topic.id === tech.id)!.score - base.find((r) => r.topic.id === tech.id)!.score;
      expect(d).toBeLessThan(0);
      expect(d).toBeGreaterThan(-0.1);
    }
  });

  it('is neutral and says so when no test has been taken', () => {
    const r = rankTopics(computeProfile({}), []);
    expect(r[0].reasons[0]).toMatch(/Take the orientation test/);
  });
});

describe('topic laboratory', () => {
  const topic = TOPICS.find((t) => t.id === 'municipal-integration-catalonia')!;

  it('changes the research question, method and evidence when parameters change', () => {
    const base = applyLab(topic, defaultLab(topic));
    const evalLab = applyLab(topic, { ...defaultLab(topic), focus: 'evaluation', scope: 'spain' });
    expect(evalLab.rq).not.toEqual(base.rq);
    expect(evalLab.rq).toMatch(/evidence/i);
    expect(evalLab.rq).toMatch(/Spain/);
    const lowData = applyLab(topic, { ...defaultLab(topic), dataLoad: 'low' });
    expect(lowData.evidence.length).toBeLessThan(applyLab(topic, { ...defaultLab(topic), dataLoad: 'high' }).evidence.length);
    expect(lowData.methodId).toBe('documents');
  });

  it('narrowing improves scope and clarity; broadening worsens them', () => {
    const narrow = applyLab(topic, { ...defaultLab(topic), breadth: 'narrow' });
    const broad = applyLab(topic, { ...defaultLab(topic), breadth: 'broad' });
    expect(narrow.deltas.scope!).toBeGreaterThan(0);
    expect(broad.deltas.scope!).toBeLessThan(0);
    expect(narrow.rq).toMatch(/one dimension/);
  });

  it('flags interview dependence and minors as risks', () => {
    const r = applyLab(topic, { ...defaultLab(topic), method: 'interviews', population: 'minors' });
    expect(r.deltas.interviews!).toBeLessThan(0);
    expect(r.deltas.ethics!).toBeLessThan(-1);
    expect(r.warnings.join(' ')).toMatch(/minors/i);
  });

  it('generates three versions whose workloads and risks are ordered', () => {
    const profile = computeProfile(localImplementer);
    const [amb, bal, low] = (['ambitious', 'balanced', 'lower-risk'] as const).map((a) => {
      const res = applyLab(topic, presetFor(topic, a), profile);
      const c = scoreCriteria(topic, profile, res.deltas);
      return { res, scope: c.find((x) => x.id === 'scope')!.score, overall: overall(c).score };
    });
    expect(amb.res.workloadWeeks).toBeGreaterThan(bal.res.workloadWeeks);
    expect(low.res.workloadWeeks).toBeLessThan(bal.res.workloadWeeks);
    expect(low.scope).toBeGreaterThan(amb.scope);
  });

  it('never produces criterion scores outside 1..5', () => {
    const profile = computeProfile(localImplementer);
    for (const t of TOPICS) for (const a of ['ambitious', 'balanced', 'lower-risk'] as const) {
      const res = applyLab(t, presetFor(t, a), profile);
      for (const c of scoreCriteria(t, profile, res.deltas)) { expect(c.score).toBeGreaterThanOrEqual(1); expect(c.score).toBeLessThanOrEqual(5); }
    }
  });
});

describe('decision dashboard', () => {
  const profile = computeProfile(localImplementer);
  const items = ['municipal-integration-catalonia', 'eu-pact-implementation', 'geospatial-service-access'].map((id) => {
    const t = TOPICS.find((x) => x.id === id)!;
    return { topicId: id, criteria: scoreCriteria(t, profile, applyLab(t, defaultLab(t), profile).deltas) };
  });

  it('re-ranks immediately when weights change', () => {
    const interestFirst = rankDecision(items, { interest: 5, feasibility: 0, career: 0, academic: 0, policy: 0 });
    const feasibilityFirst = rankDecision(items, { interest: 0, feasibility: 5, career: 0, academic: 0, policy: 0 });
    expect(interestFirst[0].total).not.toBeCloseTo(feasibilityFirst[0].total);
    expect(interestFirst.map((r) => r.topicId)).not.toEqual(feasibilityFirst.map((r) => r.topicId).reverse());
    expect(rankDecision(items, DEFAULT_DECISION_WEIGHTS).map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('runs a reproducible sensitivity analysis', () => {
    const a = sensitivity(items, DEFAULT_DECISION_WEIGHTS);
    const b = sensitivity(items, DEFAULT_DECISION_WEIGHTS);
    expect(a).toEqual(b);
    expect(a.rows.reduce((s, r) => s + r.winShare, 0)).toBeCloseTo(1);
    expect(a.byPriority).toHaveLength(5);
  });

  it('asks for at least two topics', () => {
    expect(sensitivity(items.slice(0, 1), DEFAULT_DECISION_WEIGHTS).message).toMatch(/at least two/);
  });
});

describe('timeline', () => {
  it('does not invent a deadline', () => {
    const p = buildTimeline({ startDate: '', deadline: '', confirmedFromOfficial: false });
    expect(p.confirmed).toBe(false);
    expect(p.stages[0].start).toBeUndefined();
  });
  it('schedules stages between the dates the user confirmed', () => {
    const p = buildTimeline({ startDate: '2027-02-01', deadline: '2027-06-15', confirmedFromOfficial: true });
    expect(p.confirmed).toBe(true);
    expect(p.stages[0].start).toBe('2027-02-01');
    expect(p.stages.at(-1)!.end! <= '2027-06-15').toBe(true);
  });
});

describe('evidence handling', () => {
  const w = (o: Partial<Work>): Work => ({ openalexId: 'x', doi: null, title: 't', authors: [], authorCount: 0, year: 2020, type: 'article', venue: null, venueType: null, citedBy: 0, openAccess: false, oaUrl: null, topic: null, abstractExcerpt: null, url: '', retrievedAt: '2026-10-19', ...o });
  it('groups duplicates by DOI or normalised title', () => {
    const g = dedupeWorks([w({ openalexId: 'a', title: 'The Emergence of New Street-Level Bureaucracies in Italy’s Asylum Reception System' }), w({ openalexId: 'b', title: "The emergence of new street-level bureaucracies in Italy's asylum reception system" }), w({ openalexId: 'c', title: 'Different', doi: 'https://doi.org/10.1/x' }), w({ openalexId: 'd', title: 'Other title', doi: 'https://doi.org/10.1/X' })]);
    expect(g).toHaveLength(2);
    expect(g[0].duplicates).toHaveLength(1);
  });
  it('measures overlap between a question and a thesis', () => {
    expect(overlap('local integration policy in Catalan municipalities', 'Integration policy in municipalities of Catalonia')).toBeGreaterThan(0.4);
    expect(overlap('local integration policy', 'quantum chemistry of benzene')).toBe(0);
  });
});

describe('export and import', () => {
  const state = { ...initialState(), saved: ['municipal-integration-catalonia', 'padron-access-rights'], notes: { 'padron-access-rights': '=HYPERLINK("x") & <script>alert(1)</script>' }, openQuestions: { 'padron-access-rights': ['Which services need empadronamiento?'] } };
  const profile = computeProfile(localImplementer);

  it('exports Markdown with the shortlist, labels and verification flags', () => {
    const md = buildMarkdown({ state, profile, today: '2026-10-19' });
    expect(md).toContain('# TFM shortlist');
    expect(md).toContain('generated hypothesis');
    expect(md).toContain('Claims to verify');
    expect(md).toContain('Which services need empadronamiento?');
    expect(md).not.toContain('NaN');
  });

  it('exports CSV with one row per saved topic and neutralises formula injection', () => {
    const rows = buildCsv({ state, profile }).split('\r\n');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain('Personal-interest alignment');
    expect(rows.join('\n')).toContain("'=HYPERLINK");
  });

  it('escapes HTML in the printable report', () => {
    const html = buildHtml({ state, profile });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<!doctype html>');
  });

  it('round-trips a backup and rejects malformed or foreign files', () => {
    const back = parseBackup(buildBackup(state));
    expect(back.ok).toBe(true);
    if (back.ok) expect(back.state.saved).toEqual(state.saved);
    expect(parseBackup('{not json').ok).toBe(false);
    expect(parseBackup('{"app":"other","state":{}}').ok).toBe(false);
    const evil = JSON.stringify({ app: 'migration-tfm-explorer', state: { saved: ['nope', 'padron-access-rights'], notes: { 'padron-access-rights': 5 }, ui: { detail: 'weird' }, __proto__: { polluted: true } } });
    const r = parseBackup(evil);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.state.saved).toEqual(['padron-access-rights']); expect(r.warnings.join(' ')).toMatch(/unknown topic/); expect(r.state.ui?.detail).toBe('standard'); expect(({} as Record<string, unknown>).polluted).toBeUndefined(); }
  });
});

describe('content integrity', () => {
  it('every topic has the required structured fields', () => {
    for (const t of TOPICS) {
      expect(t.subs.length).toBeGreaterThanOrEqual(2); expect(t.subs.length).toBeLessThanOrEqual(4);
      expect(t.hypotheses.length).toBeGreaterThan(0);
      for (const h of t.hypotheses) expect(h).toMatch(/provisional/i);
      expect(t.alternatives.length).toBeGreaterThan(1);
      expect(t.careers.length).toBeGreaterThan(1);
      expect(t.outputs.length).toBeGreaterThan(0);
      expect(t.sourceIds.length).toBeGreaterThan(2);
      expect(t.limitations.length).toBeGreaterThan(0);
      expect(t.ethics.length).toBeGreaterThan(0);
    }
  });
  it('every referenced id resolves', async () => {
    const { sourceById } = await import('@/data/sources'); const { roleById, outputById } = await import('@/data/careers'); const { placeById } = await import('@/data/places'); const { theoryById, methodById } = await import('@/data/taxonomy');
    for (const t of TOPICS) {
      for (const s of t.sourceIds) expect(sourceById(s), `${t.id} source ${s}`).toBeDefined();
      for (const c of t.careers) expect(roleById(c.roleId), `${t.id} role ${c.roleId}`).toBeDefined();
      for (const o of t.outputs) expect(outputById(o.outputId), `${t.id} output ${o.outputId}`).toBeDefined();
      for (const p of t.placeIds) expect(placeById(p), `${t.id} place ${p}`).toBeDefined();
      for (const th of [...t.theories, ...t.foundationalFrameworks]) expect(theoryById(th), `${t.id} theory ${th}`).toBeDefined();
      expect(methodById(t.primaryMethod), `${t.id} method`).toBeDefined();
      for (const m of t.secondaryMethods) expect(methodById(m), `${t.id} method ${m}`).toBeDefined();
    }
  });
});
