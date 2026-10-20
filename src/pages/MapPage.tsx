import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip as MapTooltip } from 'react-leaflet';
import type { TileErrorEvent } from 'leaflet';
import type { Feature } from 'geojson';
import type { PathOptions } from 'leaflet';
import { ExternalLink, MapPin, Plus, Star } from 'lucide-react';
import geo from '@/data/countries.geo.json';
import { PLACES, placeById, type Place } from '@/data/places';
import { TOPICS } from '@/data/topics';
import { METHODS, THEMES } from '@/data/taxonomy';
import { sourceById } from '@/data/sources';
import { ROLES } from '@/data/careers';
import { useApp } from '@/store/useApp';
import { useRanking } from '@/store/derived';
import { linkInfo, literatureCount, manualSearchLinks, precedentCount } from '@/lib/evidence';
import { Empty, EvidenceBadge, Notice, PageHeader, SelectField } from '@/components/ui';
import type { Level } from '@/types';

const PLACE_BY_ISO = new Map(PLACES.filter((p) => p.iso2).map((p) => [p.iso2!, p]));
type CountryProps = { name: string; iso2: string; eu: boolean };
const COUNTRY_BY_ISO = new Map((geo as unknown as { features: { properties: CountryProps }[] }).features.filter((f) => f.properties.iso2 && f.properties.iso2 !== '-99').map((f) => [f.properties.iso2, f.properties]));
const KIND_LABEL: Record<Place['kind'], string> = { country: 'Country', region: 'Region', municipality: 'Municipality', eu: 'EU institutions', site: 'Site' };

