import type { Answers, QOption, Question, Weights } from '@/types';
import { APPROACHES, ENVIRONMENTS, METHODS, THEMES } from './taxonomy';

/**
 * Weight keys:
 *  t.<theme>   substantive interest          a.<approach>  way of thinking
 *  mi./mc./mw. method interest / capability / wish to learn
 *  c.<env>     professional environment       s.<scope>     scope preferences
 *  b.<name>    bipolar sliders (0..100)
 */

const w = (o: Weights): Weights => o;
const opt = (id: string, label: string, weights: Weights, detail?: string): QOption => ({ id, label, detail, w: weights });

export const STAGES = [
  { n: 1, title: 'What motivates you', blurb: 'Realistic policy situations. Pick what pulls you in, then say why.' },
  { n: 2, title: 'Substantive interests', blurb: 'Subjects you might spend months on, and ones you would rather avoid.' },
  { n: 3, title: 'How you think', blurb: 'The kind of question you like to ask.' },
  { n: 4, title: 'Methods', blurb: 'What you can already do, what you enjoy, and what you want to learn.' },
  { n: 5, title: 'Professional direction', blurb: 'Concrete days of work, not job titles.' },
  { n: 6, title: 'Scope and ambition', blurb: 'The size and risk of the project you would be happy to carry.' },
];

// ---------------- Stage 1: scenarios ----------------
export const SCENARIOS: { id: string; text: string; w: Weights }[] = [
  { id: 'sc-eval', text: 'A government funds integration programmes but cannot demonstrate whether they work.', w: w({ 't.evaluation': 1, 't.integration': 0.6, 't.capacity': 0.3, 'mi.evaluation': 0.4 }) },
  { id: 'sc-munis', text: 'Two municipalities implement the same national migration policy but achieve different results.', w: w({ 't.local': 1, 't.implementation': 0.7, 't.integration': 0.4, 's.local': 0.6 }) },
  { id: 'sc-eu', text: 'An EU asylum policy is adopted, but implementation varies between member states.', w: w({ 't.eu': 1, 't.asylum': 0.6, 't.implementation': 0.8, 's.eu': 0.7 }) },
  { id: 'sc-rights', text: 'Migrants have formal rights to public services but meet administrative barriers in practice.', w: w({ 't.citizenship': 1, 't.discretion': 0.6, 't.implementation': 0.5, 't.inequality': 0.4 }) },
  { id: 'sc-opinion', text: 'Public opinion on migration changes, but government responses differ between regions.', w: w({ 't.opinion': 1, 't.local': 0.4, 't.governance': 0.4 }) },
  { id: 'sc-causal', text: 'A migration programme looks successful, but the available evidence cannot show it caused the results.', w: w({ 't.evaluation': 0.9, 'mi.quant': 0.4, 'mi.evaluation': 0.6, 'a.evaluate': 0.4 }) },
  { id: 'sc-coord', text: 'Public institutions struggle to coordinate responsibilities across national, regional and local levels.', w: w({ 't.capacity': 1, 't.governance': 0.8, 't.local': 0.4 }) },
  { id: 'sc-unint', text: 'A policy meant to protect vulnerable people produces unintended consequences.', w: w({ 't.inequality': 0.8, 't.gender': 0.3, 't.discretion': 0.3, 'a.inequalities': 0.5 }) },
];

const MOTIVES: QOption[] = [
  opt('m-inst', 'Understanding how the institutions and decisions work', w({ 'a.decisions': 0.7, 'a.explain': 0.4, 't.governance': 0.3 })),
  opt('m-comp', 'Comparing cases to see what explains the differences', w({ 'a.compare': 1, 'a.explain': 0.4, 's.comparative': 0.5 })),
  opt('m-eval', 'Checking whether it actually delivers what it promises', w({ 'a.evaluate': 1, 'a.implgap': 0.3 })),
  opt('m-fix', 'Working out what should be done differently', w({ 'a.recommend': 1, 'a.tools': 0.3, 'b.applied': 0.5 })),
];

const selected = (a: Answers, qid: string, id: string): boolean => {
  const v = a[qid]?.value;
  return Array.isArray(v) && v.includes(id);
};

const motiveQ = (sc: (typeof SCENARIOS)[number], idx: number): Question => ({
  id: `q1-why-${sc.id}`, stage: 1, kind: 'single', followUpOf: 'q1-pick',
  prompt: `You picked: “${sc.text}” What draws you to it most?`,
  help: 'The same situation can interest different people for different reasons. This tells us which one is yours.',
  options: MOTIVES,
  showIf: (a) => selected(a, 'q1-pick', sc.id) && idx >= 0,
});

