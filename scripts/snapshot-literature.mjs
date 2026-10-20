// Builds src/data/literature.snapshot.json from OpenAlex (open API, no key).
// Run: npm run snapshot:literature
import fs from 'node:fs';
import { searchOpenAlex, sleep } from '../server/adapters.mjs';

const queries = JSON.parse(fs.readFileSync('src/data/queries.json', 'utf8'));
const works = new Map();
const byTopic = {};
const errors = [];

for (const [topicId, q] of Object.entries(queries)) {
  byTopic[topicId] = [];
  for (const term of q.literature) {
    for (const recent of [false, true]) {
      try {
        const res = await searchOpenAlex(term, { perPage: 6, recent });
        for (const w of res) {
          if (!w.title || !w.year) continue;
          if (!works.has(w.openalexId)) works.set(w.openalexId, { ...w, retrievedAt: new Date().toISOString().slice(0, 10) });
          if (!byTopic[topicId].includes(w.openalexId)) byTopic[topicId].push(w.openalexId);
        }
      } catch (e) { errors.push({ topicId, term, recent, error: String(e.message) }); }
      await sleep(250);
    }
  }
  console.log('done', topicId, byTopic[topicId].length);
}
const out = { retrievedAt: new Date().toISOString().slice(0, 10), method: 'OpenAlex works search restricted to Social Sciences field; metadata as returned by OpenAlex. Topical relevance is NOT human-vetted.', works: Object.fromEntries(works), byTopic, errors };
fs.writeFileSync('src/data/literature.snapshot.json', JSON.stringify(out, null, 1));
console.log(`wrote ${works.size} works; ${errors.length} errors`);
