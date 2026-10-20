import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pin, PinOff, Pencil, RotateCcw } from 'lucide-react';
import { useApp } from '@/store/useApp';
import { useProfile, useRanking, useUiFlags } from '@/store/derived';
import { BIPOLAR_LABELS, DIM_LABELS, QUESTIONS } from '@/data/questions';
import { METHODS, methodById } from '@/data/taxonomy';
import { ROLES } from '@/data/careers';
import { dimScore, findTensions, findUncertainties, topDims } from '@/lib/profile';
import { Disclosure, Empty, Meter, Notice, PageHeader, Slider, StrengthBadge } from '@/components/ui';
import type { DimensionResult, Profile } from '@/types';

export default function ProfilePage() {
  const profile = useProfile();
  const ranking = useRanking();
  const { deep, brief } = useUiFlags();
  const pinned = useApp((s) => s.pinnedRoles);
  const togglePinned = useApp((s) => s.togglePinnedRole);
  const answers = useApp((s) => s.answers);
  const [editing, setEditing] = useState(false);

  if (profile.answered < 6) {
    return (
      <div>
        <PageHeader eyebrow="Your profile" title="Your profile will appear here" />
        <Empty title="Not enough answers yet" action={<Link className="btn btn-primary" to="/test">Go to the orientation test</Link>}>
          Answer at least six questions. Skipped questions are fine; they just give less to work with.
        </Empty>
      </div>
    );
  }

  const themes = topDims(profile, 't.', 7);
  const approaches = topDims(profile, 'a.', 5);
  const envs = topDims(profile, 'c.', 5);
  const tensions = findTensions(profile);
  const uncertain = findUncertainties(profile);
  const directions = ranking.filter((r) => !r.muted).slice(0, 5);
  const scenarioMotives = QUESTIONS.filter((q) => q.id.startsWith('q1-why-')).map((q) => {
    const a = answers[q.id];
    return a && typeof a.value === 'string' ? { q, motive: q.options?.find((o) => o.id === a.value)?.label } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <div>
      <PageHeader eyebrow="Your profile" title="What the answers suggest">
        A summary of {profile.answered} answers ({profile.skipped} skipped, {profile.unsure} unsure). It describes your stated preferences. It does not predict academic or career success, and it is not a personality type.
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button className="btn" aria-pressed={editing} onClick={() => setEditing(!editing)}><Pencil className="h-4 w-4" aria-hidden /> {editing ? 'Done editing' : 'Edit my profile'}</button>
        <Link className="btn" to="/test">Revisit answers</Link>
        <Link className="btn btn-primary" to="/topics">See topics matched to this profile</Link>
      </div>
      {editing && <div className="mb-6"><Notice title="Editing">Move a slider to override a computed score. Your value replaces the computed one and is labelled “Set by you”. Use the reset arrow to go back to the computed value.</Notice></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Strongest substantive interests" note="Themes you chose, ranked, and how often your answers pointed to them.">
          <DimList dims={themes} profile={profile} editing={editing} empty="No theme stands out yet." />
        </Section>
        <Section title="Preferred ways of thinking" note="The kind of question you gravitate towards.">
          <DimList dims={approaches} profile={profile} editing={editing} empty="No approach stands out yet." />
        </Section>
      </div>

      <Section title="Policy problems that engaged you most" note="Situations you picked, and what drew you to each. The same situation can attract different people for different reasons.">
        {scenarioMotives.length ? (
          <ul className="space-y-3">{scenarioMotives.map((x) => <li key={x.q.id}><p>{x.q.prompt.split('“')[1]?.split('”')[0]}</p><p className="small text-muted">What drew you: {x.motive}</p></li>)}</ul>
        ) : <p className="small text-muted">You did not pick scenarios, or skipped the follow-ups.</p>}
      </Section>

      <Section title="Methods: what you can do, enjoy and want to learn" note="Existing skill and interest are different things. Wanting to learn is a good reason to include a method, if the time is planned.">
        <MethodTable profile={profile} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Scope and style" note="Where you sit between the poles. Edit by moving the slider.">
          <ul className="space-y-5">
            {Object.entries(BIPOLAR_LABELS).map(([k, lab]) => <BipolarRow key={k} dim={k} lab={lab} profile={profile} editing={editing} />)}
          </ul>
          <ScopeSummary profile={profile} />
        </Section>
        <Section title="Professional directions" note="Work environments you rated, with illustrative role families. These are possibilities, not guaranteed outcomes.">
          <DimList dims={envs} profile={profile} editing={editing} empty="No environment stands out yet." />
          <div className="mt-4 space-y-2">
            <p className="small font-medium">Role families in those environments</p>
            <ul className="space-y-1">
              {ROLES.filter((r) => r.environments.some((e) => dimScore(profile, `c.${e}`) >= 0.3)).slice(0, 7).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 small">
                  <span>{r.label}</span>
                  <button type="button" className="btn btn-sm" aria-pressed={pinned.includes(r.id)} onClick={() => togglePinned(r.id)}>{pinned.includes(r.id) ? <><PinOff className="h-3.5 w-3.5" aria-hidden /> Unpin</> : <><Pin className="h-3.5 w-3.5" aria-hidden /> Pin as target</>}</button>
                </li>
              ))}
            </ul>
            <p className="small text-muted">Pinned roles raise topics that support them. <Link to="/careers">Explore careers</Link></p>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Preference conflicts to think about" note="Places where two preferences pull in different directions. Each is a prompt, not a verdict.">
          {tensions.length ? <ul className="space-y-3">{tensions.map((t) => <li key={t.id}><p className="font-medium">{t.title}</p><p className="small text-muted">{t.detail}</p></li>)}</ul> : <p className="small text-muted">No clear conflicts found with the answers so far.</p>}
        </Section>
        <Section title="Uncertainties worth exploring" note="What the profile does not yet know.">
          {uncertain.length ? <ul className="list-disc space-y-1 pl-5 small">{uncertain.map((u, i) => <li key={i}>{u}</li>)}</ul> : <p className="small text-muted">No major gaps.</p>}
          {profile.openText.length > 0 && (
            <div className="mt-4"><p className="small font-medium">Your own words</p>{profile.openText.map((o) => <blockquote key={o.qid} className="mt-1 border-l-2 border-accent pl-3 small italic">{o.text}</blockquote>)}<p className="small text-muted mt-1">Worth bringing to a conversation with a supervisor.</p></div>
          )}
        </Section>
      </div>

      <Section title="Promising research directions" note="The topics that best match this profile today, and the answers behind each. Rankings change as you answer more and react to topics.">
        <ol className="space-y-4">
          {directions.slice(0, brief ? 3 : 5).map((r, i) => (
            <li key={r.topic.id} className="rule-t pt-4 first:border-0 first:pt-0">
              <div className="flex items-baseline justify-between gap-3"><Link className="font-medium" to={`/topics/${r.topic.id}`}>{i + 1}. {r.topic.title}</Link><span className="badge badge-data">{Math.round(r.score * 100)}% match</span></div>
              <ul className="mt-1 list-disc pl-5 small text-muted">{r.reasons.map((x, j) => <li key={j}>{x}</li>)}</ul>
              {deep && <p className="mt-1 small"><span className="badge badge-warn">Generated hypothesis</span> <span className="text-muted">This is a suggested research direction, not an established gap in the literature.</span></p>}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="card mb-6 p-5">
      <h2>{title}</h2>
      {note && <p className="mt-1 mb-4 small text-muted prose-calm">{note}</p>}
      {children}
    </section>
  );
}

function DimList({ dims, profile, editing, empty }: { dims: DimensionResult[]; profile: Profile; editing: boolean; empty: string }) {
  if (!dims.length) return <p className="small text-muted">{empty}</p>;
  return <ul className="space-y-4">{dims.map((d) => <DimRow key={d.id} d={profile.dims[d.id]} editing={editing} />)}</ul>;
}

function DimRow({ d, editing }: { d: DimensionResult; editing: boolean }) {
  const setOverride = useApp((s) => s.setOverride);
  const label = DIM_LABELS[d.id] ?? d.id;
  return (
    <li>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{label}</span>
        <span className="flex items-center gap-2"><StrengthBadge strength={d.strength} overridden={d.overridden} /><span className="tabular-nums small">{Math.round(d.score * 100)}</span></span>
      </div>
      <div className="mt-1"><Meter value={d.score * 100} max={100} label={label} /></div>
      {editing && (
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1"><Slider value={Math.round(d.score * 100)} onChange={(v) => setOverride(d.id, v / 100)} label={`Set your own score for ${label}`} /></div>
          {d.overridden && <button className="btn btn-sm btn-icon" aria-label={`Reset ${label} to computed value`} onClick={() => setOverride(d.id, null)}><RotateCcw className="h-4 w-4" aria-hidden /></button>}
        </div>
      )}
      {d.contributions.length > 0 && (
        <Disclosure title={<span className="small">Why? {d.contributions.length} answer{d.contributions.length > 1 ? 's' : ''}</span>}>
          <ul className="space-y-1 small text-muted">{d.contributions.slice(0, 8).map((c, i) => <li key={i}><span className="text-ink">“{c.label.slice(0, 90)}{c.label.length > 90 ? '…' : ''}”</span> ({c.weight > 0 ? '+' : ''}{c.weight.toFixed(2)})</li>)}</ul>
        </Disclosure>
      )}
    </li>
  );
}

function BipolarRow({ dim, lab, profile, editing }: { dim: string; lab: { name: string; low: string; high: string }; profile: Profile; editing: boolean }) {
  const setBi = useApp((s) => s.setBiOverride);
  const b = profile.bipolar[dim];
  const known = !!b && b.evidence > 0;
  const v = b?.value ?? 50;
  return (
    <li>
      <p className="font-medium">{lab.name} {b?.overridden && <span className="badge badge-accent ml-1">Set by you</span>} {!known && <span className="badge badge-muted ml-1">No answer yet</span>}</p>
      <div className="relative mt-2 h-2 rounded-full bg-sunken border border-rule" aria-hidden><span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-surface" style={{ left: `${v}%`, opacity: known ? 1 : 0.4 }} /></div>
      <div className="mt-1 flex justify-between small text-muted"><span>{lab.low}</span><span>{lab.high}</span></div>
      <span className="sr-only">{known ? `Position ${Math.round(v)} out of 100` : 'No answer yet'}</span>
      {editing && (
        <div className="mt-2 flex items-center gap-3"><div className="flex-1"><Slider value={Math.round(v)} onChange={(x) => setBi(dim, x)} label={`Set your own position for ${lab.name}`} /></div>{b?.overridden && <button className="btn btn-sm btn-icon" aria-label={`Reset ${lab.name}`} onClick={() => setBi(dim, null)}><RotateCcw className="h-4 w-4" aria-hidden /></button>}</div>
      )}
    </li>
  );
}

function ScopeSummary({ profile }: { profile: Profile }) {
  const lv = topDims(profile, 's.', 8, 0.2).filter((d) => ['s.local', 's.regional', 's.national', 's.eu', 's.intl'].includes(d.id));
  const ds = topDims(profile, 's.', 8, 0.2).filter((d) => !['s.local', 's.regional', 's.national', 's.eu', 's.intl'].includes(d.id));
  const rg = topDims(profile, 'r.', 4, 0.2);
  const lg = topDims(profile, 'l.', 5, 0.2);
  if (!lv.length && !ds.length && !rg.length && !lg.length) return null;
  return (
    <div className="mt-5 rule-t pt-4 small">
      {lv.length > 0 && <p><span className="font-medium">Levels: </span>{lv.map((d) => DIM_LABELS[d.id]).join(', ')}</p>}
      {rg.length > 0 && <p><span className="font-medium">World regions: </span>{rg.map((d) => DIM_LABELS[d.id]).join(', ')}</p>}
      {lg.length > 0 && <p><span className="font-medium">Documents you can read besides English: </span>{lg.map((d) => DIM_LABELS[d.id].replace(' documents', '')).join(', ')}</p>}
      {ds.length > 0 && <p><span className="font-medium">Design and question type: </span>{ds.map((d) => DIM_LABELS[d.id]).join(', ')}</p>}
      <p className="mt-2 text-muted">Local work gives access to concrete practice. EU and international work needs more legal background and often more travel. Comparison multiplies the reading per case.</p>
    </div>
  );
}

function MethodTable({ profile }: { profile: Profile }) {
  const rows = METHODS.map((m) => ({ m, int: dimScore(profile, `mi.${m.id}`), cap: dimScore(profile, `mc.${m.id}`), want: dimScore(profile, `mw.${m.id}`) }))
    .filter((r) => r.int > 0 || r.cap > 0 || r.want > 0).sort((a, b) => (b.int + b.want) - (a.int + a.want));
  if (!rows.length) return <p className="small text-muted">No method answers yet.</p>;
  const gaps = rows.filter((r) => (r.int > 0.3 || r.want > 0.3) && r.cap < 0.3 && r.m.technical >= 3);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full small">
          <caption className="sr-only">Method interest, existing skill and wish to learn</caption>
          <thead><tr className="text-left text-muted"><th scope="col" className="py-2 pr-4 font-medium">Method</th><th scope="col" className="px-2 font-medium">Interest</th><th scope="col" className="px-2 font-medium">Can do now</th><th scope="col" className="px-2 font-medium">Want to learn</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.m.id} className="rule-t"><th scope="row" className="py-2 pr-4 text-left font-normal">{r.m.label}</th>
                {[r.int, r.cap, r.want].map((v, i) => <td key={i} className="px-2">{v > 0 ? <span className="inline-flex items-center gap-1"><span className="inline-block h-2 rounded-full bg-data" style={{ width: `${Math.max(8, v * 56)}px` }} aria-hidden />{Math.round(v * 100)}</span> : <span className="text-muted">·</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {gaps.length > 0 && (
        <div className="mt-4 space-y-2">
          <Notice title="What it would take to learn these">
            <ul className="mt-1 list-disc pl-5">{gaps.map((g) => <li key={g.m.id}><strong>{methodById(g.m.id)?.label}:</strong> {g.m.learning}</li>)}</ul>
          </Notice>
        </div>
      )}
    </div>
  );
}

