// Checks every URL listed in the source registry and career data. Writes src/data/linkstatus.json.
// Run: npm run check:links. Uses HEAD then GET fallback, 15 s timeout, polite spacing.
import fs from 'node:fs';
import { sleep } from '../server/adapters.mjs';

const files = ['src/data/sources.ts', 'src/data/careers.ts'];
const urls = new Set();
for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/https?:\/\/[^'"\s)]+/g)) urls.add(m[0]);
const results = {};
const UA = 'MigrationTFMExplorer/1.0 link-checker (academic; respects robots.txt for crawling is not applicable to single HEAD requests)';
for (const url of urls) {
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (res.status === 405 || res.status === 403 || res.status === 400 || res.status === 404) res = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': UA, Range: 'bytes=0-2048' }, signal: AbortSignal.timeout(15000) });
    results[url] = { status: res.status, ok: res.status >= 200 && res.status < 400, finalUrl: res.url };
  } catch (e) { results[url] = { status: null, ok: false, error: String(e.cause?.code ?? e.message) }; }
  await sleep(300);
}
fs.writeFileSync('src/data/linkstatus.json', JSON.stringify({ checkedAt: new Date().toISOString().slice(0, 10), results }, null, 1));
const bad = Object.entries(results).filter(([, r]) => !r.ok);
console.log(`${urls.size} urls, ${urls.size - bad.length} ok`);
for (const [u, r] of bad) console.log('FAIL', r.status ?? r.error, u);
