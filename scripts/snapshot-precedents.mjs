// Builds src/data/precedents.snapshot.json from live public repositories.
// Run: npm run snapshot:precedents   (needs internet; polite 600 ms spacing between requests)
import fs from 'node:fs';
import { DSPACE_SOURCES, DIVA_SOURCES, searchDSpace, searchDiva, sleep } from '../server/adapters.mjs';

// `--missing` keeps the existing snapshot and fetches only topics that have no entry yet.
const MISSING_ONLY = process.argv.includes('--missing');
const SNAP = 'src/data/precedents.snapshot.json';
const prev = MISSING_ONLY && fs.existsSync(SNAP) ? JSON.parse(fs.readFileSync(SNAP, 'utf8')) : null;
const allQueries = JSON.parse(fs.readFileSync('src/data/queries.json', 'utf8'));
const queries = prev ? Object.fromEntries(Object.entries(allQueries).filter(([id]) => !(id in prev.byTopic))) : allQueries;
const byKey = new Map();
const log = [];
const errors = [];

for (const [topicId, q] of Object.entries(queries)) {
  for (const term of q.precedents) {
    for (const src of DSPACE_SOURCES) {
      try {
        const { items, total } = await searchDSpace(src, term, 6);
        log.push({ topicId, term, source: src.id, total });
        for (const it of items) add(it, topicId, term);
      } catch (e) { errors.push({ topicId, term, source: src.id, error: String(e.message) }); }
      await sleep(600);
    }
    for (const src of DIVA_SOURCES) {
      try {
        const { items, total } = await searchDiva(src, term, 6);
        log.push({ topicId, term, source: src.id, total });
        for (const it of items) add(it, topicId, term);
      } catch (e) { errors.push({ topicId, term, source: src.id, error: String(e.message) }); }
      await sleep(900);
    }
  }
  console.log('done', topicId, byKey.size);
}

function add(it, topicId, term) {
  if (!it.title || !it.url) return;
  const key = (it.url || it.title).toLowerCase();
  const prev = byKey.get(key) ?? { ...it, id: 'p' + (byKey.size + 1), queriedFor: [] };
  if (!prev.queriedFor.some((x) => x.topicId === topicId && x.term === term)) prev.queriedFor.push({ topicId, term });
  byKey.set(key, prev);
}

// Relevance: distinct topic-query tokens found in title (x2) and abstract/keywords.
const STOP = new Set('the of and in to for a on policy policies migration migrants immigrants immigrant european union europe'.split(' '));
const tok = (t) => t.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const seen = new Map();
const perTopic = {};
for (const it of byKey.values()) {
  const k = norm(it.title).slice(0, 90);
  if (seen.has(k)) { seen.get(k).queriedFor.push(...it.queriedFor); continue; }
  seen.set(k, it);
}
const keep = new Map();
for (const [topicId, q] of Object.entries(queries)) {
  const qTokens = [...new Set(q.precedents.flatMap(tok))];
  const scored = [...seen.values()]
    .filter((it) => it.queriedFor.some((x) => x.topicId === topicId))
    .map((it) => {
      const title = new Set(tok(it.title));
      const rest = new Set(tok(`${it.abstract} ${(it.keywords || []).join(' ')}`));
      let r = 0;
      for (const w of qTokens) { if (title.has(w)) r += 2; else if (rest.has(w)) r += 1; }
      return { it, r };
    })
    .filter((x) => x.r >= 4)
    .sort((a, b) => b.r - a.r || (b.it.year ?? 0) - (a.it.year ?? 0));
  // Source diversity: at most 4 per source, 12 per topic.
  const counts = {}; const chosen = [];
  for (const x of scored) { const s = x.it.sourceId; counts[s] = (counts[s] || 0) + 1; if (counts[s] <= 4 && chosen.length < 12) chosen.push(x); }
  perTopic[topicId] = chosen.map((x) => ({ id: x.it.id, relevance: x.r }));
  for (const x of chosen) keep.set(x.it.id, x.it);
}
const items = [...keep.values()].map(({ queriedFor, ...rest }) => ({ ...rest, topicIds: [...new Set(queriedFor.map((x) => x.topicId))].filter((t) => perTopic[t]?.some((y) => y.id === rest.id)) }));
if (prev) {
  // Re-id new items after the existing ones; reuse an existing item when the URL is already known.
  const byUrl = new Map(prev.items.map((i) => [(i.url || i.title).toLowerCase(), i]));
  let next = Math.max(0, ...prev.items.map((i) => Number(String(i.id).slice(1)) || 0)) + 1;
  const remap = {};
  for (const it of items) {
    const known = byUrl.get((it.url || it.title).toLowerCase());
    if (known) { known.topicIds = [...new Set([...known.topicIds, ...it.topicIds])]; remap[it.id] = known.id; continue; }
    remap[it.id] = 'p' + next++;
    prev.items.push({ ...it, id: remap[it.id] });
  }
  for (const [t, list] of Object.entries(perTopic)) prev.byTopic[t] = list.map((x) => ({ ...x, id: remap[x.id] ?? x.id }));
  prev.errors = [...(prev.errors ?? []), ...errors];
  prev.log = [...(prev.log ?? []), ...log];
  prev.addedMissingOn = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(SNAP, JSON.stringify(prev, null, 1));
  console.log(`merged ${items.length} items for ${Object.keys(perTopic).length} new topics; ${errors.length} errors`);
  process.exit(0);
}
const out = {
  retrievedAt: new Date().toISOString().slice(0, 10),
  method: 'Public repository APIs (DSpace 7 REST, DiVA CSV export), master-level items only. Relevance = overlap with topic search terms (title x2, abstract/keywords x1); not human-vetted.',
  sources: [...DSPACE_SOURCES, ...DIVA_SOURCES].map(({ id, label, institution, similarity, programmeNote, note }) => ({ id, label, institution, similarity, note: programmeNote ?? note })),
  byTopic: perTopic, items, errors, log,
};
fs.writeFileSync('src/data/precedents.snapshot.json', JSON.stringify(out, null, 1));
console.log(`wrote ${items.length} precedents across ${Object.keys(perTopic).length} topics; ${errors.length} errors`);
