import type { CriterionId, DocLang, EvidenceStatus, Level, Region, Topic } from '@/types';
import { mk } from './topicDefaults';
import { THEMES, methodById } from './taxonomy';

/**
 * Compact authoring format for topics added after the first 16. It keeps the same rules as the long
 * format: everything here is a GENERATED HYPOTHESIS by the tool author, not an established gap.
 *
 * - Claims about law, policy or events go ONLY in `claims`, always `unverified`, each with a concrete check.
 * - Author scores (1 to 5) for academic, evidence, data and scope carry their own reason. The other
 *   criteria get reasons derived from the primary method, and say so.
 * - Technical level, fieldwork load and skills default from the primary method.
 */

const METHOD_DEFAULTS: Record<string, { technical: 1 | 2 | 3 | 4 | 5; fieldwork: 1 | 2 | 3 | 4 | 5; skills: string[]; ethics: number; interviews: number; ethicsWhy: string; interviewsWhy: string }> = {
  documents: { technical: 2, fieldwork: 1, skills: ['Document and legal analysis', 'Qualitative coding'], ethics: 5, interviews: 5, ethicsWhy: 'Public documents only; no participants.', interviewsWhy: 'Does not depend on interviews.' },
  comparative: { technical: 2, fieldwork: 1, skills: ['Comparative design', 'Case selection', 'Codebook development'], ethics: 5, interviews: 5, ethicsWhy: 'Built on public documents and data; no participants required.', interviewsWhy: 'Interviews are an optional extension, not a dependency.' },
  content: { technical: 2, fieldwork: 1, skills: ['Content analysis', 'Corpus building', 'Qualitative coding'], ethics: 5, interviews: 5, ethicsWhy: 'Public texts only; no participants.', interviewsWhy: 'Does not depend on interviews.' },
  tracing: { technical: 2, fieldwork: 1, skills: ['Process tracing', 'Chronology building'], ethics: 5, interviews: 4, ethicsWhy: 'Mostly public documents; any elite interviews would need consent.', interviewsWhy: 'Interviews help to check causal steps but documents carry the core.' },
  opendata: { technical: 3, fieldwork: 1, skills: ['Descriptive statistics', 'Data cleaning', 'Data visualisation'], ethics: 5, interviews: 5, ethicsWhy: 'Aggregate open data; no individuals identifiable.', interviewsWhy: 'Does not depend on interviews.' },
  quant: { technical: 4, fieldwork: 1, skills: ['Statistical analysis (R, Stata or Python)', 'Research design with observational data'], ethics: 5, interviews: 5, ethicsWhy: 'Aggregate or public data; confirm licence terms.', interviewsWhy: 'Does not depend on interviews.' },
  evaluation: { technical: 3, fieldwork: 1, skills: ['Theory of change', 'Evaluation design', 'Evidence synthesis'], ethics: 5, interviews: 4, ethicsWhy: 'Programme documents and published evaluations; low risk.', interviewsWhy: 'Practitioner interviews are helpful but not essential.' },
  interviews: { technical: 2, fieldwork: 4, skills: ['Interviewing', 'Thematic analysis', 'Research ethics and data protection'], ethics: 3, interviews: 2, ethicsWhy: 'Interviews with officials or professionals need consent and data protection.', interviewsWhy: 'Depends on securing enough interviews; fallback needed.' },
  mixed: { technical: 3, fieldwork: 2, skills: ['Mixed-methods design', 'Descriptive statistics', 'Qualitative coding'], ethics: 4, interviews: 4, ethicsWhy: 'Mostly public material; a small interview strand would need consent.', interviewsWhy: 'The interview strand is limited and optional.' },
  me: { technical: 3, fieldwork: 1, skills: ['Indicator design', 'Theory of change'], ethics: 5, interviews: 4, ethicsWhy: 'Framework built from public programme material.', interviewsWhy: 'Practitioner feedback would improve it but is not required.' },
  stakeholder: { technical: 2, fieldwork: 3, skills: ['Stakeholder analysis', 'Facilitation'], ethics: 3, interviews: 2, ethicsWhy: 'Works with practitioners; consent and confidentiality needed.', interviewsWhy: 'Depends on partner willingness.' },
  geospatial: { technical: 4, fieldwork: 1, skills: ['GIS (QGIS or R)', 'Spatial data handling'], ethics: 5, interviews: 5, ethicsWhy: 'Aggregate area data; no individuals.', interviewsWhy: 'Does not depend on interviews.' },
  admin: { technical: 4, fieldwork: 2, skills: ['Administrative data handling', 'Data requests'], ethics: 3, interviews: 4, ethicsWhy: 'Administrative microdata require formal access and data protection.', interviewsWhy: 'Access, not interviews, is the main risk.' },
  fieldwork: { technical: 2, fieldwork: 5, skills: ['Fieldwork', 'Research ethics'], ethics: 2, interviews: 2, ethicsWhy: 'First-hand access to participants raises ethical complexity.', interviewsWhy: 'Depends on site access.' },
};

type N5 = 1 | 2 | 3 | 4 | 5;

