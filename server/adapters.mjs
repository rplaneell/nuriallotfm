// Retrieval adapters for open thesis repositories and OpenAlex.
// Shared by the snapshot scripts (offline evidence bundle) and the live API server.
// Only public, documented endpoints are used; every request is rate-limited by the caller.

const UA = 'MigrationTFMExplorer/1.0 (academic research tool; respects robots.txt and rate limits)';

export const DSPACE_SOURCES = [
  {
    id: 'upf-polsoc-masters',
    institution: 'Universitat Pompeu Fabra',
    label: 'UPF e-repository: master theses, Dept. of Political and Social Sciences',
    base: 'https://repositori.upf.edu',
    scope: '101d9e27-a728-49e4-b4a1-8fd13d73c781',
    programmeNote: 'Collection of the department that runs the Master in Governance. Programme is not always recorded in the metadata.',
    similarity: 'same-department',
  },
  {
    id: 'upf-ibei-ir',
    institution: 'IBEI (UPF)',
    label: 'IBEI: Master in International Relations',
    base: 'https://repositori.upf.edu',
    scope: 'd360ef72-9faa-4f62-ab0e-c7ed0d441a92',
    programmeNote: 'Master in International Relations, IBEI.',
    similarity: 'same-university',
  },
  {
    id: 'upf-ibei-is',
    institution: 'IBEI (UPF)',
    label: 'IBEI: Master in International Studies',
    base: 'https://repositori.upf.edu',
    scope: 'a26b700f-e856-403f-b9fd-35830bea7f73',
    programmeNote: 'Master in International Studies, IBEI.',
    similarity: 'same-university',
  },
  {
    id: 'upf-ibei-mapp',
    institution: 'IBEI (UPF)',
    label: 'IBEI: Master in Public Policy (Mundus MAPP)',
    base: 'https://repositori.upf.edu',
    scope: '72d39227-7a23-4a15-8f31-5e21c551d5e0',
    programmeNote: 'Public policy master, IBEI.',
    similarity: 'same-university',
  },
  {
    id: 'uu-student-theses',
    institution: 'Utrecht University',
    label: 'Utrecht University Student Theses Repository',
    base: 'https://studenttheses.uu.nl',
    scope: null,
    programmeNote: 'All faculties; filtered to master-level items by query relevance only.',
    similarity: 'comparable-programme',
  },
];

export const DIVA_SOURCES = [
  {
    id: 'diva-sweden',
    institution: 'Swedish universities (DiVA portal)',
    label: 'DiVA: Swedish student theses (e.g. Malmö, Linköping, Uppsala, Stockholm)',
    note: 'Includes master programmes in migration and ethnic relations. Master-level theses only.',
    similarity: 'comparable-programme',
  },
];

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(45000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${new URL(url).host}`);
  return res.json();
}

const firstVal = (m, key) => (m?.[key]?.[0]?.value ?? '').toString();
const allVals = (m, key) => (m?.[key] ?? []).map((x) => x.value).filter(Boolean);

function clip(s, n = 700) {
  const t = (s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
}

/** DSpace 7 REST discovery search. */
export async function searchDSpace(source, query, size = 10) {
  const params = new URLSearchParams({ query, size: String(size * 2), sort: 'score,DESC' });
  if (source.scope) params.set('scope', source.scope);
  const data = await getJson(`${source.base}/server/api/discover/search/objects?${params}`);
  const objs = data?._embedded?.searchResult?._embedded?.objects ?? [];
  const total = data?._embedded?.searchResult?.page?.totalElements ?? objs.length;
  const items = objs
    .map((o) => o?._embedded?.indexableObject)
    .filter(Boolean)
    .map((it) => {
      const m = it.metadata ?? {};
      const uri = firstVal(m, 'dc.identifier.uri') || (it.handle ? `${source.base}/handle/${it.handle}` : '');
      const type = [...allVals(m, 'dc.type'), ...allVals(m, 'dc.type.content')].join('; ');
      return {
        sourceId: source.id,
        institution: source.institution,
        repository: source.label,
        title: clip(firstVal(m, 'dc.title'), 300),
        authors: allVals(m, 'dc.contributor.author').slice(0, 3),
        year: Number((firstVal(m, 'dc.date.issued') || '').slice(0, 4)) || null,
        abstract: clip(firstVal(m, 'dc.description.abstract'), 600),
        keywords: [...allVals(m, 'dc.subject.keyword'), ...allVals(m, 'dc.subject.keywords'), ...allVals(m, 'dc.subject.other')].slice(0, 8),
        language: firstVal(m, 'dc.language.iso'),
        type,
        programme: firstVal(m, 'dc.subject.courseuu') || '',
        accessRights: firstVal(m, 'dc.rights.accessRights') || firstVal(m, 'dc.rights.accessrights') || 'unspecified',
        url: uri,
        handle: it.handle ?? null,
        similarity: source.similarity,
      };
    })
    .filter((x) => /master/i.test(x.type) || /master/i.test(x.programme))
    .slice(0, size);
  return { total, items };
}

/** Minimal RFC-4180 CSV parser (quoted fields, embedded newlines and quotes). */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQ) {
      if (c === '"') { if (src[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const [head, ...rest] = rows;
  return rest.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

/** DiVA portal CSV export, restricted to student theses. */
export async function searchDiva(source, query, size = 10) {
  const aq = JSON.stringify([[{ freeText: query }]]);
  const aq2 = JSON.stringify([[{ publicationTypeCode: ['studentThesis'] }]]);
  const url = `https://www.diva-portal.org/smash/export.jsf?format=csvall&addFilename=true&aq=${encodeURIComponent(aq)}&aqe=%5B%5D&aq2=${encodeURIComponent(aq2)}&onlyFullText=false&noOfRows=${size * 3}&sortOrder=relevance_sort_desc&sortOrder2=title_sort_asc`;
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(40000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for diva-portal.org`);
  const rows = parseCsv(await res.text());
  const items = rows
    .filter((r) => /master/i.test(`${r.ThesisLevel} ${r.PublicationType} ${r.Credits}`) || /master/i.test(r.Programme))
    .slice(0, size)
    .map((r) => ({
      sourceId: source.id,
      institution: 'Swedish university (DiVA)',
      repository: source.label,
      title: clip(r.Title, 300),
      authors: (r.Name || '').split(';').map((s) => s.replace(/\(.*$/, '').replace(/\[.*?\]/g, '').trim()).filter(Boolean).slice(0, 3),
      year: Number(r.Year) || null,
      abstract: clip(r.Abstract),
      keywords: (r.Keywords || '').split(/[;,]/).map((s) => s.trim()).filter(Boolean).slice(0, 8),
      language: r.Language || '',
      type: [r.ThesisLevel, r.Credits && `${r.Credits} credits`].filter(Boolean).join(', ') || 'student thesis',
      programme: r.Programme || '',
      accessRights: r.Urls ? 'open full text link listed' : 'unspecified',
      url: `https://www.diva-portal.org/smash/record.jsf?pid=diva2%3A${r.PID}`,
      handle: null,
      similarity: source.similarity,
    }));
  return { total: rows.length, items };
}