// ---------------- Stage 2 dynamic options ----------------
const pickedThemes = (a: Answers): QOption[] => {
  const v = a['q2-pick']?.value;
  const ids = Array.isArray(v) ? v : [];
  return ids.map((id) => THEMES.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => !!t)
    .map((t) => opt(t.id, t.label, w({ [`t.${t.id}`]: 1 }), t.blurb));
};

const methodOptions = (prefix: 'mi' | 'mc' | 'mw'): QOption[] =>
  METHODS.map((m) => opt(m.id, m.label, w({ [`${prefix}.${m.id}`]: 1 })));

const ENV_TASKS: { env: string; text: string }[] = [
  { env: 'admin', text: 'Drafting a briefing for a deputy director of a regional department before a Monday meeting.' },
  { env: 'eu', text: 'Tracking a legislative file in Brussels and summarising amendments for colleagues.' },
  { env: 'io', text: 'Writing a section of a situation report for an international organisation’s country office.' },
  { env: 'thinktank', text: 'Researching a question for six weeks, then publishing an analysis and speaking at a panel.' },
  { env: 'ngo', text: 'Helping an NGO understand why people drop out of its integration programme, and what to change.' },
  { env: 'consultancy', text: 'Producing a benchmarking study for a public client under a tight deadline.' },
  { env: 'academia', text: 'Coding interviews and reading literature for a university research project.' },
  { env: 'coop', text: 'Coordinating partners on a cooperation project that links development and migration.' },
  { env: 'mel', text: 'Designing indicators and a data-collection plan to evaluate a funded programme.' },
  { env: 'advisory', text: 'Advising a senior official on options for a politically sensitive decision.' },
  { env: 'pm', text: 'Managing a programme’s timeline, budget, reporting and partners.' },
  { env: 'data', text: 'Cleaning administrative data and building a dashboard that planners will use.' },
  { env: 'advocacy', text: 'Turning research findings into a campaign brief and press material.' },
];

