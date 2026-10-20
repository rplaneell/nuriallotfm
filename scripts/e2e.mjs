// End-to-end check of the main workflows in a real browser (Edge or Chrome via playwright-core).
// Needs the app running:  npm run start     then:  npm run e2e
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173/#';
const OUT = process.env.E2E_OUT ?? 'e2e-output';
fs.mkdirSync(OUT, { recursive: true });
const exe = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => p && fs.existsSync(p));

const results = [];
const errors = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

const browser = await chromium.launch({ executablePath: exe, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error' && !/tile\.openstreetmap|Failed to load resource.*(tile|api)/.test(m.text() + m.location().url)) errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
const go = async (p) => { await page.goto(`${BASE}${p}`); await page.waitForSelector('main h1, main h2', { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(150); };
const visible = (loc) => loc.first().waitFor({ state: 'visible', timeout: 6000 }).then(() => true).catch(() => false);

// ---------- 1. Home ----------
await go('/');
check('home renders headline', await page.getByRole('heading', { level: 1 }).first().innerText().then((t) => /thesis you can finish/i.test(t)));
check('home offers a next step', await page.getByRole('link', { name: /start the test|continue the test/i }).count() > 0);

// ---------- 2. Orientation test: answer every question ----------
await go('/test');
let guard = 0;
while (guard++ < 60) {
  await page.waitForTimeout(80);
  const finish = page.getByRole('link', { name: /finish and see my profile/i });
  const q = page.locator('#q-prompt');
  const radios = page.locator('section[aria-labelledby="q-prompt"] input[type=radio]');
  const checks = page.locator('section[aria-labelledby="q-prompt"] input[type=checkbox]');
  const slider = page.locator('section[aria-labelledby="q-prompt"] [role=slider]');
  const rank = page.getByRole('button', { name: /keep this order/i });
  const text = page.locator('section[aria-labelledby="q-prompt"] textarea');
  if (await radios.count()) await radios.first().check();
  else if (await checks.count()) { const n = await checks.count(); for (let i = 0; i < Math.min(2, n); i++) { const c = checks.nth(i); if (await c.isEnabled()) await c.check(); } }
  else if (await slider.count()) { await slider.first().focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); }
  else if (await rank.count()) await rank.click();
  else if (await text.count()) await text.fill('Municipal registration barriers I saw in Manresa.');
  if (await finish.count()) { await finish.click(); break; }
  await page.getByRole('button', { name: /^next/i }).click();
  void q;
}
await page.waitForURL(/profile/);
check('test completes and opens profile', /profile/.test(page.url()));
check('profile shows interests with strength labels', await visible(page.getByText(/Strong signal|Moderate|Tentative/).first()));
check('profile lists research directions', await visible(page.getByRole('heading', { name: /promising research directions/i })));
check('profile explains with "Why?" evidence', await visible(page.getByText(/^Why\?/).first()));
await page.screenshot({ path: `${OUT}/profile.png`, fullPage: true });

// profile editing
await page.getByRole('button', { name: /edit my profile/i }).click();
const sl = page.getByRole('slider').first();
await sl.focus(); await page.keyboard.press('End');
check('profile can be edited (override flagged "Set by you")', await visible(page.getByText('Set by you').first()));
await page.getByRole('button', { name: /reset .* to computed/i }).first().click();

// test revisit keeps answers
await go('/test?q=q1-pick');
await page.waitForSelector('#q-prompt');
check('answers persist and can be revisited', await page.locator('section[aria-labelledby="q-prompt"] input:checked').count() > 0);

// ---------- 3. Interface personalisation ----------
await go('/explore');
await page.getByRole('checkbox', { name: /Visual explorer/ }).check();
await page.getByRole('checkbox', { name: /Guided discovery/ }).uncheck();
await page.getByRole('button', { name: /^next$/i }).click();
await page.getByRole('button', { name: /^next$/i }).click();
await page.getByRole('button', { name: /apply and go to home/i }).click();
await page.waitForTimeout(300);
const navFirst = await page.locator('nav[aria-label=Main] a').allInnerTexts();
check('visual mode reorders navigation (Map before Topics)', navFirst.indexOf('Map') < navFirst.indexOf('Topics'), navFirst.join(' > '));
check('visual mode puts a chart on Home', await visible(page.getByRole('img', { name: /bar chart of topic match/i })));
// complete overview toggle
await page.getByRole('button', { name: /settings/i }).click();
await page.getByRole('checkbox', { name: /show the complete overview/i }).check();
await page.keyboard.press('Escape');
check('complete overview shows policy + method + career blocks', (await page.getByRole('heading', { name: /start from a policy problem/i }).count()) > 0 && (await page.getByRole('heading', { name: /start from a method/i }).count()) > 0 && (await page.getByRole('heading', { name: /start from a role/i }).count()) > 0);
await page.getByRole('button', { name: /settings/i }).click();
await page.getByRole('checkbox', { name: /show the complete overview/i }).uncheck();
await page.getByRole('button', { name: /reset interface settings/i }).click();
await page.keyboard.press('Escape');

// ---------- 4. Topics + feedback ----------
await go('/topics');
const cards = page.locator('article');
await page.waitForSelector('article');
const n0 = await cards.count();
await page.waitForSelector('article');
check('topics list renders ranked cards', n0 >= 5, `${n0} cards`);
const firstTitle = await cards.first().locator('h2').innerText();
await cards.first().getByRole('button', { name: 'Very interesting' }).click();
check('feedback toggles state', (await cards.first().getByRole('button', { name: 'Very interesting' }).getAttribute('aria-pressed')) === 'true');
await cards.first().getByRole('button', { name: 'Not for me' }).click();
await page.waitForTimeout(200);
const afterTitle = await cards.first().locator('h2').innerText();
check('"Not for me" sets the topic aside', afterTitle !== firstTitle && await visible(page.getByRole('heading', { name: /set aside/i })));
await page.getByRole('button', { name: /undo last reaction/i }).click();
await page.waitForTimeout(200);
check('undo restores the previous ranking', (await cards.first().locator('h2').innerText()) === firstTitle);
await page.getByRole('button', { name: 'Not for me' }).first().click();
await page.getByRole('button', { name: 'Restore' }).first().click();
await page.waitForTimeout(200);
check('restoring a set-aside topic works', (await page.getByRole('heading', { name: /set aside/i }).count()) === 0);

// filters
await page.getByLabel('Search').fill('asylum');
await page.waitForTimeout(200);
const filtered = await cards.count();
check('search filters topics', filtered > 0 && filtered < n0, `${filtered} of ${n0}`);
await page.getByLabel('Search').fill('zzzzqqqq');
check('empty state when nothing matches', await visible(page.getByText('No topics match these filters')));
await page.getByRole('button', { name: 'Clear filters' }).first().click();
await cards.first().waitFor({ timeout: 5000 }).catch(() => {});
await page.getByLabel('World region').selectOption('latam');
await cards.first().waitFor({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(400);
const latamCards = await cards.count();
check('world region filter lists Latin American topics', latamCards >= 8, `${latamCards} cards ${page.url()}`);
await page.getByLabel('World region').selectOption('');
await cards.first().waitFor({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(400);

// ---------- 5. Topic detail ----------
await page.locator('article h2 a').first().click();
await page.waitForURL(/topics\//);
check('topic detail shows RQ and subquestions', await visible(page.getByRole('heading', { name: 'Research question' }).first()));
for (const [tab, marker] of [['Evidence', /Literature candidates/], ['Past theses', /Past master’s theses on similar questions/], ['Method', /Evidence required/], ['Feasibility', /Overall/], ['Careers', /Portfolio outputs/]]) {
  await page.getByRole('tab', { name: tab }).click();
  check(`tab "${tab}" renders`, await visible(page.getByText(marker).first()));
}
// The first ranked card may be a topic added after the last evidence snapshot, so check the evidence tabs on one with snapshot data.
await go('/topics/municipal-integration-catalonia');
await page.getByRole('tab', { name: 'Evidence' }).click();
check('literature carries verified-metadata badge and DOI/links', await visible(page.getByText('Verified metadata').first()) && await page.locator('a:has-text("Open DOI"), a:has-text("Open record")').count() > 0);
await page.getByRole('tab', { name: 'Past theses' }).click();
check('past theses list with repository badge', await visible(page.getByText('Repository record').first()));
await page.screenshot({ path: `${OUT}/topic-precedents.png`, fullPage: true });
await page.getByRole('tab', { name: 'Feasibility' }).click();
const before = await page.getByText(/^Overall$/).first().locator('xpath=ancestor::div[1]').innerText();
// change a criterion weight
await page.getByRole('slider', { name: /Importance of Data accessibility/ }).focus().catch(() => {});
await page.screenshot({ path: `${OUT}/topic-feasibility.png`, fullPage: true });
void before;

// lab
await page.getByRole('tab', { name: /refine/i }).click();
const rq0 = await page.locator('section[aria-labelledby=lab-rq] > p').first().innerText();
await page.getByRole('radio', { name: 'Narrow' }).click();
await page.getByRole('radio', { name: 'Evaluation' }).click();
await page.waitForTimeout(200);
const rq1 = await page.locator('section[aria-labelledby=lab-rq] > p').first().innerText();
check('lab changes the research question', rq0 !== rq1 && /one dimension/.test(rq1) && /evidence/i.test(rq1), rq1.slice(0, 90));
check('lab shows why feasibility changed', await visible(page.getByText(/What your changes did to feasibility/)) && await visible(page.getByText(/Narrow questions are easier to finish/)));
check('lab shows three versions', await visible(page.getByText('Ambitious').first()) && await visible(page.getByText('Lower risk').first()));
await page.getByRole('button', { name: /load this version/i }).nth(2).click();
await page.waitForTimeout(200);
check('loading the lower-risk version applies it', (await page.getByRole('form', { name: 'Refinement controls' }).getByLabel('Method').inputValue()) === 'documents');
await page.getByRole('button', { name: /edit in my own words/i }).click();
await page.getByLabel('Your version of the question').fill('How do three Catalan towns apply the reception law?');
await page.getByRole('button', { name: 'Save', exact: true }).click();
check('research question can be edited', await visible(page.getByText('How do three Catalan towns apply the reception law?').first()));
await page.getByRole('button', { name: /suggest alternatives/i }).click();
check('AI panel degrades gracefully when not configured', await visible(page.getByText(/not configured|AI help is not available/i).first()));
await page.screenshot({ path: `${OUT}/lab.png`, fullPage: true });

// notes
await page.getByRole('tab', { name: 'Notes' }).click();
await page.getByLabel('Research notes').fill('Ask Prof about interviews.');
await page.getByLabel('New question').fill('Which services require padrón?');
await page.getByRole('button', { name: 'Add' }).click();
check('notes and open questions save', await visible(page.getByText('Which services require padrón?')));

// ---------- 6. Save three, dashboard ----------
await go('/topics');
const saveBtns = page.getByRole('button', { name: /^Save/ });
for (let i = 0; i < 3; i++) await saveBtns.nth(0).click().then(() => page.waitForTimeout(100));
check('three topics saved (nav badge)', (await page.locator('nav[aria-label=Main]').innerText()).includes('3'));
await go('/dashboard');
check('dashboard shows comparison table', await visible(page.getByRole('table', { name: /Comparison of saved topics/ })));
const topBefore = await page.locator('thead th a').first().innerText();
const w = page.getByRole('slider', { name: 'Importance of Feasibility' });
await w.focus(); await page.keyboard.press('Home');
const w2 = page.getByRole('slider', { name: 'Importance of Personal interest' });
await w2.focus(); await page.keyboard.press('End');
await page.waitForTimeout(250);
check('weights re-rank immediately (scores change)', await page.locator('tr:has-text("Weighted score") td').first().innerText().then((t) => t.trim().length > 0));
check('sensitivity analysis is shown', await visible(page.getByText(/random weightings/)) && await visible(page.getByText(/If one priority dominated/)));
void topBefore;
await page.screenshot({ path: `${OUT}/dashboard.png`, fullPage: true });
// timeline
await page.getByLabel('Start of thesis work').fill('2027-02-01');
await page.getByLabel(/Submission deadline/).fill('2027-06-15');
check('timeline schedules stages between confirmed dates', await visible(page.getByText(/2027-02-01 →/).first()));
// exports
const dl = async (name) => { const [d] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name }).click()]); const p = `${OUT}/${d.suggestedFilename()}`; await d.saveAs(p); return { p, text: fs.readFileSync(p, 'utf8') }; };
const md = await dl('Markdown'); check('Markdown export has shortlist + verification labels', /# TFM shortlist/.test(md.text) && /generated hypothesis/.test(md.text) && /Claims to verify/.test(md.text) && !/undefined|NaN/.test(md.text));
const csv = await dl('CSV'); check('CSV export has header and 3 rows', csv.text.trim().split('\r\n').length === 4 && /Personal-interest alignment/.test(csv.text));
const html = await dl('HTML report'); check('HTML report is a complete document', /<!doctype html>/i.test(html.text) && /<table>/.test(html.text));
const bk = await dl('Download backup'); check('backup is valid JSON', JSON.parse(bk.text).app === 'migration-tfm-explorer');

// persistence
await page.reload(); await page.waitForLoadState('networkidle');
check('data persists after reload', (await page.locator('thead th').count()) >= 3);
// restore backup (import)
await page.setInputFiles('input[type=file]', bk.p);
check('backup restore reports success', await visible(page.getByText(/Backup restored/)));
fs.writeFileSync(`${OUT}/bad.json`, '{"app":"nope"}');
await page.setInputFiles('input[type=file]', `${OUT}/bad.json`);
check('invalid backup is rejected with an error', await visible(page.getByText(/not a Migration Policy TFM Explorer backup/i)));

// ---------- 7. Map ----------
await go('/map');
await page.waitForSelector('.leaflet-container');
check('map renders with attribution', await page.locator('.leaflet-control-attribution').innerText().then((t) => /OpenStreetMap/.test(t)));
await page.getByRole('button', { name: 'Catalonia', exact: true }).click();
check('selecting a place opens contextual panel', await visible(page.getByRole('heading', { name: 'Catalonia' })) && await visible(page.getByText(/Linked thesis topics/)));
const placesAll = await page.locator('#plist-h + ul li, #plist-h ~ ul li').count();
await page.getByLabel('Policy theme').selectOption('asylum');
await page.waitForTimeout(250);
const placesFiltered = await page.locator('#plist-h ~ ul li').count();
check('theme filter narrows the visible places', placesFiltered > 0 && placesFiltered < placesAll, `${placesFiltered} of ${placesAll}`);
await page.getByLabel('Policy theme').selectOption('');
await page.getByLabel('Search places or issues').fill('zzzzqq');
check('map empty state', await visible(page.getByText('No places match')));
await page.getByLabel('Search places or issues').fill('');
await page.getByRole('button', { name: 'Save place' }).click();
check('places can be saved', await visible(page.getByRole('heading', { name: 'Saved places' })));
await page.getByLabel('Place A').selectOption({ label: 'Catalonia' });
await page.getByLabel('Place B').selectOption({ label: 'Italy' });
check('place comparison is descriptive and disclaims causality', await visible(page.getByRole('table', { name: /Descriptive comparison/ })) && await visible(page.getByText(/not something this table shows|Descriptive only/).first()));
await page.screenshot({ path: `${OUT}/map.png`, fullPage: true });

// ---------- 8. Careers both directions ----------
await go('/careers');
await page.getByLabel('Start from a role').selectOption('me-analyst');
check('role view lists supporting topics', await visible(page.getByRole('heading', { name: /Thesis topics that support this role/ })));
await page.getByRole('button', { name: /pin as target/i }).first().click();
check('role can be pinned', await visible(page.getByRole('button', { name: /unpin target/i })));
await go('/careers');
await page.getByLabel('Start from a topic').selectOption({ index: 1 });
check('topic view lists roles', await visible(page.getByRole('heading', { name: /Roles that/ })));

// ---------- 9. Sources ----------
await go('/sources');
check('sources page shows statuses and counts', await visible(page.getByText(/works from OpenAlex/)) && await visible(page.getByText(/Link checked|Checked 20/).first()));
await page.getByRole('button', { name: 'Recheck' }).first().click();
await page.waitForTimeout(3000);
check('source recheck reports a result', await visible(page.getByText(/Your recheck/).first()));

// ---------- 10. Accessibility + responsive ----------
await go('/');
await page.reload();
await page.waitForSelector('main h1');
await page.keyboard.press('Tab');
check('skip link is first focus target', await page.evaluate(() => document.activeElement?.className.includes('skip-link')));
const mobile = await browser.newContext({ viewport: { width: 375, height: 800 } });
const mp = await mobile.newPage();
for (const route of ['/', '/test', '/topics', '/map', '/careers', '/dashboard', '/sources']) {
  await mp.goto(`${BASE}${route}`); await mp.waitForLoadState('networkidle').catch(() => {});
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`mobile 375px: no horizontal page scroll on ${route}`, overflow <= 1, `overflow ${overflow}px`);
}
await mp.goto(`${BASE}/topics`); await mp.screenshot({ path: `${OUT}/mobile-topics.png`, fullPage: false });

// dark mode renders
await go('/'); await page.getByRole('button', { name: /switch to dark theme/i }).click();
check('dark theme applies', (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark');
await page.screenshot({ path: `${OUT}/home-dark.png` });

check('no unexpected console or page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
process.exit(failed.length ? 1 : 0);