export default function MapPage() {
  const [params, setParams] = useSearchParams();
  const ranking = useRanking();
  const savedPlaces = useApp((s) => s.savedPlaces);
  const toggleSavedPlace = useApp((s) => s.toggleSavedPlace);
  const comparisons = useApp((s) => s.comparisons);
  const addComparison = useApp((s) => s.addComparison);
  const removeComparison = useApp((s) => s.removeComparison);

  // Background tiles come from a third-party server that can refuse requests (HTTP 403), notably from pages opened from disk.
  // So they are opt-in there. The country shapes alone are enough to select, filter and compare.
  const [tiles, setTiles] = useState(() => typeof location !== 'undefined' && location.protocol !== 'file:');
  const [tileFailed, setTileFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('');
  const [level, setLevel] = useState<Level | ''>('');
  const [method, setMethod] = useState('');
  const [data, setData] = useState('');
  const [actor, setActor] = useState('');
  const [minFeas, setMinFeas] = useState('');
  const [cmpA, setCmpA] = useState('');
  const [cmpB, setCmpB] = useState('');

  const topicParam = params.get('topic');
  const selectedId = params.get('place');
  const selected = selectedId ? placeById(selectedId) : undefined;
  const genericIso = selectedId?.startsWith('iso:') ? selectedId.slice(4) : null;
  const generic = genericIso ? COUNTRY_BY_ISO.get(genericIso) : undefined;
  const scoreOf = useMemo(() => new Map(ranking.map((r) => [r.topic.id, r.score])), [ranking]);

  const topicOk = (t: (typeof TOPICS)[number]) =>
    (!topicParam || t.id === topicParam) && (!theme || t.themes[theme] >= 0.5) && (!level || t.levels.includes(level)) &&
    (!method || t.primaryMethod === method || t.secondaryMethods.includes(method)) &&
    (!minFeas || ((t.criteria.data?.score ?? 3) + (t.criteria.scope?.score ?? 3) + (t.criteria.evidence?.score ?? 3)) / 3 >= Number(minFeas));

  const filtersActive = !!(topicParam || theme || level || method || minFeas);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const a = actor.trim().toLowerCase();
    return PLACES.filter((p) => {
      if (q && !`${p.name} ${p.issues.join(' ')}`.toLowerCase().includes(q)) return false;
      if (data && p.dataRichness !== data) return false;
      if (a && !p.actors.join(' ').toLowerCase().includes(a)) return false;
      if (filtersActive && !TOPICS.some((t) => t.placeIds.includes(p.id) && topicOk(t))) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, data, actor, filtersActive, topicParam, theme, level, method, minFeas]);
  const visibleIds = new Set(visible.map((p) => p.id));

  const select = (id: string | null) => { const p = new URLSearchParams(params); if (id) p.set('place', id); else p.delete('place'); setParams(p, { replace: true }); };

  const countryStyle = (f?: Feature): PathOptions => {
    const iso = (f?.properties as { iso2?: string })?.iso2;
    const p = iso ? PLACE_BY_ISO.get(iso) : undefined;
    const vis = p && visibleIds.has(p.id);
    const sel = (p && p.id === selectedId) || (!!iso && selectedId === `iso:${iso}`);
    return { weight: sel ? 2.5 : 0.7, color: sel ? '#a23b2a' : '#8a8178', fillColor: vis ? '#a23b2a' : '#8a8178', fillOpacity: sel ? 0.5 : vis ? 0.38 : tiles ? 0.06 : 0.22 };
  };

  return (
    <div>
      <PageHeader eyebrow="Module D · Map" title="Places, institutions and the topics linked to them">
        Choose a place to see its policy issues, institutions, official datasets, linked thesis topics and possible employers. Filters use the same topic data as the explorer.
      </PageHeader>
      <Notice tone="warn" title="Coverage is incomplete by design">
        {PLACES.length} places have curated notes. Every country on the map is clickable, but countries without curated notes only get search links. A place without notes is not a place without migration policy. The contextual notes are written from background knowledge and are <strong>unverified</strong>: follow the source links. The app holds no migration flows, scores or rankings, because none were verified.
      </Notice>

      <form className="card my-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4" role="search" aria-label="Map filters" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1"><label htmlFor="msearch" className="block small font-medium">Search places or issues</label><input id="msearch" className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. Barcelona, minors, border" /></div>
        <SelectField label="Policy theme" value={theme} onChange={setTheme} options={[{ value: '', label: 'Any theme' }, ...THEMES.map((t) => ({ value: t.id, label: t.label }))]} />
        <SelectField label="Policy level" value={level} onChange={(v) => setLevel(v as Level | '')} options={[{ value: '', label: 'Any level' }, { value: 'local', label: 'Local' }, { value: 'regional', label: 'Regional' }, { value: 'national', label: 'National' }, { value: 'eu', label: 'EU' }, { value: 'international', label: 'International' }]} />
        <SelectField label="Research method" value={method} onChange={setMethod} options={[{ value: '', label: 'Any method' }, ...METHODS.map((m) => ({ value: m.id, label: m.label }))]} />
        <div className="space-y-1"><label htmlFor="mactor" className="block small font-medium">Institutional actor</label><input id="mactor" className="field" value={actor} onChange={(e) => setActor(e.target.value)} placeholder="e.g. Generalitat, UNHCR" /></div>
        <SelectField label="Data availability" value={data} onChange={setData} options={[{ value: '', label: 'Any' }, { value: 'rich', label: 'Rich' }, { value: 'moderate', label: 'Moderate' }, { value: 'limited', label: 'Limited' }]} />
        <SelectField label="Topic feasibility (data, scope, evidence)" value={minFeas} onChange={setMinFeas} options={[{ value: '', label: 'Any' }, { value: '3', label: 'At least 3 / 5' }, { value: '4', label: 'At least 4 / 5' }]} />
        <div className="flex items-end gap-2">
          <button type="button" className="btn" onClick={() => { setSearch(''); setTheme(''); setLevel(''); setMethod(''); setData(''); setActor(''); setMinFeas(''); const p = new URLSearchParams(params); p.delete('topic'); setParams(p, { replace: true }); }}>Clear filters</button>
        </div>
      </form>
      {topicParam && <p className="mb-3 small">Showing places linked to <strong>{TOPICS.find((t) => t.id === topicParam)?.title}</strong>.</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div>
          <div className="relative h-[28rem] overflow-hidden rounded-[var(--radius-card)] border border-rule md:h-[34rem]" role="region" aria-label="Interactive map. The list below the map offers the same places with keyboard access.">
            <MapContainer center={[40, 8]} zoom={3} minZoom={2} scrollWheelZoom style={{ height: '100%', width: '100%' }} worldCopyJump>
              {tiles && (
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={12}
                  eventHandlers={{ tileerror: (e: TileErrorEvent) => { void e; setTileFailed(true); setTiles(false); } }} />
              )}
              <GeoJSON key={`${selectedId}-${visible.length}-${filtersActive}-${tiles}`} data={geo as never} style={countryStyle as never}
                onEachFeature={(f, layer) => { const iso = (f.properties as { iso2?: string }).iso2; const p = iso ? PLACE_BY_ISO.get(iso) : undefined; if (iso && iso !== '-99') layer.on('click', () => select(p ? p.id : `iso:${iso}`)); }} />
              {visible.filter((p) => p.kind !== 'country' || !p.iso2).map((p) => (
                <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={p.id === selectedId ? 11 : p.kind === 'municipality' || p.kind === 'site' ? 6 : 8}
                  pathOptions={{ color: '#a23b2a', fillColor: savedPlaces.includes(p.id) ? '#c9a227' : '#a23b2a', fillOpacity: 0.85, weight: p.id === selectedId ? 3 : 1 }}
                  eventHandlers={{ click: () => select(p.id) }}>
                  <MapTooltip>{p.name}</MapTooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          <Legend visible={visible.length} tiles={tiles} tileFailed={tileFailed} onTiles={(v) => { setTileFailed(false); setTiles(v); }} />

          <section className="mt-6" aria-labelledby="plist-h">
            <h2 id="plist-h">Places (keyboard-accessible list)</h2>
            {visible.length === 0 ? <div className="mt-3"><Empty title="No places match" action={<button className="btn" onClick={() => { setSearch(''); setTheme(''); setLevel(''); setMethod(''); setData(''); setActor(''); setMinFeas(''); }}>Clear filters</button>}>Try removing the method or feasibility filter.</Empty></div> : (
              <ul className="mt-3 flex flex-wrap gap-2">{visible.map((p) => <li key={p.id}><button className="chip" aria-pressed={p.id === selectedId} onClick={() => select(p.id)}>{savedPlaces.includes(p.id) && <Star className="h-3 w-3" aria-hidden />}{p.name}</button></li>)}</ul>
            )}
          </section>
        </div>

        <aside aria-label="Place details" className="space-y-4">
          {generic ? <GenericCountry name={generic.name} eu={generic.eu} /> : !selected ? <Empty title="Select a place">Click any country or marker, or choose one from the list. Countries with curated notes show issues, datasets and linked topics; every other country shows verified search links only.</Empty> : <PlaceCard place={selected} scoreOf={scoreOf} saved={savedPlaces.includes(selected.id)} onSave={() => toggleSavedPlace(selected.id)} onCompare={() => { setCmpA(selected.id); document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' }); }} />}
          {savedPlaces.length > 0 && (
            <div className="card p-4 small"><h3>Saved places</h3><ul className="mt-2 flex flex-wrap gap-2">{savedPlaces.map((id) => <li key={id}><button className="chip" onClick={() => select(id)}>{placeById(id)?.name}</button></li>)}</ul></div>
          )}
        </aside>
      </div>

      <section id="compare" className="mt-10 card p-5" aria-labelledby="cmp-h">
        <h2 id="cmp-h">Compare two places</h2>
        <p className="mt-1 small text-muted">A descriptive side-by-side of what this app holds. It does not score, rank or explain differences: similarities and differences here are not evidence of cause.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <SelectField label="Place A" value={cmpA} onChange={setCmpA} options={[{ value: '', label: 'Choose…' }, ...PLACES.map((p) => ({ value: p.id, label: p.name }))]} />
          <SelectField label="Place B" value={cmpB} onChange={setCmpB} options={[{ value: '', label: 'Choose…' }, ...PLACES.map((p) => ({ value: p.id, label: p.name }))]} />
          <div className="flex items-end"><button className="btn" disabled={!cmpA || !cmpB || cmpA === cmpB} onClick={() => addComparison(cmpA, cmpB)}><Plus className="h-4 w-4" aria-hidden /> Save this comparison</button></div>
        </div>
        {cmpA && cmpB && cmpA !== cmpB && <Comparison a={placeById(cmpA)!} b={placeById(cmpB)!} />}
        {comparisons.length > 0 && (
          <div className="mt-5 rule-t pt-4"><h3>Saved comparisons</h3><ul className="mt-2 space-y-1 small">{comparisons.map((c) => <li key={c.id} className="flex items-center gap-2"><button className="chip" onClick={() => { setCmpA(c.a); setCmpB(c.b); }}>{placeById(c.a)?.name} vs {placeById(c.b)?.name}</button><button className="btn btn-sm btn-ghost" onClick={() => removeComparison(c.id)} aria-label={`Remove comparison ${placeById(c.a)?.name} versus ${placeById(c.b)?.name}`}>Remove</button></li>)}</ul></div>
        )}
      </section>
    </div>
  );
}

function PlaceCard({ place, scoreOf, saved, onSave, onCompare }: { place: Place; scoreOf: Map<string, number>; saved: boolean; onSave: () => void; onCompare: () => void }) {
  const topics = TOPICS.filter((t) => t.placeIds.includes(place.id)).sort((a, b) => (scoreOf.get(b.id) ?? 0) - (scoreOf.get(a.id) ?? 0));
  const parent = place.parentId ? placeById(place.parentId) : undefined;
  const children = PLACES.filter((p) => p.parentId === place.id);
  const roleHits = ROLES.filter((r) => topics.some((t) => t.careers.some((c) => c.roleId === r.id && c.strength >= 2))).slice(0, 4);
  return (
    <div className="card p-4 space-y-4">
      <div>
        <p className="eyebrow">{KIND_LABEL[place.kind]}{parent ? ` · in ${parent.name}` : ''}</p>
        <h2 className="flex items-center gap-2"><MapPin className="h-5 w-5 text-accent" aria-hidden />{place.name}</h2>
        <div className="mt-2 flex flex-wrap gap-2"><button className="btn btn-sm" aria-pressed={saved} onClick={onSave}><Star className="h-4 w-4" aria-hidden />{saved ? 'Saved' : 'Save place'}</button><button className="btn btn-sm" onClick={onCompare}>Compare…</button></div>
      </div>
      <p className="small">{place.governanceNote} <EvidenceBadge status="unverified" label="Note unverified" /></p>
      {(parent || children.length > 0) && <p className="small text-muted">Multilevel link: {parent && <>part of <strong>{parent.name}</strong>. </>}{children.length > 0 && <>contains {children.map((c) => c.name).join(', ')}.</>} (Curated relationship, not a complete hierarchy.)</p>}
      <Block title="Policy issues"><ul className="list-disc pl-5">{place.issues.map((i) => <li key={i}>{i}</li>)}</ul></Block>
      <Block title="Institutional actors"><ul className="list-disc pl-5">{place.actors.map((i) => <li key={i}>{i}</li>)}</ul></Block>
      <Block title={`Official datasets and sources (data availability: ${place.dataRichness})`}>
        <ul className="space-y-1">{place.sourceIds.map((id) => { const s = sourceById(id); if (!s) return null; const li = linkInfo(s.url); return <li key={id}><a href={s.url} target="_blank" rel="noreferrer">{s.name} <ExternalLink className="inline h-3 w-3" aria-hidden /></a> {li?.ok && <span className="badge badge-ok">checked</span>}{li && !li.ok && <span className="badge badge-warn">unchecked</span>}</li>; })}</ul>
      </Block>
      <Block title={`Linked thesis topics (${topics.length})`}>
        {topics.length === 0 ? <p className="text-muted">No topic is linked to this place yet.</p> : (
          <ul className="space-y-3">{topics.map((t) => <li key={t.id}><Link to={`/topics/${t.id}`} className="font-medium">{t.title}</Link><p className="text-muted">{t.rq}</p><p className="text-muted text-xs">{literatureCount(t.id)} papers · {precedentCount(t.id)} past theses · fit {Math.round((scoreOf.get(t.id) ?? 0) * 100)}% <EvidenceBadge status="hypothesis" label="Generated question" /></p></li>)}</ul>
        )}
      </Block>
      <Block title="Possible employers and institutions"><ul className="list-disc pl-5">{place.employers.map((e) => <li key={e}>{e}</li>)}</ul>{roleHits.length > 0 && <p className="mt-2 text-muted">Related role families: {roleHits.map((r) => r.label).join(', ')}. No vacancies are listed: check each employer’s own careers page.</p>}</Block>
    </div>
  );
}
function Block({ title, children }: { title: string; children: React.ReactNode }) { return <section className="small"><h3 className="mb-1">{title}</h3>{children}</section>; }

function Comparison({ a, b }: { a: Place; b: Place }) {
  const shared = (x: string[], y: string[]) => x.filter((v) => y.includes(v));
  const rows: [string, string, string][] = [
    ['Type', KIND_LABEL[a.kind], KIND_LABEL[b.kind]],
    ['Policy levels', a.levels.join(', '), b.levels.join(', ')],
    ['Data availability (judgment)', a.dataRichness, b.dataRichness],
    ['Policy issues', a.issues.join('; '), b.issues.join('; ')],
    ['Institutional actors', a.actors.join('; '), b.actors.join('; ')],
    ['Context note (unverified)', a.governanceNote, b.governanceNote],
    ['Linked topics', TOPICS.filter((t) => t.placeIds.includes(a.id)).length + '', TOPICS.filter((t) => t.placeIds.includes(b.id)).length + ''],
  ];
  const sharedSources = shared(a.sourceIds, b.sourceIds).map((id) => sourceById(id)?.name).filter(Boolean);
  const sharedTopics = TOPICS.filter((t) => t.placeIds.includes(a.id) && t.placeIds.includes(b.id));
  return (
    <div className="mt-5">
      <div className="overflow-x-auto"><table className="w-full small"><caption className="sr-only">Descriptive comparison of {a.name} and {b.name}</caption>
        <thead><tr className="text-left"><th scope="col" className="py-2 pr-3 font-medium text-muted">Feature</th><th scope="col" className="py-2 pr-3">{a.name}</th><th scope="col" className="py-2">{b.name}</th></tr></thead>
        <tbody>{rows.map(([k, x, y]) => <tr key={k} className="rule-t align-top"><th scope="row" className="py-2 pr-3 text-left font-medium text-muted">{k}</th><td className="py-2 pr-3">{x}</td><td className="py-2">{y}</td></tr>)}</tbody></table></div>
      <p className="mt-3 small"><strong>Datasets both have:</strong> {sharedSources.length ? sharedSources.join(', ') : 'none listed'}.</p>
      <p className="small"><strong>Topics that involve both:</strong> {sharedTopics.length ? sharedTopics.map((t) => <Link key={t.id} to={`/topics/${t.id}`} className="mr-2">{t.title.split(':')[0]}</Link>) : 'none yet. A comparison of these two would be a new design.'}</p>
      <Notice>Descriptive only. Whether differences in policy or outcomes are <em>caused</em> by anything here is a research question, not something this table shows.</Notice>
    </div>
  );
}

function GenericCountry({ name, eu }: { name: string; eu: boolean }) {
  const q = `${name} migration policy`;
  const links = [
    { label: 'OpenAlex: research on this country', url: `https://openalex.org/works?search=${encodeURIComponent(q)}` },
    { label: 'Google Scholar', url: `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}` },
    { label: 'UNHCR refugee statistics (choose the country there)', url: 'https://www.unhcr.org/refugee-statistics/' },
    { label: 'IOM Migration Data Portal / GMDAC', url: 'https://gmdac.iom.int/' },
    { label: 'OECD migration', url: 'https://www.oecd.org/en/topics/migration.html' },
    { label: 'MIPEX integration policy index (if the country is covered)', url: 'https://www.mipex.eu/' },
    ...(eu ? [{ label: 'Eurostat migration and asylum', url: 'https://ec.europa.eu/eurostat/web/migration-asylum' }, { label: 'EU Agency for Asylum', url: 'https://euaa.europa.eu/' }] : []),
  ];
  return (
    <div className="card space-y-4 p-4">
      <div><p className="eyebrow">Country{eu ? ' · EU member state' : ''}</p><h2 className="flex items-center gap-2"><MapPin className="h-5 w-5 text-accent" aria-hidden />{name}</h2></div>
      <Notice tone="warn" title="No curated notes for this country">This app holds no policy notes, institutions or topics for {name}, and shows no figures, because none were verified. The links below go to open sources where you can look yourself.</Notice>
      <section className="small"><h3 className="mb-1">Start here</h3><ul className="space-y-1">{links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label} <ExternalLink className="inline h-3 w-3" aria-hidden /></a></li>)}</ul></section>
      <section className="small"><h3 className="mb-1">Look for past theses on this country</h3><ul className="flex flex-wrap gap-2">{manualSearchLinks(q).slice(0, 5).map((l) => <li key={l.url}><a className="chip no-underline" href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>)}</ul></section>
      <p className="small text-muted">Want this country covered? Add it to <code>src/data/places.ts</code> with sources.</p>
    </div>
  );
}

function Legend({ visible, tiles, tileFailed, onTiles }: { visible: number; tiles: boolean; tileFailed: boolean; onTiles: (v: boolean) => void }) {
  const curatedCountries = PLACES.filter((p) => p.kind === 'country').length;
  const others = PLACES.length - curatedCountries;
  return (
    <section className="card mt-3 p-4 small" aria-labelledby="legend-h">
      <h2 id="legend-h" className="!text-base">How to read the map</h2>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        <li className="flex gap-3"><span aria-hidden className="mt-1 h-4 w-6 shrink-0 rounded-sm border border-accent bg-accent/40" /><span><strong>Red countries ({curatedCountries}) have curated content.</strong> Clicking one gives: policy issues, institutional actors, official datasets with link status, linked thesis topics (with your profile fit and past-thesis counts), possible employers, and it can be compared with another curated place. Notes are unverified background knowledge; the sources are real links.</span></li>
        <li className="flex gap-3"><span aria-hidden className="mt-1 h-4 w-6 shrink-0 rounded-sm border border-rule bg-muted/30" /><span><strong>Grey countries have no curated content.</strong> You can still click them: you get the name and search links only (OpenAlex, Google Scholar, UNHCR, IOM, OECD, MIPEX, Eurostat for EU states, repository searches for theses). No policy notes, topics or figures, because none were verified.</span></li>
        <li className="flex gap-3"><span aria-hidden className="mt-1 h-4 w-4 shrink-0 rounded-full border border-accent bg-accent" /><span><strong>Dots ({others}) are curated regions, cities and sites</strong> (Catalonia, Barcelona, Manresa, Lampedusa, EU institutions…) with the same content as red countries. Gold dots are places you saved.</span></li>
        <li className="flex gap-3"><span aria-hidden className="mt-1 h-4 w-6 shrink-0 rounded-sm border-2 border-accent" /><span><strong>Active filters</strong> keep red only on places linked to topics that match them; everything else fades. Now showing {visible} of {PLACES.length} curated places.</span></li>
      </ul>
      <div className="mt-4 rule-t pt-3">
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={tiles} onChange={(e) => onTiles(e.target.checked)} /><span><span className="font-medium">Show background map tiles (needs internet)</span><br /><span className="text-muted">Street and terrain detail from OpenStreetMap. Off by default in the shared file because the provider can refuse requests from pages opened from disk (HTTP 403). The map works without it.</span></span></label>
        <p className="mt-2 text-muted">Country boundaries: Natural Earth (public domain){tiles ? '. Tiles: © OpenStreetMap contributors' : ''}.</p>
        {tileFailed && <p role="status" className="mt-2 rounded-md bg-warn-soft p-2">The tile provider refused or could not be reached (for example a 403 “access blocked”), so tiles were switched off. Countries and places still work normally.</p>}
      </div>
    </section>
  );
}
