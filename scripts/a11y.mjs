// Accessibility audit with axe-core on every route, light and dark. Needs the app running.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
const BASE = process.env.BASE_URL ?? 'http://localhost:5173/#';
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const routes = ['/', '/test', '/explore', '/topics', '/topics/municipal-integration-catalonia', '/topics/municipal-integration-catalonia?tab=evidence', '/topics/municipal-integration-catalonia?tab=feasibility', '/topics/municipal-integration-catalonia?tab=lab', '/topics/municipal-integration-catalonia?tab=precedents', '/map', '/careers?role=me-analyst', '/dashboard', '/sources', '/about', '/profile'];
const browser = await chromium.launch({ executablePath: exe, headless: true });
let total = 0;
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: theme });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`); 
  // seed some state so data-rich pages are audited
  await page.evaluate(() => localStorage.setItem('migration-tfm-explorer', JSON.stringify({ state: { saved: ['municipal-integration-catalonia', 'padron-access-rights', 'eu-pact-implementation'], answers: { 'q2-pick': { value: ['local', 'integration', 'implementation'], at: 1 }, 'q1-pick': { value: ['sc-munis'], at: 1 }, 'q3-pick': { value: ['o-gap'], at: 1 }, 'q4-int': { value: ['comparative'], at: 1 }, 'q5-days': { value: ['admin'], at: 1 }, 'q6-level': { value: ['lv-local'], at: 1 } } }, version: 1 })));
  for (const r of routes) {
    await page.goto(`${BASE}${r}`); await page.reload(); await page.waitForSelector('main h1, main h2'); await page.waitForTimeout(600);
    await page.addScriptTag({ path: axePath });
    const res = await page.evaluate(async () => await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
    const bad = res.violations.filter((v) => ['serious', 'critical', 'moderate'].includes(v.impact));
    total += bad.length;
    console.log(`${bad.length ? 'FAIL' : 'ok  '} [${theme}] ${r}`);
    for (const v of bad) console.log(`     ${v.impact} ${v.id}: ${v.help} (${v.nodes.length} nodes) e.g. ${v.nodes[0].target.join(' ')} ${v.nodes[0].failureSummary?.split('\n')[1]?.slice(0, 110) ?? ''}`);
  }
  await ctx.close();
}
await browser.close();
console.log(`\n${total} serious/critical/moderate violation(s)`);
process.exit(total ? 1 : 0);
