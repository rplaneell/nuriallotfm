// Builds src/data/countries.geo.json from Natural Earth 110m admin-0 (public domain).
import fs from 'node:fs';
const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
const res = await fetch(url);
if (!res.ok) throw new Error('HTTP ' + res.status);
const gj = await res.json();
const r = (n) => Math.round(n * 100) / 100;
const round = (c) => (typeof c[0] === 'number' ? [r(c[0]), r(c[1])] : c.map(round));
const features = gj.features.map((f) => ({
  type: 'Feature',
  properties: { name: f.properties.NAME, iso2: f.properties.ISO_A2_EH && f.properties.ISO_A2_EH !== '-99' ? f.properties.ISO_A2_EH : f.properties.ISO_A2, iso3: f.properties.ADM0_A3, eu: false },
  geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) },
}));
const EU = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE'.split(' ');
for (const f of features) f.properties.eu = EU.includes(f.properties.iso2);
fs.writeFileSync('src/data/countries.geo.json', JSON.stringify({ type: 'FeatureCollection', features, _source: 'Natural Earth 110m admin-0 countries (public domain), simplified' }));
console.log(features.length, 'countries', (fs.statSync('src/data/countries.geo.json').size / 1024).toFixed(0) + ' KB');
