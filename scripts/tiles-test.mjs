// Which map tile providers load when the page is opened from disk (no Referer) versus over http?
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';

const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
const urls = {
  'OSM standard': 'https://tile.openstreetmap.org/3/4/3.png',
  'CARTO light': 'https://a.basemaps.cartocdn.com/light_all/3/4/3.png',
  'CARTO light (no labels)': 'https://a.basemaps.cartocdn.com/light_nolabels/3/4/3.png',
  'Esri light gray': 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/3/3/4',
};
const probe = (u) => p.evaluate((u) => new Promise((res) => { const i = new Image(); i.onload = () => res('loads'); i.onerror = () => res('BLOCKED'); i.src = u + '?t=' + Date.now(); }), u);

await p.goto(pathToFileURL('share/TFM-Explorer.html').href);
console.log('--- page opened from disk (file://)');
for (const [n, u] of Object.entries(urls)) console.log(n.padEnd(26), await probe(u));
await p.goto(process.env.HTTP_URL ?? 'http://localhost:5173/');
console.log('--- page served over http (has a Referer)');
for (const [n, u] of Object.entries(urls)) console.log(n.padEnd(26), await probe(u));
await b.close();
