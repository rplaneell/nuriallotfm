import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Compass, FlaskConical, LayoutList, Map as MapIcon, SlidersHorizontal, Search } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useState, type ReactNode } from 'react';
import { useApp, type PersistedState } from '@/store/useApp';
import { useProfile, useRanking, useTestProgress, useUiFlags } from '@/store/derived';
import { nextAction } from '@/lib/next';
import { SCENARIOS } from '@/data/questions';
import { METHODS, THEMES } from '@/data/taxonomy';
import { ROLES } from '@/data/careers';
import { TOPICS } from '@/data/topics';
import { PLACES } from '@/data/places';
import { Disclosure, Meter } from '@/components/ui';
import { MODE_INFO } from '@/data/modes';

export default function Home() {
  const flags = useUiFlags();
  const { has, primary, everything, brief, focused } = flags;
  const state = useApp();
  const prog = useTestProgress();
  const profile = useProfile();
  const ranking = useRanking();
  const next = nextAction(state as PersistedState);
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const personalised = profile.answered >= 6;

  const tiles = [
    { to: '/test', icon: Compass, title: 'Orientation test', text: 'Discover interests, methods and professional direction.', meta: prog.done ? `${prog.pct}% done` : 'Not started' },
    { to: '/explore', icon: SlidersHorizontal, title: 'How do you want to explore?', text: 'Adapt the interface to the way you work.', meta: state.ui.completed ? 'Set' : 'Not set' },
    { to: '/topics', icon: LayoutList, title: 'Topic explorer', text: `${TOPICS.length} structured topic profiles with literature and past theses.`, meta: `${state.saved.length} saved` },
    { to: '/map', icon: MapIcon, title: 'World map', text: 'Places, institutions, datasets and linked topics.', meta: `${PLACES.length} places` },
    { to: '/careers', icon: Briefcase, title: 'Career explorer', text: 'From roles to topics, and from topics to roles.', meta: `${state.pinnedRoles.length} pinned` },
    { to: '/dashboard', icon: FlaskConical, title: 'Shortlist and decision', text: 'Compare, weigh and test your priorities.', meta: `${state.saved.length} topics` },
  ];
  const orderedTiles = primary === 'visual' ? [tiles[3], tiles[2], tiles[4], tiles[0], tiles[1], tiles[5]] : primary === 'career' ? [tiles[4], tiles[2], tiles[0], tiles[3], tiles[1], tiles[5]] : primary === 'research' ? [tiles[2], tiles[3], tiles[0], tiles[4], tiles[1], tiles[5]] : tiles;

  const chartData = ranking.slice(0, 8).map((r) => ({ name: r.topic.title.split(':')[0].slice(0, 34), pct: Math.round(r.score * 100) }));

  const nextCard = (
    <section aria-labelledby="next-h" className="callout p-6">
      <p className="eyebrow mb-1">Step {next.step} of {next.of} · your next step</p>
      <h2 id="next-h">{next.title}</h2>
      <p className="mt-2 text-muted prose-calm">{next.why}</p>
      <Link to={next.to} className="btn btn-primary mt-4">{next.cta} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
    </section>
  );

  const blocks: ReactNode[] = [];
  if (has('research')) blocks.push(
    <section key="research" aria-labelledby="r-h" className="card p-6">
      <h2 id="r-h">Search the topics and evidence</h2>
      <form className="mt-3 flex gap-2" role="search" onSubmit={(e) => { e.preventDefault(); nav(`/topics?q=${encodeURIComponent(q)}`); }}>
        <label htmlFor="home-search" className="sr-only">Search topics</label>
        <input id="home-search" className="field" placeholder="e.g. asylum reception, municipalities, discretion…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary" type="submit"><Search className="h-4 w-4" aria-hidden /> Search</button>
      </form>
      <p className="mt-3 small text-muted">Every topic lists verified literature metadata, past master’s theses from comparable programmes, and official sources. <Link to="/sources">See all sources</Link></p>
    </section>,
  );
  if (has('policy')) blocks.push(
    <section key="policy" aria-labelledby="p-h" className="card p-6">
      <h2 id="p-h">Start from a policy problem</h2>
      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {SCENARIOS.slice(0, focused ? 4 : 8).map((s) => {
          const theme = Object.entries(s.w).filter(([k]) => k.startsWith('t.')).sort((a, b) => b[1] - a[1])[0]?.[0].slice(2);
          return <li key={s.id}><Link to={`/topics?theme=${theme}`} className="block rounded-md border border-rule p-3 text-ink no-underline hover:bg-sunken">{s.text}<span className="mt-1 block small text-accent">Explore research questions →</span></Link></li>;
        })}
      </ul>
    </section>,
  );
  if (has('method')) blocks.push(
    <section key="method" aria-labelledby="m-h" className="card p-6">
      <h2 id="m-h">Start from a method</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {METHODS.map((m) => <li key={m.id}><Link className="chip no-underline" to={`/topics?method=${m.id}`}>{m.label}</Link></li>)}
      </ul>
      <p className="mt-3 small text-muted">Each method shows what it can and cannot support, and what it takes to learn.</p>
    </section>,
  );
  if (has('career')) blocks.push(
    <section key="career" aria-labelledby="c-h" className="card p-6">
      <h2 id="c-h">Start from a role</h2>
      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {[...ROLES].sort((a) => (state.pinnedRoles.includes(a.id) ? -1 : 1)).slice(0, focused ? 4 : 8).map((r) => (
          <li key={r.id}><Link to={`/careers?role=${r.id}`} className="block rounded-md border border-rule p-3 text-ink no-underline hover:bg-sunken"><span className="font-medium">{r.label}</span><span className="block small text-muted">{r.summary}</span></Link></li>
        ))}
      </ul>
    </section>,
  );
  if (has('visual')) blocks.push(
    <section key="visual" aria-labelledby="v-h" className="card p-6">
      <div className="flex items-baseline justify-between gap-3"><h2 id="v-h">{personalised ? 'How the topics match your profile' : 'Topics (neutral until you take the test)'}</h2><Link to="/map">Open the map</Link></div>
      <div className="mt-4 h-72" role="img" aria-label="Bar chart of topic match percentages">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} stroke="var(--rule)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={170} tick={{ fill: 'var(--ink)', fontSize: 12 }} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--rule)', color: 'var(--ink)' }} />
            <Bar dataKey="pct" fill="var(--data)" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="small text-muted">Match percentages combine your interests, ways of thinking, methods, scope and career direction. They are not a measure of quality.</p>
    </section>,
  );

  const isGuided = has('guided') && !everything;
  return (
    <div className="space-y-8">
      <section className="py-4">
        <p className="eyebrow mb-3">Master in Governance · Migration track · UPF</p>
        <h1 className="statement max-w-3xl">Choose a thesis you can finish, defend, and build a career on.</h1>
        <p className="mt-4 text-muted prose-calm">A research notebook for choosing a migration policy thesis topic. It helps you discover what you want to investigate, find the evidence and past work that exists, test whether a topic is feasible, and see where it could lead. {!brief && 'It never decides for you: it shows reasons, trade-offs and uncertainty.'}</p>
        <p className="mt-2 small text-muted">Interface mode: {everything ? 'complete overview' : flags.ui.modes.map((m) => MODE_INFO[m].label).join(' + ')}. <Link to="/explore">Change</Link></p>
      </section>

      {(isGuided || primary === 'guided' || everything) && nextCard}

      {!isGuided && !everything && (
        <p className="small"><span className="font-medium">Next step:</span> {next.title}. <Link to={next.to}>{next.cta}</Link></p>
      )}

      {blocks.length > 0 && <div className="grid gap-6">{blocks}</div>}

      <section aria-labelledby="mod-h">
        <h2 id="mod-h" className="mb-3">{isGuided ? 'All tools' : 'Modules'}</h2>
        {isGuided && !brief ? (
          <Disclosure title="Show all tools" defaultOpen={false}><Tiles tiles={orderedTiles} /></Disclosure>
        ) : <Tiles tiles={orderedTiles} />}
      </section>

      {personalised && !brief && (
        <section aria-labelledby="top-h" className="card p-6">
          <h2 id="top-h">Your current top three</h2>
          <ol className="mt-3 space-y-3">
            {ranking.filter((r) => !r.muted).slice(0, 3).map((r, i) => (
              <li key={r.topic.id} className="grid grid-cols-[auto_1fr_8rem] items-center gap-3">
                <span className="tabular-nums text-muted">{i + 1}</span>
                <Link to={`/topics/${r.topic.id}`}>{r.topic.title}</Link>
                <Meter value={r.score * 100} max={100} label={`Match for ${r.topic.title}`} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {!personalised && (
        <p className="small text-muted">Themes covered: {THEMES.slice(0, 8).map((t) => t.label).join(' · ')} … and more once you start.</p>
      )}
    </div>
  );
}

function Tiles({ tiles }: { tiles: { to: string; icon: typeof Compass; title: string; text: string; meta: string }[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((t) => (
        <li key={t.to}>
          <Link to={t.to} className="tile">
            <span className="tile-title">{t.title}</span>
            <span className="small text-muted">{t.text}</span>
            <span className="small mt-auto pt-2 font-medium text-ink">{t.meta}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