export interface Lite {
  id: string;
  title: string;
  tagline: string;
  problem: string;
  rq: string;
  subs: string[];
  hypotheses: string[]; // each must contain "provisional"
  theories: string[]; // theory ids; the first three are used as lenses and as foundational frameworks
  geography: string;
  levels: Level[];
  regions: Region[];
  docLangs?: DocLang[];
  institutions: string[];
  comparative: boolean;
  timePeriod: string;
  dimensions: string[];
  factors: string[];
  primaryMethod: string;
  secondaryMethods: string[];
  methodNote: string;
  evidenceNeeded: string[];
  sourceIds: string[];
  contribution: string;
  publicValue: string;
  limitations: string[];
  ethics?: string[]; // extra ethics notes beyond the method default
  /** raises ethical sensitivity above the method default (for example topics on deaths or detention) */
  sensitive?: boolean;
  workloadWeeks: number;
  skills?: string[];
  alternatives: string[];
  themes: Record<string, number>;
  approaches: Record<string, number>;
  /** author scores 1 to 5: track, clarity, academic, policy, evidence, data, methodFit, scope, portfolio */
  scores: [N5, N5, N5, N5, N5, N5, N5, N5, N5];
  why: { academic: string; evidence: string; data: string; scope: string; policy?: string; clarity?: string };
  careers: [string, 1 | 2 | 3, string][];
  outputs: [string, 1 | 2 | 3, string][];
  placeIds: string[];
  /** statements about law, policy or events: always stored as unverified with a check */
  claims: [string, string][];
  phrases: Topic['phrases'];
  technical?: N5;
  fieldwork?: N5;
}

/** Author reasons are judgments, never measurements: label them, and say what has not been checked. */
const judged = (text: string, tail: string) => (text.startsWith('Judgment:') ? text : `Judgment: ${text.replace(/\.$/, '')}. ${tail}`);

const SCORE_KEYS: CriterionId[] = ['track', 'clarity', 'academic', 'policy', 'evidence', 'data', 'methodFit', 'scope', 'portfolio'];

export function lite(t: Lite): Topic {
  const md = METHOD_DEFAULTS[t.primaryMethod] ?? METHOD_DEFAULTS.documents;
  const method = methodById(t.primaryMethod);
  const topTheme = Object.entries(t.themes).sort((a, b) => b[1] - a[1])[0]?.[0];
  const themeLabel = THEMES.find((x) => x.id === topTheme)?.label.toLowerCase() ?? 'migration governance';
  const sc = Object.fromEntries(SCORE_KEYS.map((k, i) => [k, t.scores[i]])) as Record<string, N5>;
  const sens = t.sensitive ? 1 : 0;
  const ethicsScore = Math.max(1, md.ethics - sens);
  const status: EvidenceStatus = 'unverified';
  const label = method?.label.toLowerCase() ?? t.primaryMethod;
  return mk({
    id: t.id, title: t.title, tagline: t.tagline, problem: t.problem, rq: t.rq, subs: t.subs, hypotheses: t.hypotheses,
    theories: t.theories.slice(0, 3), foundationalFrameworks: t.theories.slice(0, 3),
    geography: t.geography, levels: t.levels, regions: t.regions, docLangs: t.docLangs ?? [],
    institutions: t.institutions, comparative: t.comparative, timePeriod: t.timePeriod, dimensions: t.dimensions, factors: t.factors,
    primaryMethod: t.primaryMethod, secondaryMethods: t.secondaryMethods, methodNote: t.methodNote,
    evidenceNeeded: t.evidenceNeeded, sourceIds: t.sourceIds, contribution: t.contribution, publicValue: t.publicValue,
    limitations: t.limitations,
    ethics: [md.ethicsWhy, ...(t.ethics ?? []), ...(t.sensitive ? ['The subject is sensitive: describe events and people accurately, avoid sensational framing and do not identify individuals.'] : [])],
    workloadWeeks: t.workloadWeeks, skills: [...(t.skills ?? []), ...md.skills].slice(0, 5),
    alternatives: t.alternatives, themes: t.themes, approaches: t.approaches,
    technical: t.technical ?? md.technical, fieldwork: t.fieldwork ?? md.fieldwork,
    lang: t.docLangs?.some((l) => l === 'es' || l === 'ca') ? 'Catalan/Spanish sources useful' : 'English sources sufficient',
    careers: t.careers.map(([roleId, strength, note]) => ({ roleId, strength, note })),
    outputs: t.outputs.map(([outputId, realism, note]) => ({ outputId, realism, note })),
    placeIds: t.placeIds,
    claims: t.claims.map(([text, check]) => ({ text, status, check })),
    phrases: t.phrases,
    criteria: {
      track: { score: sc.track, why: `Judgment: connects to the Migration track through ${themeLabel}.` },
      clarity: { score: sc.clarity, why: t.why.clarity ?? 'Judgment: the question names its object, cases and period, so it can be bounded; check the boundaries in the lab.' },
      academic: { score: sc.academic, why: judged(t.why.academic, 'Check the literature before claiming novelty.') },
      policy: { score: sc.policy, why: t.why.policy ?? 'Judgment: usable by administrations or organisations that negotiate or implement these arrangements.' },
      evidence: { score: sc.evidence, why: judged(t.why.evidence, 'This app has not verified that the material is available.') },
      data: { score: sc.data, why: judged(t.why.data, 'Open the actual files and tables before committing.') },
      methodFit: { score: sc.methodFit, why: `Judgment: ${label} is a reasonable match to this question; see the Methods tab for what it cannot support.` },
      scope: { score: sc.scope, why: judged(t.why.scope, 'Narrow further if the first reading takes longer than planned.') },
      ethics: { score: ethicsScore, why: md.ethicsWhy + (t.sensitive ? ' Sensitive subject matter lowers the score by one.' : '') },
      interviews: { score: md.interviews, why: md.interviewsWhy },
      portfolio: { score: sc.portfolio, why: 'Judgment: the natural by-products (see Outputs) are showable to employers alongside the thesis.' },
    },
  });
}
