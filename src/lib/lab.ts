import type { Ambition, CriterionId, LabParams, Level, Profile, ScopeId, Topic } from '@/types';
import { METHODS, methodById } from '@/data/taxonomy';
import { roleById } from '@/data/careers';
import { dimScore } from './profile';

export const SCOPE_LABEL: Record<ScopeId, string> = {
  catalonia: 'Catalonia',
  spain: 'Spain',
  'spain-eu': 'Spain and other EU member states',
  eu: 'the EU as a governance system',
  'local-cases': 'a small set of municipalities',
};
const SCOPE_RANK: Record<ScopeId, number> = { 'local-cases': 0, catalonia: 1, spain: 2, 'spain-eu': 3, eu: 4 };

export const POP_LABEL: Record<LabParams['population'], string> = {
  all: '', asylum: 'asylum seekers and refugees', irregular: 'people in irregular situations', workers: 'migrant workers', women: 'migrant women', minors: 'unaccompanied minors',
};

export function defaultScope(topic: Topic): ScopeId {
  const g = topic.geography.toLowerCase();
  if (g.startsWith('catalonia')) return topic.comparative && /municipal/.test(g) ? 'local-cases' : 'catalonia';
  if (/eu\b/.test(g) && !/spain/.test(g)) return 'eu';
  if (/plus|comparison|eu member/.test(g)) return 'spain-eu';
  if (/barcelona/.test(g)) return 'local-cases';
  return 'spain';
}

export function defaultLab(topic: Topic): LabParams {
  const focus = topic.primaryMethod === 'evaluation' ? 'evaluation' : topic.primaryMethod === 'tracing' ? 'design' : 'implementation';
  return {
    scope: defaultScope(topic), cases: topic.comparative ? 3 : 1, breadth: 'medium', focus, method: 'auto',
    orientation: 50, careerRole: 'none', dataLoad: 'medium', population: 'all', level: topic.levels[0] ?? 'national', technical: topic.technical,
  };
}

export function presetFor(topic: Topic, ambition: Ambition): LabParams {
  const base = defaultLab(topic);
  if (ambition === 'balanced') return base;
  if (ambition === 'ambitious') {
    const wider: ScopeId = base.scope === 'local-cases' ? 'catalonia' : base.scope === 'catalonia' ? 'spain' : base.scope === 'spain' ? 'spain-eu' : base.scope;
    return { ...base, scope: wider, cases: Math.min(5, Math.max(base.cases + 1, 3)), breadth: 'broad', method: 'mixed', dataLoad: 'high', orientation: 30, technical: Math.min(5, Math.max(base.technical, 4)) as LabParams['technical'] };
  }
  const narrower: ScopeId = base.scope === 'eu' ? 'spain-eu' : base.scope === 'spain-eu' ? 'spain' : base.scope === 'spain' ? 'catalonia' : base.scope;
  return { ...base, scope: narrower, cases: Math.min(base.cases, 2), breadth: 'narrow', method: 'documents', dataLoad: 'low', technical: Math.min(base.technical, 2) as LabParams['technical'] };
}

export function chooseMethod(topic: Topic, lab: LabParams): string {
  if (lab.method !== 'auto') return lab.method;
  if (lab.dataLoad === 'low') return 'documents';
  if (lab.focus === 'evaluation') return lab.technical >= 4 && lab.dataLoad === 'high' ? 'mixed' : 'evaluation';
  if (lab.focus === 'design') return lab.cases > 1 ? 'comparative' : 'tracing';
  if (lab.cases > 1) return 'comparative';
  if (lab.technical >= 4 && lab.dataLoad === 'high') return 'mixed';
  return topic.primaryMethod;
}

export type Deltas = Partial<Record<CriterionId, number>>;
export interface DeltaReason { criterion: CriterionId; delta: number; reason: string }

export interface LabResult {
  rq: string;
  subs: string[];
  methodId: string;
  methodWhy: string;
  evidence: string[];
  deltas: Deltas;
  reasons: DeltaReason[];
  workloadWeeks: number;
  workloadNotes: string[];
  careerNotes: { roleId: string; label: string; note: string }[];
  warnings: string[];
}