export const QUESTIONS: Question[] = [
  // ============ STAGE 1 ============
  {
    id: 'q1-pick', stage: 1, kind: 'multi', maxSelect: 3,
    prompt: 'Which of these situations would you most like to look into? Choose up to three.',
    help: 'Go with your gut. You can skip, or tick “not sure”.',
    options: SCENARIOS.map((s) => opt(s.id, s.text, s.w)),
  },
  ...SCENARIOS.map((s, i) => motiveQ(s, i)),
  {
    id: 'q1-answer', stage: 1, kind: 'single',
    prompt: 'Whatever you investigate, what kind of answer would you find most useful at the end?',
    options: [
      opt('ans-explain', 'A convincing explanation of why it happens', w({ 'a.explain': 1, 's.explanatory': 0.8, 'b.applied': -0.4 })),
      opt('ans-judge', 'A clear judgement on whether it works', w({ 'a.evaluate': 0.8, 's.evaluative': 0.8, 'b.applied': 0.3 })),
      opt('ans-map', 'A well-organised map of what is going on', w({ 's.exploratory': 0.8, 'a.compare': 0.3 })),
      opt('ans-rec', 'Concrete recommendations someone could act on', w({ 'a.recommend': 1, 'b.applied': 0.7, 'c.advisory': 0.3 })),
    ],
  },
  {
    id: 'q1-reflect', stage: 1, kind: 'text', optional: true, reflect: true,
    prompt: 'Optional reflection: describe something you have seen, read or experienced that made you think “someone should look into this”.',
    help: 'This is not scored. It is shown back to you in your profile as a prompt for supervisor conversations.',
  },

  // ============ STAGE 2 ============
  {
    id: 'q2-pick', stage: 2, kind: 'multi', maxSelect: 6,
    prompt: 'Which subjects could you imagine spending months on? Choose up to six.',
    options: THEMES.map((t) => opt(t.id, t.label, w({ [`t.${t.id}`]: 1 }), t.blurb)),
  },
  {
    id: 'q2-avoid', stage: 2, kind: 'multi', maxSelect: 4, negative: true, optional: true,
    prompt: 'Is there anything you would rather avoid? (Optional.)',
    help: 'Saying no is information too. It lowers matching topics but does not remove them.',
    options: THEMES.map((t) => opt(t.id, t.label, w({ [`t.${t.id}`]: 1 }))),
  },
  {
    id: 'q2-pair1', stage: 2, kind: 'pair',
    prompt: 'If you had to choose between these two, which pulls you more?',
    options: [
      opt('p1a', 'How a city organises integration services', w({ 't.local': 1, 't.integration': 0.6, 's.local': 0.6 })),
      opt('p1b', 'How the EU shares responsibility for asylum seekers', w({ 't.eu': 1, 't.asylum': 0.6, 's.eu': 0.6 })),
    ],
  },
  {
    id: 'q2-pair2', stage: 2, kind: 'pair',
    prompt: 'And between these?',
    options: [
      opt('p2a', 'Why politicians say what they say about migration', w({ 't.opinion': 1, 'a.decisions': 0.4 })),
      opt('p2b', 'Why administrations succeed or fail in delivering policy', w({ 't.capacity': 1, 't.implementation': 0.7, 'a.implgap': 0.4 })),
    ],
  },
  {
    id: 'q2-pair3', stage: 2, kind: 'pair',
    prompt: 'One more.',
    options: [
      opt('p3a', 'Who gets access to rights and services in practice', w({ 't.citizenship': 1, 't.inequality': 0.6, 't.discretion': 0.4 })),
      opt('p3b', 'How states cooperate (or conflict) across the Mediterranean', w({ 't.mediterranean': 1, 't.externalisation': 0.7, 't.eu': 0.3 })),
    ],
  },
  {
    id: 'q2-rank', stage: 2, kind: 'rank',
    prompt: 'Rank the subjects you chose, from the one you would most like to research.',
    help: 'Use the up and down buttons. This is built from your own picks.',
    optionsFrom: pickedThemes,
    showIf: (a) => Array.isArray(a['q2-pick']?.value) && (a['q2-pick']?.value as string[]).length >= 2,
  },

  // ============ STAGE 3 ============
  {
    id: 'q3-pick', stage: 3, kind: 'multi', maxSelect: 3,
    prompt: 'Which opening sentence of a thesis would you most enjoy writing? Choose up to three.',
    options: [
      opt('o-explain', '“This thesis explains why this policy problem persists…”', w({ 'a.explain': 1 })),
      opt('o-decide', '“This thesis shows how this decision was made, and by whom…”', w({ 'a.decisions': 1 })),
      opt('o-compare', '“This thesis compares how these places handle the same challenge…”', w({ 'a.compare': 1, 's.comparative': 0.5 })),
      opt('o-eval', '“This thesis assesses whether this programme achieved its aims…”', w({ 'a.evaluate': 1, 's.evaluative': 0.6 })),
      opt('o-gap', '“This thesis examines why implementation differs from design…”', w({ 'a.implgap': 1, 't.implementation': 0.4 })),
      opt('o-ineq', '“This thesis studies who loses out, and unintended consequences…”', w({ 'a.inequalities': 1, 't.inequality': 0.4 })),
      opt('o-conflict', '“This thesis analyses the conflict between institutions over…”', w({ 'a.conflict': 1, 't.governance': 0.3 })),
      opt('o-rec', '“This thesis proposes practical recommendations for…”', w({ 'a.recommend': 1, 'b.applied': 0.6 })),
      opt('o-tool', '“This thesis develops a tool to help officials decide…”', w({ 'a.tools': 1, 'mi.opendata': 0.3, 'b.applied': 0.5 })),
      opt('o-effects', '“This thesis investigates how the policy affects different groups…”', w({ 'a.effects': 1, 't.inequality': 0.3 })),
    ],
  },
  {
    id: 'q3-pair1', stage: 3, kind: 'pair',
    prompt: 'Which would you rather do?',
    options: [
      opt('t1a', 'Go deep on one case until you really understand it', w({ 's.single': 1, 'a.explain': 0.3 })),
      opt('t1b', 'Compare several cases to find the pattern', w({ 's.comparative': 1, 'a.compare': 0.5 })),
    ],
  },
  {
    id: 'q3-pair2', stage: 3, kind: 'pair',
    prompt: 'And this?',
    options: [
      opt('t2a', 'Understand how a decision was made', w({ 'a.decisions': 1, 's.exploratory': 0.3 })),
      opt('t2b', 'Judge whether the decision worked', w({ 'a.evaluate': 1, 's.evaluative': 0.5 })),
    ],
  },
  {
    id: 'q3-tools', stage: 3, kind: 'slider', followUpOf: 'q3-pick',
    prompt: 'You chose to build tools. How comfortable are you with the technical work that comes with that?',
    slider: { dim: 'b.technical', low: 'I would rather avoid it', high: 'I would enjoy it' },
    showIf: (a) => selected(a, 'q3-pick', 'o-tool'),
  },

  // ============ STAGE 4 ============
  {
    id: 'q4-cap', stage: 4, kind: 'multi',
    prompt: 'Which of these have you actually done before, in coursework or projects?',
    help: 'This is about existing capability, which is separate from what you enjoy. It is fine to tick none.',
    options: methodOptions('mc'),
  },
  {
    id: 'q4-int', stage: 4, kind: 'multi', maxSelect: 6,
    prompt: 'Which would you enjoy doing for months? Choose up to six.',
    options: methodOptions('mi'),
  },
  {
    id: 'q4-learn', stage: 4, kind: 'multi', maxSelect: 4,
    prompt: 'Which would you like to learn, even though it is hard? Choose up to four.',
    help: 'Wanting to learn something is a good reason to include it. We will show what it takes.',
    options: methodOptions('mw'),
  },
  {
    id: 'q4-tech', stage: 4, kind: 'slider',
    prompt: 'How many weeks would you invest in learning new technical skills before starting analysis?',
    slider: { dim: 'b.technical', low: 'None', high: 'Six weeks or more' },
  },
  {
    id: 'q4-field', stage: 4, kind: 'slider',
    prompt: 'How comfortable are you contacting officials and professionals for interviews?',
    slider: { dim: 'b.stakeholder', low: 'Prefer not to', high: 'Comfortable' },
  },

  // ============ STAGE 5 ============
  {
    id: 'q5-days', stage: 5, kind: 'multi', maxSelect: 5,
    prompt: 'Which of these working days sound good to you? Choose up to five.',
    help: 'These describe tasks, not employers.',
    options: ENV_TASKS.map((t) => opt(t.env, t.text, w({ [`c.${t.env}`]: 1 }))),
  },
  {
    id: 'q5-balance', stage: 5, kind: 'slider',
    prompt: 'Where do you want to sit between research and implementation?',
    slider: { dim: 'b.implement', low: 'Mostly research and analysis', high: 'Mostly delivering and managing' },
  },
  {
    id: 'q5-mobile', stage: 5, kind: 'slider',
    prompt: 'How mobile do you want to be for your first job?',
    slider: { dim: 'b.mobility', low: 'Stay in Catalonia', high: 'Anywhere in Europe or beyond' },
  },
  {
    id: 'q5-oposicion', stage: 5, kind: 'single', followUpOf: 'q5-days',
    prompt: 'Public-sector roles in Spain often start with a competitive exam (oposiciones) or a contracted technical post. How do you feel about that route?',
    options: [
      opt('op-yes', 'Willing to prepare for one', w({ 'c.admin': 0.8 })),
      opt('op-maybe', 'Open to contracted technical posts, not exams', w({ 'c.admin': 0.4 })),
      opt('op-no', 'Prefer other routes', w({ 'c.admin': -0.2, 'c.ngo': 0.3, 'c.consultancy': 0.3 })),
    ],
    showIf: (a) => selected(a, 'q5-days', 'admin') || selected(a, 'q5-days', 'advisory'),
  },
  {
    id: 'q5-env', stage: 5, kind: 'single',
    prompt: 'What kind of workplace suits you best?',
    options: [
      opt('env-big', 'A large institution with clear structure', w({ 'c.admin': 0.5, 'c.eu': 0.5, 'c.io': 0.4 })),
      opt('env-small', 'A small, fast team where I do many things', w({ 'c.thinktank': 0.5, 'c.ngo': 0.5, 'c.consultancy': 0.3 })),
      opt('env-intl', 'An international setting with travel', w({ 'c.io': 0.6, 'c.coop': 0.6, 'b.mobility': 0.5 })),
      opt('env-uni', 'A university or research centre', w({ 'c.academia': 0.8, 'c.data': 0.3 })),
    ],
  },

  // ============ STAGE 6 ============
  {
    id: 'q6-level', stage: 6, kind: 'multi', maxSelect: 2,
    prompt: 'At which level would you like to work? Choose up to two.',
    help: 'Local work gives access to concrete practice; EU and international work needs more legal background.',
    options: [
      opt('lv-local', 'Local (cities, towns)', w({ 's.local': 1 })),
      opt('lv-regional', 'Regional (Catalonia, autonomous communities)', w({ 's.regional': 1 })),
      opt('lv-national', 'National (Spain)', w({ 's.national': 1 })),
      opt('lv-eu', 'European', w({ 's.eu': 1 })),
      opt('lv-intl', 'International', w({ 's.intl': 1 })),
    ],
  },
  {
    id: 'q6-design', stage: 6, kind: 'single',
    prompt: 'A single case or a comparison?',
    help: 'One case: depth, less generalisable. Comparison: patterns, more work per case.',
    options: [
      opt('d-single', 'A single case studied in depth', w({ 's.single': 1 })),
      opt('d-two', 'Two or three cases compared', w({ 's.comparative': 1 })),
      opt('d-many', 'Many cases across a data set', w({ 's.comparative': 0.6, 'mi.quant': 0.5, 'b.technical': 0.3 })),
    ],
  },
  {
    id: 'q6-qtype', stage: 6, kind: 'multi', maxSelect: 2,
    prompt: 'What type of question suits you? Choose up to two.',
    options: [
      opt('qt-expl', 'Exploratory: what is going on?', w({ 's.exploratory': 1 })),
      opt('qt-xpl', 'Explanatory: why does it happen?', w({ 's.explanatory': 1 })),
      opt('qt-eval', 'Evaluative: does it work?', w({ 's.evaluative': 1 })),
    ],
  },
  {
    id: 'q6-theory', stage: 6, kind: 'slider',
    prompt: 'Theory or application?',
    slider: { dim: 'b.applied', low: 'Theoretically ambitious', high: 'Strongly applied' },
  },
  {
    id: 'q6-desk', stage: 6, kind: 'slider',
    prompt: 'Independent desk research or working with stakeholders?',
    slider: { dim: 'b.stakeholder', low: 'Independent desk research', high: 'Working with stakeholders' },
  },
  {
    id: 'q6-risk', stage: 6, kind: 'slider',
    prompt: 'A technically challenging project, or a lower-risk design?',
    help: 'A harder project can be impressive but may not finish. A safer one finishes but may be less distinctive.',
    slider: { dim: 'b.ambition', low: 'Lower risk', high: 'Technically challenging' },
  },
];

