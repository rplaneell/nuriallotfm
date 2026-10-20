import litSnap from '@/data/literature.snapshot.json';
import precSnap from '@/data/precedents.snapshot.json';
import linkSnap from '@/data/linkstatus.json';

export interface Work {
  openalexId: string; doi: string | null; title: string; authors: string[]; authorCount: number; year: number | null; type: string;
  venue: string | null; venueType: string | null; citedBy: number; openAccess: boolean; oaUrl: string | null; topic: string | null;
  abstractExcerpt: string | null; url: string; retrievedAt: string;
}
export interface Precedent {
  id: string; sourceId: string; institution: string; repository: string; title: string; authors: string[]; year: number | null;
  abstract: string; keywords: string[]; language: string; type: string; programme?: string; accessRights: string; url: string; similarity: string; topicIds: string[];
}
export interface PrecedentSource { id: string; label: string; institution: string; similarity: string; note?: string }

const lit = litSnap as unknown as { retrievedAt: string; method: string; works: Record<string, Work>; byTopic: Record<string, string[]> };
const prec = precSnap as unknown as { retrievedAt: string; method: string; sources: PrecedentSource[]; byTopic: Record<string, { id: string; relevance: number }[]>; items: Precedent[] };
const links = linkSnap as unknown as { checkedAt: string | null; results: Record<string, { status: number | null; ok: boolean; error?: string; finalUrl?: string }> };

export const literatureMeta = { retrievedAt: lit.retrievedAt, method: lit.method, total: Object.keys(lit.works).length };
export const precedentMeta = { retrievedAt: prec.retrievedAt, method: prec.method, total: prec.items.length, sources: prec.sources };

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export interface WorkGroup { primary: Work; duplicates: Work[] }

/** Groups records that share a DOI or an identical normalised title. */
export function dedupeWorks(works: Work[]): WorkGroup[] {
  const groups: WorkGroup[] = [];
  const seen = new Map<string, WorkGroup>();
  for (const w of works) {
    const keys = [w.doi ? `doi:${w.doi.toLowerCase()}` : '', `t:${norm(w.title).slice(0, 80)}`].filter(Boolean);
    const hit = keys.map((k) => seen.get(k)).find(Boolean);
    if (hit) { hit.duplicates.push(w); keys.forEach((k) => seen.set(k, hit)); continue; }
    const g: WorkGroup = { primary: w, duplicates: [] };
    keys.forEach((k) => seen.set(k, g));
    groups.push(g);
  }
  return groups;
}

/** True once the snapshot script has run for this topic (an empty result is then a real result, not a gap in retrieval). */
export const literatureFetched = (topicId: string) => topicId in lit.byTopic;
export const precedentsFetched = (topicId: string) => topicId in prec.byTopic;

export function literatureFor(topicId: string): WorkGroup[] {
  const ids = lit.byTopic[topicId] ?? [];
  const works = ids.map((id) => lit.works[id]).filter(Boolean).map((w) => ({ ...w, title: plainText(w.title), abstractExcerpt: w.abstractExcerpt ? plainText(w.abstractExcerpt) : null }));
  const groups = dedupeWorks(works);
  // Prefer journal articles that are cited or recent; keep a transparent, simple order.
  return groups.sort((a, b) => scoreWork(b.primary) - scoreWork(a.primary)).slice(0, 14);
}

function scoreWork(w: Work): number {
  const age = Math.max(0, 2026 - (w.year ?? 2000));
  return Math.log10(1 + w.citedBy) * 1.2 + (w.venueType === 'journal' ? 0.8 : 0) - age * 0.04 + (w.authorCount > 0 ? 0.2 : 0);
}

export function workKind(w: Work): string {
  if (w.venueType === 'journal') return 'Journal article';
  if (w.venueType === 'repository') return 'Repository item / preprint';
  if (w.type === 'book' || w.venueType === 'ebook platform' || w.venueType === 'book series') return 'Book or chapter';
  return w.type || 'Other';
}