export function applyLab(topic: Topic, lab: LabParams, profile?: Profile): LabResult {
  const reasons: DeltaReason[] = [];
  const add = (criterion: CriterionId, delta: number, reason: string) => { if (delta !== 0) reasons.push({ criterion, delta, reason }); };
  const warnings: string[] = [];
  const def = defaultLab(topic);
  const methodId = chooseMethod(topic, lab);
  const method = methodById(methodId) ?? METHODS[0];

  // --- research question text ---
  const { policy, outcome, factor, unit } = topic.phrases;
  const levelNote = lab.level !== (topic.levels[0] ?? lab.level) ? ` at the ${lab.level} level` : '';
  // 'local-cases' is a way of choosing cases, so name the region instead of repeating "municipalities".
  const regionName = /^catalonia/i.test(topic.geography) ? 'Catalonia' : /barcelona/i.test(topic.geography) ? 'Barcelona' : 'Spain';
  const scopeName = lab.scope === 'local-cases' ? regionName : SCOPE_LABEL[lab.scope];
  const scopeText = `${scopeName}${levelNote}`;
  const pop = POP_LABEL[lab.population] ? `, focusing on ${POP_LABEL[lab.population]}` : '';
  const caseText = lab.cases > 1 ? `${lab.cases} ${unit}` : `a single case among the ${unit}`;
  let rq: string;
  if (lab.focus === 'design') rq = `How and why was ${policy} designed as it is in ${scopeText}${pop}, and which actors and ideas shaped it?`;
  else if (lab.focus === 'evaluation') rq = `What evidence is there on whether ${policy} achieves its intended outcomes (${outcome}) in ${scopeText}${pop}, and what can credibly be concluded?`;
  else rq = lab.cases > 1
    ? `To what extent and why does the implementation of ${policy} differ across ${caseText} in ${scopeText}${pop}?`
    : `How is ${policy} implemented in ${caseText} in ${scopeText}${pop}, and which factors, such as ${factor}, shape it?`;
  if (lab.breadth === 'narrow') rq = rq.replace(/\?$/, `, looking at one dimension: ${topic.dimensions[0].toLowerCase()}?`);
  if (lab.breadth === 'broad') rq = rq.replace(/\?$/, `, across ${topic.dimensions.slice(0, 3).map((d) => d.toLowerCase()).join(', ')}?`);
  if (lab.orientation >= 70) rq = rq.replace(/\?$/, ', and what practical changes follow for public administrations?');
  else if (lab.orientation <= 30) rq = rq.replace(/\?$/, ', and what does this imply for theories of policy implementation and governance?');

  const subs = [
    `What does ${policy} require, allow and leave open to discretion in ${scopeName}?`,
    lab.focus === 'evaluation' ? `What evidence exists on ${outcome}, and how strong is it?` : lab.focus === 'design' ? `Which actors, ideas and constraints shaped the content of ${policy}?` : `How do ${outcome} vary across ${caseText}?`,
    lab.focus === 'design' ? `How have the provisions changed over time, and why?` : `Which factors (${factor}) are associated with the differences or outcomes observed?`,
  ];
  if (lab.orientation >= 70) subs.push('Which practical recommendations follow, and how feasible are they for the actors concerned?');

  // --- evidence requirements by data load ---
  const evidence = [...method.evidence.split('; ').slice(0, 1), ...topic.evidenceNeeded];
  const evidenceCut = lab.dataLoad === 'low' ? 3 : lab.dataLoad === 'medium' ? 5 : evidence.length;
  const evidenceOut = evidence.slice(0, Math.max(evidenceCut, 2));
  if (lab.dataLoad === 'high') evidenceOut.push('Requests for non-public data or interviews with officials (plan for delays)');
  if (method.id === 'interviews' || lab.dataLoad === 'high') evidenceOut.push('Ethics and consent procedure; interview guide and sampling plan');

  // --- feasibility deltas ---
  if (lab.cases === 1 && topic.comparative) { add('scope', 0.6, 'A single case is quicker to cover.'); add('academic', -0.4, 'One case limits generalisation.'); }
  if (lab.cases > 2) { add('scope', -0.4 * (lab.cases - 2), `${lab.cases} cases multiply reading and coding.`); add('data', -0.2 * (lab.cases - 2), 'More cases mean uneven data availability.'); add('academic', 0.2 * (lab.cases - 2), 'A broader comparison supports stronger comparative claims.'); }
  if (lab.breadth === 'narrow') { add('scope', 0.8, 'Narrow questions are easier to finish.'); add('clarity', 0.5, 'A narrow question is easier to answer.'); add('academic', -0.3, 'Narrower contribution.'); }
  if (lab.breadth === 'broad') { add('scope', -1, 'Broad questions risk sprawling.'); add('clarity', -0.6, 'Broad questions are harder to bound.'); add('academic', 0.3, 'Broader contribution if achieved.'); }
  if (lab.focus === 'evaluation' && topic.primaryMethod !== 'evaluation') { add('data', -0.4, 'Evaluating outcomes needs outcome data.'); add('methodFit', -0.3, 'Evaluation design requires an evidence base on outcomes.'); add('policy', 0.3, 'Evaluation is directly useful to funders.'); }
  if (lab.focus === 'design') { add('evidence', 0.3, 'Design questions are answerable with public documents.'); add('policy', -0.2, 'Design history matters less for current decisions.'); }
  if (lab.focus === 'implementation') add('policy', 0.2, 'Implementation insight is practically useful.');
  if (method.technical >= 4) {
    const cap = profile ? dimScore(profile, `mc.${method.id}`) + dimScore(profile, 'mc.quant') * 0.5 : 0;
    add('methodFit', cap > 0.5 ? 0 : -1, cap > 0.5 ? '' : `${method.label} needs skills you have not yet reported. Plan learning time.`);
    add('portfolio', 0.4, 'Technical outputs strengthen a data portfolio.');
    if (cap <= 0.5) warnings.push(`${method.label}: ${method.learning}`);
  }
  if (method.fieldwork >= 4) { add('interviews', -1.5, 'Relies on access to interviewees or sites.'); add('ethics', -1, 'Fieldwork brings ethical review and consent.'); add('data', -0.5, 'Primary data collection takes time.'); warnings.push('Interview or fieldwork access is a common cause of delay: line up access in the first weeks, and keep a document-only fallback.'); }
  if (method.id === 'documents' || method.id === 'content') { add('interviews', 0.5, 'Document-based designs do not depend on access.'); add('ethics', 0.3, 'Public documents carry low ethical complexity.'); }
  if (method.id === 'admin') { add('data', -1.5, 'Administrative microdata usually require formal requests and may be refused.'); warnings.push('Administrative data: prepare a fallback design using public aggregate statistics.'); }
  if (lab.orientation <= 30) { add('academic', 0.4, 'Theory-oriented framing strengthens contribution.'); add('policy', -0.3, 'Less direct policy usefulness.'); }
  if (lab.orientation >= 70) { add('policy', 0.4, 'Practical focus raises policy relevance.'); add('portfolio', 0.3, 'Applied outputs are portfolio-ready.'); add('academic', -0.3, 'Less theoretical contribution.'); }
  if (lab.dataLoad === 'low') { add('data', 0.6, 'Lower data requirements.'); add('evidence', -0.3, 'Thinner evidence base.'); add('academic', -0.2, 'Less original evidence.'); }
  if (lab.dataLoad === 'high') { add('data', -0.8, 'Heavier data collection.'); add('scope', -0.5, 'More fieldwork or data work.'); add('academic', 0.3, 'Original evidence adds contribution.'); }
  if (lab.population === 'minors') { add('ethics', -1.5, 'Research involving minors requires heightened protection.'); add('interviews', -0.5, 'Access to minors is restricted.'); warnings.push('Do not recruit minors as participants; use public documents and professionals’ accounts.'); }
  else if (lab.population === 'irregular' || lab.population === 'asylum') { add('ethics', -0.8, 'Vulnerable populations raise consent and safety issues.'); add('interviews', -0.5, 'Trust and access are difficult.'); warnings.push('Prefer professionals and public documents over direct interviews with vulnerable populations.'); }
  else if (lab.population === 'women' || lab.population === 'workers') { add('ethics', -0.3, 'Some risk of identifying participants.'); }
  const dT = lab.technical - topic.technical;
  if (dT > 0) { add('scope', -0.2 * dT, 'Greater technical ambition takes more time.'); add('portfolio', 0.2 * dT, 'Technical depth is visible to employers.'); add('academic', 0.1 * dT, 'Technical rigour adds credibility.'); }
  if (dT < 0) add('data', 0.1 * -dT, 'Simpler techniques rely on simpler data.');
  const dScope = SCOPE_RANK[lab.scope] - SCOPE_RANK[def.scope];
  if (dScope > 0) { add('scope', -0.6 * dScope, 'A wider geographic scope increases the material to cover.'); add('data', -0.3 * dScope, 'Wider scope means more heterogeneous data.'); add('academic', 0.2 * dScope, 'Wider scope strengthens the case for contribution.'); }
  if (dScope < 0) { add('scope', 0.5 * -dScope, 'Narrower scope reduces the material.'); add('policy', -0.15 * -dScope, 'Narrower findings apply to fewer settings.'); }
  if (lab.careerRole !== 'none') {
    const role = roleById(lab.careerRole);
    if (role?.methods.includes(method.id)) add('portfolio', 0.4, `${role.label} roles use ${method.label.toLowerCase()}.`);
    else if (role) add('portfolio', -0.2, `Method choice is less typical for ${role.label} roles.`);
  }

  const deltas: Deltas = {};
  for (const r of reasons) deltas[r.criterion] = (deltas[r.criterion] ?? 0) + r.delta;

  // --- workload ---
  const notes: string[] = [];
  let weeks = topic.workloadWeeks;
  if (topic.comparative && lab.cases !== (def.cases)) { weeks *= 1 + 0.2 * (lab.cases - def.cases); notes.push(`${lab.cases} cases vs ${def.cases} default`); }
  weeks *= lab.breadth === 'narrow' ? 0.8 : lab.breadth === 'broad' ? 1.25 : 1;
  if (lab.breadth !== 'medium') notes.push(`${lab.breadth} breadth`);
  weeks *= lab.dataLoad === 'low' ? 0.85 : lab.dataLoad === 'high' ? 1.25 : 1;
  if (method.fieldwork >= 4) { weeks += 3; notes.push('+3 weeks for interviews or fieldwork'); }
  if (method.technical >= 4) { weeks += 3; notes.push('+3 weeks to learn or apply technical methods'); }
  weeks *= 1 + 0.05 * dScope;

  // --- career implications ---
  const careerNotes = topic.careers.map((c) => {
    const role = roleById(c.roleId);
    if (!role) return null;
    const methodFits = role.methods.includes(method.id);
    return { roleId: c.roleId, label: role.label, note: `${c.note} ${methodFits ? `Your chosen method (${method.label.toLowerCase()}) is typical for this role.` : `Method (${method.label.toLowerCase()}) is less typical here; pair with another output.`}` };
  }).filter((x): x is NonNullable<typeof x> => !!x);

  return {
    rq, subs, methodId: method.id,
    methodWhy: `${method.label}: ${method.fit} It can support: ${method.supports.toLowerCase()} It cannot support: ${method.cannotSupport.toLowerCase()}`,
    evidence: evidenceOut, deltas, reasons, workloadWeeks: Math.round(weeks), workloadNotes: notes, careerNotes, warnings,
  };
}

export function ambitionTradeoffs(topic: Topic, profile?: Profile) {
  const out = (['ambitious', 'balanced', 'lower-risk'] as Ambition[]).map((a) => {
    const lab = presetFor(topic, a);
    const res = applyLab(topic, lab, profile);
    return { ambition: a, lab, res };
  });
  return out;
}

export const LEVEL_OPTIONS: Level[] = ['local', 'regional', 'national', 'eu', 'international'];
