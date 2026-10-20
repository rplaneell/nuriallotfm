// Shared domain model. Keep UI-free: everything here is plain data shapes.

export type EvidenceStatus =
  | 'verified-metadata' // bibliographic record retrieved from an open index (OpenAlex/repository)
  | 'link-checked' // URL answered when checked by scripts/check-links.mjs
  | 'source-backed' // statement tied to an identified official source (still needs reading)
  | 'interpretation' // reasoned judgment by the tool author
  | 'hypothesis' // generated, provisional
  | 'unverified'; // stated from background knowledge; verify before relying on it

export type Level = 'local' | 'regional' | 'national' | 'eu' | 'international';
export type Region = 'europe' | 'mena' | 'ssa' | 'latam' | 'northam' | 'asia' | 'oceania' | 'global';
export type DocLang = 'es' | 'ca' | 'fr' | 'ar' | 'pt';
export type FocusStage = 'design' | 'implementation' | 'evaluation';

export interface Theme { id: string; label: string; blurb: string }
export interface Approach { id: string; label: string; blurb: string }

export type CausalStrength = 'descriptive' | 'comparative' | 'credible-causal' | 'interpretive';

export interface Method {
  id: string;
  label: string;
  fit: string; // when it fits
  evidence: string; // what evidence it requires
  analysis: string; // how analysis proceeds
  supports: string; // what conclusions it can support
  cannotSupport: string; // what it cannot support
  causal: CausalStrength;
  technical: 1 | 2 | 3 | 4 | 5;
  fieldwork: 1 | 2 | 3 | 4 | 5;
  learning: string; // feasible way to acquire the skills
  skills: string[];
}

export interface Theory { id: string; label: string; idea: string; origin: string; searchQuery: string }

export type SourceKind =
  | 'official-statistics' | 'legislation' | 'agency' | 'open-data' | 'academic-index'
  | 'repository' | 'think-tank' | 'ngo' | 'survey' | 'ombuds';

export interface Source {
  id: string;
  name: string;
  publisher: string;
  url: string;
  kind: SourceKind;
  access: 'open' | 'api' | 'registration' | 'on-request';
  notes: string;
  geo: string;
}

export interface CareerLink { label: string; url: string }

export interface Role {
  id: string;
  label: string;
  summary: string;
  responsibilities: string[];
  employers: string[];
  thesisDemonstrates: string[];
  methods: string[];
  irLink: string;
  extraQualifications: string[];
  needsSeparateExperience: string[];
  keywords: string[];
  links: CareerLink[];
  environments: string[]; // career-environment dimension ids
}

export interface Output {
  id: string;
  label: string;
  what: string;
  bestFor: string[]; // role ids
  effort: 1 | 2 | 3 | 4 | 5;
  skills: string[];
}

export type CriterionId =
  | 'interest' | 'career' | 'track' | 'clarity' | 'academic' | 'policy' | 'evidence'
  | 'data' | 'methodFit' | 'scope' | 'ethics' | 'interviews' | 'portfolio';

export interface Criterion {
  id: CriterionId;
  label: string;
  description: string;
  kind: 'personal' | 'intrinsic'; // personal = computed from profile
  higherIsBetter: true;
}

export interface CriterionScore { score: number; why: string }

export interface TopicClaim { text: string; status: EvidenceStatus; check?: string }

export interface TopicCareer { roleId: string; strength: 1 | 2 | 3; note: string }
export interface TopicOutput { outputId: string; realism: 1 | 2 | 3; note: string }

export interface LabPhrases {
  policy: string; // noun phrase: the policy object studied
  outcome: string; // what varies / is assessed
  factor: string; // explanatory factor phrase
  unit: string; // unit of analysis (plural)
  actors: string;
}

