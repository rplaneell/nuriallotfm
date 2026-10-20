import type { Profile } from '@/types';
import { topicById } from '@/data/topics';
import { roleById, outputById } from '@/data/careers';
import { sourceById } from '@/data/sources';
import { CRITERIA, THEMES, theoryById } from '@/data/taxonomy';
import { DECISION_GROUPS, rankDecision, sensitivity } from './decision';
import { literatureFor, literatureMeta, precedentsFor, precedentMeta } from './evidence';
import { topDims } from './profile';
import { viewTopic, type TopicView } from './view';
import { DIM_LABELS } from '@/data/questions';
import { STORE_VERSION, initialState, type PersistedState } from '@/store/useApp';
import { buildTimeline } from './timeline';

// ---------------- helpers ----------------
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const csvCell = (v: unknown) => {
  let s = String(v ?? '');
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export interface ExportInput { state: PersistedState; profile: Profile; today?: string }

function views(inp: ExportInput): TopicView[] {
  return inp.state.saved.map((id) => viewTopic(id, inp.state, inp.profile)).filter((v): v is TopicView => !!v);
}

// ---------------- CSV ----------------
export function buildCsv(inp: ExportInput): string {
  const vs = views(inp);
  const ranked = rankDecision(vs.map((v) => ({ topicId: v.topic.id, criteria: v.criteria })), inp.state.weights);
  const head = ['Rank', 'Topic', 'Research question', 'Method', 'Workload (weeks)', 'Overall score (1-5)', 'Low', 'High', ...DECISION_GROUPS.map((g) => `${g.label} (1-5)`), ...CRITERIA.map((c) => c.label), 'Note'];
  const rows = ranked.map((r) => {
    const v = vs.find((x) => x.topic.id === r.topicId)!;
    return [r.rank, v.title, v.rq, v.result.methodId, v.result.workloadWeeks, v.overall.score.toFixed(2), v.overall.low.toFixed(2), v.overall.high.toFixed(2),
      ...DECISION_GROUPS.map((g) => r.groups[g.id].toFixed(2)), ...CRITERIA.map((c) => v.criteria.find((x) => x.id === c.id)!.score.toFixed(2)), (inp.state.notes[v.topic.id] ?? '').replace(/\s+/g, ' ')];
  });
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

// ---------------- Markdown ----------------
export function buildMarkdown(inp: ExportInput): string {
  const { state, profile } = inp;
  const today = inp.today ?? new Date().toISOString().slice(0, 10);
  const vs = views(inp);
  const ranked = rankDecision(vs.map((v) => ({ topicId: v.topic.id, criteria: v.criteria })), state.weights);
  const sens = sensitivity(vs.map((v) => ({ topicId: v.topic.id, criteria: v.criteria })), state.weights);
  const L: string[] = [];
  L.push('# TFM shortlist: Migration Policy TFM Explorer', '', `Prepared ${today}. Master in Governance, UPF (Migration track).`, '',
    '> This document mixes **verified source metadata**, **author judgments** and **generated hypotheses**. Each is labelled. Scores are transparent judgments, not measurements.', '');
  L.push('## Your profile', '');
  const themes = topDims(profile, 't.', 5, 0.15);
  L.push(themes.length ? themes.map((d) => `- ${DIM_LABELS[d.id]} (${d.strength})`).join('\n') : '_Orientation test not yet completed._', '');
  L.push('## Comparison', '');
  L.push('| Rank | Topic | Overall | ' + DECISION_GROUPS.map((g) => g.label).join(' | ') + ' |', '|---|---|---|' + DECISION_GROUPS.map(() => '---').join('|') + '|');
  for (const r of ranked) { const v = vs.find((x) => x.topic.id === r.topicId)!; L.push(`| ${r.rank} | ${v.title.replace(/\|/g, '/')} | ${r.total.toFixed(0)}/100 | ${DECISION_GROUPS.map((g) => r.groups[g.id].toFixed(1)).join(' | ')} |`); }
  L.push('', `Weights used: ${DECISION_GROUPS.map((g) => `${g.label} ${state.weights[g.id]}`).join(', ')}.`, '', `**Sensitivity:** ${sens.message}`, '');
  for (const v of vs) {
    const t = v.topic;
    L.push(`## ${v.title}`, '', `**Research question (${state.edits[t.id]?.rq ? 'edited by you' : 'generated hypothesis'}):** ${v.rq}`, '');
    L.push(`**Problem:** ${t.problem}`, '', `**Method:** ${v.result.methodWhy}`, '', `**Estimated workload:** about ${v.result.workloadWeeks} weeks of part-time work (planning estimate, not a measurement).`, '');
    L.push('**Provisional hypotheses (not findings):**', ...t.hypotheses.map((h) => `- ${h}`), '');
    L.push('**Feasibility scores (1–5, author judgment unless marked):**', ...v.criteria.map((c) => `- ${c.label}: ${c.score.toFixed(1)}${c.basis === 'computed from your profile' ? ' (computed)' : ''}: ${c.why}`), '');
    L.push('**Career links (illustrative):**', ...t.careers.map((c) => `- ${roleById(c.roleId)?.label}: ${c.note}`), '');
    L.push('**Portfolio outputs:**', ...t.outputs.map((o) => `- ${outputById(o.outputId)?.label}: ${o.note}`), '');
    L.push('**Frameworks to look up (named from background knowledge, not verified citations):**', ...t.foundationalFrameworks.map((f) => `- ${theoryById(f)?.label}: ${theoryById(f)?.origin}`), '');
    const lit = literatureFor(t.id).slice(0, 8);
    L.push(`**Literature candidates** (OpenAlex metadata retrieved ${literatureMeta.retrievedAt}; relevance not human-vetted; abstracts not read in full):`, ...(lit.length ? lit.map((g) => `- ${g.primary.authors.slice(0, 3).join(', ')}${g.primary.authorCount > 3 ? ' et al.' : ''} (${g.primary.year}). ${g.primary.title}. ${g.primary.venue ?? ''}. ${g.primary.doi ?? g.primary.url}`) : ['- none retrieved']), '');
    const pr = precedentsFor(t.id, v.rq).slice(0, 6);
    L.push(`**Similar past master's theses** (repository metadata retrieved ${precedentMeta.retrievedAt}):`, ...(pr.length ? pr.map((p) => `- ${p.year ?? 'n.d.'}: ${p.title} (${p.institution}${p.programme ? `, ${p.programme.slice(0, 60)}` : ''}) ${p.url}`) : ['- none retrieved for this topic']), '');
    L.push('**Sources to consult:**', ...t.sourceIds.map((id) => sourceById(id)).filter(Boolean).map((s) => `- ${s!.name}: ${s!.url}`), '');
    L.push('**Claims to verify before relying on them:**', ...(t.claims.length ? t.claims.map((c) => `- ${c.text} _[${c.status}]_ ${c.check ?? ''}`) : ['- none flagged']), '');
    const oq = state.openQuestions[t.id] ?? [];
    L.push('**Outstanding questions:**', ...(oq.length ? oq.map((q) => `- ${q}`) : ['- none recorded']), '');
    if (state.notes[t.id]) L.push('**Your notes:**', '', state.notes[t.id], '');
    L.push('**Limitations:**', ...t.limitations.map((x) => `- ${x}`), '', '**Ethics:**', ...t.ethics.map((x) => `- ${x}`), '');
  }
  const tl = buildTimeline(state.timeline);
  L.push('## Preliminary work plan', '', tl.confirmed ? `Deadline entered by you: ${state.timeline.deadline}.` : '_No deadline entered. UPF’s page lists “mid-June” submission and a late-June/early-July defence; enter the confirmed date to schedule._', '');
  for (const st of tl.stages) L.push(`- ${st.label}: ${st.weeks} week(s)${st.start ? ` (${st.start} → ${st.end})` : ''}`);
  L.push('', '## Next steps', '- Read the top literature candidates and confirm any research gap yourself.', '- Contact potential supervisors (UPF asks for a topic and two supervisor preferences in February; confirm current dates).', '- Verify each flagged claim at its primary source.', '');
  return L.join('\n');
}

// ---------------- HTML (print-friendly) ----------------
export function buildHtml(inp: ExportInput): string {
  const md = buildMarkdown(inp);
  // Light, safe Markdown subset → HTML with everything escaped first.
  const lines = md.split('\n');
  let html = ''; let inList = false; let inTable = false;
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_(.+?)_/g, '<em>$1</em>').replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1">$1</a>');
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  const closeTable = () => { if (inTable) { html += '</tbody></table>'; inTable = false; } };
  for (const line of lines) {
    if (line.startsWith('|')) {
      closeList();
      if (/^\|[-| ]+\|$/.test(line)) continue;
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (!inTable) { html += '<table><thead><tr>' + cells.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>'; inTable = true; } else html += '<tr>' + cells.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>';
      continue;
    }
    closeTable();
    if (line.startsWith('- ')) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${inline(line.slice(2))}</li>`; continue; }
    closeList();
    if (line.startsWith('# ')) html += `<h1>${inline(line.slice(2))}</h1>`;
    else if (line.startsWith('## ')) html += `<h2>${inline(line.slice(3))}</h2>`;
    else if (line.startsWith('> ')) html += `<blockquote>${inline(line.slice(2))}</blockquote>`;
    else if (line.trim()) html += `<p>${inline(line)}</p>`;
  }
  closeList(); closeTable();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TFM shortlist</title>
<style>body{font:15px/1.55 Georgia,'Times New Roman',serif;color:#1d1b19;max-width:46rem;margin:2rem auto;padding:0 1rem}h1{font-size:1.7rem}h2{font-size:1.2rem;margin-top:2rem;border-top:1px solid #ccc;padding-top:1rem}table{border-collapse:collapse;width:100%;font:13px system-ui,sans-serif}th,td{border:1px solid #ccc;padding:.3rem .5rem;text-align:left}blockquote{border-left:3px solid #a23b2a;margin:1rem 0;padding:.2rem 1rem;color:#555}a{color:#7b2a1d;word-break:break-all}@media print{h2{break-after:avoid}a{color:inherit}}</style></head><body>${html}</body></html>`;
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------- backup + validated import ----------------
export function buildBackup(state: PersistedState): string {
  return JSON.stringify({ app: 'migration-tfm-explorer', version: STORE_VERSION, exportedAt: new Date().toISOString(), state }, null, 2);
}

export type ImportResult = { ok: true; state: Partial<PersistedState>; warnings: string[] } | { ok: false; error: string };

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Treats the file as untrusted: parses as JSON only, whitelists keys, and checks every value’s type and known ids. */
export function parseBackup(text: string): ImportResult {
  if (text.length > 2_000_000) return { ok: false, error: 'File is too large to be a backup.' };
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { ok: false, error: 'Not valid JSON.' }; }
  if (!isObj(data) || data.app !== 'migration-tfm-explorer' || !isObj(data.state)) return { ok: false, error: 'This is not a Migration Policy TFM Explorer backup.' };
  const s = data.state; const base = initialState(); const out: Partial<PersistedState> = {}; const warnings: string[] = [];
  const strArr = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : null;
  if (isObj(s.answers)) {
    const a: PersistedState['answers'] = {};
    for (const [k, v] of Object.entries(s.answers)) {
      if (!isObj(v)) continue;
      const val = v.value;
      const okVal = val === undefined || typeof val === 'string' || typeof val === 'number' || strArr(val);
      if (okVal && typeof v.at === 'number') a[k.slice(0, 40)] = { value: val as never, skipped: v.skipped === true, unsure: v.unsure === true, at: v.at };
    }
    out.answers = a;
  }
  const idsOk = (arr: string[] | null, label: string) => { if (!arr) return []; const ok = arr.filter((id) => topicById(id)); if (ok.length < arr.length) warnings.push(`${arr.length - ok.length} unknown topic id(s) in ${label} were ignored.`); return ok; };
  out.saved = idsOk(strArr(s.saved), 'saved topics');
  out.pinnedRoles = (strArr(s.pinnedRoles) ?? []).filter((id) => roleById(id));
  out.savedPlaces = (strArr(s.savedPlaces) ?? []).slice(0, 200);
  if (isObj(s.notes)) out.notes = Object.fromEntries(Object.entries(s.notes).filter(([k, v]) => topicById(k) && typeof v === 'string').map(([k, v]) => [k, String(v).slice(0, 20000)]));
  if (isObj(s.edits)) out.edits = Object.fromEntries(Object.entries(s.edits).filter(([k, v]) => topicById(k) && isObj(v)).map(([k, v]) => [k, { title: typeof (v as never as Record<string, unknown>).title === 'string' ? String((v as never as Record<string, unknown>).title).slice(0, 300) : undefined, rq: typeof (v as never as Record<string, unknown>).rq === 'string' ? String((v as never as Record<string, unknown>).rq).slice(0, 1000) : undefined }]));
  if (isObj(s.openQuestions)) out.openQuestions = Object.fromEntries(Object.entries(s.openQuestions).filter(([k]) => topicById(k)).map(([k, v]) => [k, (strArr(v) ?? []).slice(0, 50).map((x) => x.slice(0, 500))]));
  if (Array.isArray(s.feedbackLog)) out.feedbackLog = s.feedbackLog.filter((e): e is never => isObj(e) && typeof e.topicId === 'string' && !!topicById(e.topicId) && typeof e.tag === 'string' && (e.action === 'add' || e.action === 'remove') && typeof e.at === 'number');
  if (isObj(s.ui)) { const u = s.ui; out.ui = { ...base.ui, modes: (strArr(u.modes) ?? base.ui.modes) as never, detail: (['brief', 'standard', 'deep'].includes(String(u.detail)) ? u.detail : base.ui.detail) as never, breadth: (['broad', 'focused'].includes(String(u.breadth)) ? u.breadth : base.ui.breadth) as never, format: (['visual', 'written', 'balanced'].includes(String(u.format)) ? u.format : base.ui.format) as never, fullOverview: u.fullOverview === true, completed: u.completed === true }; }
  if (isObj(s.weights)) { const w = s.weights; out.weights = Object.fromEntries(Object.keys(base.weights).map((k) => [k, typeof w[k] === 'number' ? Math.max(0, Math.min(5, w[k] as number)) : (base.weights as never as Record<string, number>)[k]])) as never; }
  if (isObj(s.timeline)) { const t = s.timeline; out.timeline = { startDate: /^\d{4}-\d{2}-\d{2}$/.test(String(t.startDate)) ? String(t.startDate) : '', deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(t.deadline)) ? String(t.deadline) : '', confirmedFromOfficial: t.confirmedFromOfficial === true }; }
  if (isObj(s.labs)) out.labs = Object.fromEntries(Object.entries(s.labs).filter(([k, v]) => topicById(k) && isObj(v)).map(([k, v]) => [k, v as never]));
  if (isObj(s.dimOverrides)) out.dimOverrides = Object.fromEntries(Object.entries(s.dimOverrides).filter(([, v]) => typeof v === 'number').map(([k, v]) => [k, Math.max(0, Math.min(1, v as number))]));
  if (isObj(s.biOverrides)) out.biOverrides = Object.fromEntries(Object.entries(s.biOverrides).filter(([, v]) => typeof v === 'number').map(([k, v]) => [k, Math.max(0, Math.min(100, v as number))]));
  return { ok: true, state: out, warnings };
}

export const themeLabel = (id: string) => THEMES.find((t) => t.id === id)?.label ?? id;
export { outputById };