/** OpenAlex works search (social sciences), returns compact verified metadata. */
export async function searchOpenAlex(query, { perPage = 8, recent = false, mailto = process.env.OPENALEX_MAILTO } = {}) {
  const filters = ['primary_topic.field.id:33', 'type:article|book|book-chapter|review', `from_publication_date:${recent ? '2021-01-01' : '2008-01-01'}`];
  const params = new URLSearchParams({
    search: query,
    filter: filters.join(','),
    'per-page': String(perPage),
    select: 'id,doi,title,publication_year,publication_date,type,cited_by_count,primary_location,authorships,open_access,primary_topic,abstract_inverted_index',
  });
  if (mailto) params.set('mailto', mailto);
  const data = await getJson(`https://api.openalex.org/works?${params}`);
  return (data.results ?? []).map(normaliseWork);
}

export function normaliseWork(w) {
  const abstract = invertAbstract(w.abstract_inverted_index);
  const src = w.primary_location?.source;
  return {
    openalexId: w.id,
    doi: w.doi ?? null,
    title: (w.title ?? '').replace(/\s+/g, ' ').trim(),
    authors: (w.authorships ?? []).slice(0, 4).map((a) => a.author?.display_name).filter(Boolean),
    authorCount: (w.authorships ?? []).length,
    year: w.publication_year ?? null,
    type: w.type ?? 'unknown',
    venue: src?.display_name ?? null,
    venueType: src?.type ?? null,
    isPeerReviewedVenue: src?.type === 'journal',
    citedBy: w.cited_by_count ?? 0,
    openAccess: w.open_access?.is_oa ?? false,
    oaUrl: w.open_access?.oa_url ?? null,
    topic: w.primary_topic?.display_name ?? null,
    abstractExcerpt: abstract ? clip(abstract, 420) : null,
    url: w.doi ?? w.id,
  };
}

function invertAbstract(inv) {
  if (!inv) return '';
  const words = [];
  for (const [word, positions] of Object.entries(inv)) for (const p of positions) words[p] = word;
  return words.join(' ');
}

/** Crossref lookup used for DOI verification (existence + title match). */
export async function crossrefByDoi(doi) {
  const clean = doi.replace(/^https?:\/\/doi\.org\//, '');
  const data = await getJson(`https://api.crossref.org/works/${encodeURIComponent(clean)}`);
  const w = data.message;
  return { doi: clean, title: (w.title?.[0] ?? '').trim(), year: w.issued?.['date-parts']?.[0]?.[0] ?? null, container: w['container-title']?.[0] ?? null };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