export interface Topic {
  id: string;
  title: string;
  tagline: string;
  problem: string;
  rq: string;
  subs: string[];
  hypotheses: string[]; // always provisional
  theories: string[];
  geography: string;
  levels: Level[];
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
  foundationalFrameworks: string[]; // theory ids (named from background knowledge, unverified)
  contribution: string;
  publicValue: string;
  limitations: string[];
  ethics: string[];
  workloadWeeks: number;
  skills: string[];
  alternatives: string[];
  themes: Record<string, number>;
  approaches: Record<string, number>;
  technical: 1 | 2 | 3 | 4 | 5;
  fieldwork: 1 | 2 | 3 | 4 | 5;
  criteria: Partial<Record<CriterionId, CriterionScore>>;
  careers: TopicCareer[];
  outputs: TopicOutput[];
  placeIds: string[];
  claims: TopicClaim[];
  phrases: LabPhrases;
  lang: 'Catalan/Spanish sources useful' | 'English sources sufficient';
  /** world regions the topic touches; 'global' marks multilateral or worldwide scope */
  regions: Region[];
  /** languages (besides English) in which key primary documents are mainly published; empty = English suffices */
  docLangs: DocLang[];
}

// ---------- Orientation test ----------
export type Weights = Record<string, number>;

export interface QOption { id: string; label: string; detail?: string; w: Weights }

export type QKind = 'single' | 'multi' | 'rank' | 'slider' | 'pair' | 'text';

export interface Question {
  id: string;
  stage: number;
  kind: QKind;
  prompt: string;
  scenario?: string;
  help?: string;
  options?: QOption[];
  /** options computed from earlier answers (adaptive ranking/selection) */
  optionsFrom?: (a: Answers) => QOption[];
  maxSelect?: number;
  /** negative evidence: selected options subtract from the weights they carry */
  negative?: boolean;
  /** slider: dimension (0-100 bipolar or unipolar) and labels */
  slider?: { dim: string; low: string; high: string; unipolar?: boolean; weight?: number };
  /** follow-ups appear only after this returns true */
  showIf?: (a: Answers) => boolean;
  followUpOf?: string;
  optional?: boolean;
  reflect?: boolean;
}

export interface Answer {
  value?: string | string[] | number; // option id(s), rank order, slider value, or text
  skipped?: boolean;
  unsure?: boolean;
  at: number;
}
export type Answers = Record<string, Answer>;

export type SignalStrength = 'strong' | 'moderate' | 'tentative' | 'none';

export interface DimensionResult {
  id: string;
  score: number; // 0..1
  evidence: number; // number of answers touching it
  strength: SignalStrength;
  overridden: boolean;
  contributions: { qid: string; prompt: string; label: string; weight: number }[];
}

export interface Profile {
  dims: Record<string, DimensionResult>;
  bipolar: Record<string, { value: number; evidence: number; overridden: boolean }>; // 0..100
  answered: number;
  skipped: number;
  unsure: number;
  openText: { qid: string; prompt: string; text: string }[];
}

// ---------- Interface personalisation ----------
export type ExploreMode = 'guided' | 'research' | 'visual' | 'career' | 'policy' | 'method' | 'hybrid';
export interface UiPrefs {
  modes: ExploreMode[];
  detail: 'brief' | 'standard' | 'deep';
  breadth: 'broad' | 'focused';
  format: 'visual' | 'written' | 'balanced';
  fullOverview: boolean;
  completed: boolean;
}

// ---------- Feedback ----------
export type FeedbackTag =
  | 'very' | 'maybe' | 'notForMe' | 'tooBroad' | 'tooTechnical' | 'notPractical'
  | 'hardToResearch' | 'careerRelevant' | 'otherDirection';

export interface FeedbackEvent { topicId: string; tag: FeedbackTag; at: number; action: 'add' | 'remove' }

// ---------- Lab ----------
export type ScopeId = 'catalonia' | 'spain' | 'spain-eu' | 'eu' | 'local-cases';
export type Ambition = 'ambitious' | 'balanced' | 'lower-risk';

export interface LabParams {
  scope: ScopeId;
  cases: number; // number of comparative cases/units, 1..6
  breadth: 'narrow' | 'medium' | 'broad';
  focus: FocusStage;
  method: string; // method id or 'auto'
  orientation: number; // 0 academic .. 100 practical
  careerRole: string; // role id or 'none'
  dataLoad: 'low' | 'medium' | 'high';
  population: 'all' | 'asylum' | 'irregular' | 'workers' | 'women' | 'minors';
  level: Level;
  technical: 1 | 2 | 3 | 4 | 5;
}

export interface DecisionWeights {
  interest: number; feasibility: number; career: number; academic: number; policy: number;
}

export interface TimelineSettings {
  startDate: string; // ISO date the user starts
  deadline: string; // ISO date; user-confirmed. Empty until confirmed.
  confirmedFromOfficial: boolean;
}