export const questionById = (id: string) => QUESTIONS.find((q) => q.id === id);

/** Questions visible given current answers (follow-ups appear when their trigger holds). */
export function visibleQuestions(a: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(a));
}

export function optionsFor(q: Question, a: Answers): QOption[] {
  return q.optionsFrom ? q.optionsFrom(a) : q.options ?? [];
}

export const UNIPOLAR_SLIDERS = new Set(['b.technical']);
export const DIM_LABELS: Record<string, string> = {
  ...Object.fromEntries(THEMES.map((t) => [`t.${t.id}`, t.label])),
  ...Object.fromEntries(APPROACHES.map((x) => [`a.${x.id}`, x.label])),
  ...Object.fromEntries(METHODS.flatMap((m) => [[`mi.${m.id}`, `${m.label} (interest)`], [`mc.${m.id}`, `${m.label} (existing skill)`], [`mw.${m.id}`, `${m.label} (want to learn)`]])),
  ...Object.fromEntries(ENVIRONMENTS.map((e) => [`c.${e.id}`, e.label])),
  's.local': 'Local scope', 's.regional': 'Regional scope', 's.national': 'National scope', 's.eu': 'European scope', 's.intl': 'International scope',
  's.single': 'Single-case design', 's.comparative': 'Comparative design',
  's.exploratory': 'Exploratory questions', 's.explanatory': 'Explanatory questions', 's.evaluative': 'Evaluative questions',
};
export const BIPOLAR_LABELS: Record<string, { low: string; high: string; name: string }> = {
  'b.applied': { name: 'Orientation', low: 'Theoretically ambitious', high: 'Strongly applied' },
  'b.stakeholder': { name: 'Working style', low: 'Independent desk research', high: 'Working with stakeholders' },
  'b.ambition': { name: 'Project risk', low: 'Lower risk', high: 'Technically challenging' },
  'b.technical': { name: 'Appetite for technical learning', low: 'None', high: 'Six weeks or more' },
  'b.implement': { name: 'Research vs implementation', low: 'Research and analysis', high: 'Delivering and managing' },
  'b.mobility': { name: 'Geographic mobility', low: 'Stay in Catalonia', high: 'Anywhere' },
};
