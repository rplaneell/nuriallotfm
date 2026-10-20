// Map behaviour without tiles (file://) and with a refused tile provider (403).
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ok = (n, v) => console.log((v ? 'PASS ' : 'FAIL ') + n);

// 1. shared file from disk: no tile requests at all, map still usable
let p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const tileReqs = []; p.on('request', (r) => { if (/tile|basemaps|arcgis/.test(r.url())) tileReqs.push(r.url()); });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(pathToFileURL('share/TFM-Explorer.html').href + '#/map'); await p.waitForSelector('.leaflet-container'); await p.waitForTimeout(1500);
ok('file://: no tile requests (so no 403)', tileReqs.length === 0);
ok('file://: tiles checkbox is off', !(await p.getByRole('checkbox', { name: /background map tiles/i }).isChecked()));
ok('legend explains red vs grey', await p.getByText(/Red countries \(\d+\) have curated content/).isVisible() && await p.getByText(/Grey countries have no curated content/).isVisible());
const nPaths = await p.locator('path.leaflet-interactive').count(); ok('country shapes drawn (' + nPaths + ')', nPaths > 150);
await p.goto(pathToFileURL('share/TFM-Explorer.html').href + '#/map?place=iso:BR'); await p.waitForTimeout(600);
ok('grey country: search-links panel', await p.getByText('No curated notes for this country').isVisible());
await p.goto(pathToFileURL('share/TFM-Explorer.html').href + '#/map?place=es'); await p.waitForTimeout(600);
ok('red country: curated panel', await p.getByText(/Linked thesis topics/).isVisible() && await p.getByText(/Institutional actors/).isVisible());
ok('no page errors', errs.length === 0);
await p.screenshot({ path: 'e2e-output/map-share.png', fullPage: true });

// 2. tile provider refuses with 403: app switches tiles off and says so
p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.route('https://tile.openstreetmap.org/**', (r) => r.fulfill({ status: 403, body: 'Access blocked' }));
await p.goto('http://localhost:5173/#/map'); await p.waitForSelector('.leaflet-container'); await p.waitForTimeout(2500);
ok('403 tiles: note shown and tiles switched off', await p.getByRole('status').filter({ hasText: /refused or could not be reached/ }).isVisible() && !(await p.getByRole('checkbox', { name: /background map tiles/i }).isChecked()));
ok('403 tiles: countries still clickable', (await p.locator('path.leaflet-interactive').count()) > 150);
await b.close();