const METHOD_PATTERNS: [string, RegExp][] = [
  ['interviews', /interview/i], ['comparative case study', /comparative|cross-?case|case stud/i], ['document analysis', /document analysis|legal analysis|policy analysis|legislation/i],
  ['discourse / content analysis', /discourse|content analysis|framing|frame analysis/i], ['survey / statistics', /survey|regression|statistical|quantitative|panel data|dataset/i],
  ['process tracing', /process[- ]tracing/i], ['mixed methods', /mixed[- ]method/i], ['ethnography / fieldwork', /ethnograph|fieldwork|participant observation/i],
  ['evaluation', /evaluat/i], ['geospatial', /geospatial|spatial|gis\b/i],
];
export const detectMethods = (text: string): string[] => METHOD_PATTERNS.filter(([, r]) => r.test(text)).map(([l]) => l);

const STOP = new Set('the and for with from that this these those into about their which what when where how why are was were have has been will would should could than then also such over more most less between among within across policy policies migration migrants immigrants immigrant'.split(' '));
const tokens = (s: string) => norm(s).split(' ').filter((w) => w.length > 3 && !STOP.has(w));

/** Jaccard-style overlap between a text and a research question: 0..1. A rough signal, never a verdict. */
export function overlap(a: string, b: string): number {
  const A = new Set(tokens(a)), B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.min(A.size, B.size);
}

/** Repository text is untrusted: remove markup and entities, collapse whitespace. */
export function plainText(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}
/** DiVA appends affiliations in parentheses: keep the name only. */
export const cleanAuthor = (a: string): string => a.replace(/\(.*$/, '').replace(/\[.*?\]/g, '').trim();

export interface PrecedentView extends Precedent { relevance: number; methods: string[]; overlapWithRq: number; open: boolean }

export function precedentsFor(topicId: string, rq = ''): PrecedentView[] {
  const refs = prec.byTopic[topicId] ?? [];
  const byId = new Map(prec.items.map((p) => [p.id, p]));
  return refs.map((r) => {
    const p = byId.get(r.id);
    if (!p) return null;
    return {
      ...p, title: plainText(p.title), abstract: plainText(p.abstract), authors: p.authors.map(cleanAuthor).filter(Boolean), relevance: r.relevance, methods: detectMethods(`${p.title} ${p.abstract}`),
      overlapWithRq: rq ? overlap(rq, `${p.title} ${p.abstract}`) : 0,
      open: /open|info:eu-repo\/semantics\/openAccess/i.test(p.accessRights),
    };
  }).filter((x): x is PrecedentView => !!x);
}

export function precedentCount(topicId: string): number { return prec.byTopic[topicId]?.length ?? 0; }
export function literatureCount(topicId: string): number { return lit.byTopic[topicId]?.length ?? 0; }

// ----- link status -----
export interface LinkInfo { status: number | null; ok: boolean; checkedAt: string | null; error?: string }
export function linkInfo(url: string): LinkInfo | null {
  const r = links.results[url];
  if (!r) return null;
  return { status: r.status, ok: r.ok, checkedAt: links.checkedAt, error: r.error };
}
export const linkMeta = { checkedAt: links.checkedAt, total: Object.keys(links.results).length, ok: Object.values(links.results).filter((r) => r.ok).length };

export const manualSearchLinks = (query: string) => {
  const q = encodeURIComponent(query);
  return [
    { label: 'UPF e-repository', url: `https://repositori.upf.edu/search?query=${q}` },
    { label: 'DiVA (Swedish student theses)', url: `https://www.diva-portal.org/smash/resultList.jsf?query=${q}&language=en&searchType=SIMPLE&noOfRows=50&sortOrder=relevance_sort_desc&onlyFullText=false&sf=student` },
    { label: 'Utrecht Student Theses', url: `https://studenttheses.uu.nl/search?query=${q}` },
    { label: 'BASE (Bielefeld)', url: `https://www.base-search.net/Search/Results?lookfor=${q}` },
    { label: 'OATD (open theses)', url: `https://oatd.org/oatd/search?q=${q}` },
    { label: 'Google Scholar', url: `https://scholar.google.com/scholar?q=${q}` },
    { label: 'OpenAlex', url: `https://openalex.org/works?search=${q}` },
  ];
};
