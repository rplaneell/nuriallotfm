import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, Pin, PinOff } from 'lucide-react';
import { useApp } from '@/store/useApp';
import { useRanking } from '@/store/derived';
import { OUTPUTS, ROLES, roleById } from '@/data/careers';
import { TOPICS, topicById } from '@/data/topics';
import { methodById } from '@/data/taxonomy';
import { linkInfo } from '@/lib/evidence';
import { Notice, PageHeader, SelectField } from '@/components/ui';

export default function CareersPage() {
  const [params, setParams] = useSearchParams();
  const pinned = useApp((s) => s.pinnedRoles);
  const toggle = useApp((s) => s.togglePinnedRole);
  const ranking = useRanking();
  const roleId = params.get('role') ?? '';
  const fromTopic = params.get('topic') ?? '';
  const role = roleById(roleId);
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
  const score = useMemo(() => new Map(ranking.map((r) => [r.topic.id, r.score])), [ranking]);

  const topicsForRole = role ? TOPICS.map((t) => ({ t, link: t.careers.find((c) => c.roleId === role.id) })).filter((x) => x.link).sort((a, b) => b.link!.strength - a.link!.strength || (score.get(b.t.id) ?? 0) - (score.get(a.t.id) ?? 0)) : [];
  const topic = topicById(fromTopic);

  return (
    <div>
      <PageHeader eyebrow="Module E · Careers" title="From topics to roles, and back">
        Start from a role to see which thesis topics support it, or from a topic to see the roles it points to. These are illustrative role families, <strong>not</strong> guaranteed outcomes, and the app lists no vacancies because none were verified.
      </PageHeader>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <SelectField label="Start from a role" value={roleId} onChange={(v) => { const p = new URLSearchParams(); if (v) p.set('role', v); setParams(p, { replace: true }); }} options={[{ value: '', label: 'Choose a role family…' }, ...ROLES.map((r) => ({ value: r.id, label: r.label }))]} />
        <SelectField label="Start from a topic" value={fromTopic} onChange={(v) => { const p = new URLSearchParams(); if (v) p.set('topic', v); setParams(p, { replace: true }); }} options={[{ value: '', label: 'Choose a topic…' }, ...TOPICS.map((t) => ({ value: t.id, label: t.title.split(':')[0] }))]} />
      </div>

      {topic && (
        <section className="card mb-6 p-5" aria-labelledby="ft-h">
          <h2 id="ft-h">Roles that “{topic.title.split(':')[0]}” points to</h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">{topic.careers.map((c) => { const r = roleById(c.roleId)!; return <li key={c.roleId} className="rounded-md border border-rule p-3 small"><Link className="font-medium" to={`/careers?role=${r.id}`}>{r.label}</Link><p>{c.note}</p></li>; })}</ul>
          <p className="mt-3 small"><Link to={`/topics/${topic.id}?tab=careers`}>Open the topic’s career tab</Link></p>
        </section>
      )}

      {!role && !topic && (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <li key={r.id} className="card flex flex-col gap-2 p-4">
              <button className="text-left" onClick={() => set('role', r.id)}><span className="font-medium text-accent underline underline-offset-4">{r.label}</span></button>
              <p className="small text-muted">{r.summary}</p>
              <p className="small">{TOPICS.filter((t) => t.careers.some((c) => c.roleId === r.id)).length} topics support this role</p>
              <button className="btn btn-sm mt-auto self-start" aria-pressed={pinned.includes(r.id)} onClick={() => toggle(r.id)}>{pinned.includes(r.id) ? <><PinOff className="h-3.5 w-3.5" aria-hidden /> Unpin</> : <><Pin className="h-3.5 w-3.5" aria-hidden /> Pin as target</>}</button>
            </li>
          ))}
        </ul>
      )}

      {role && (
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2>{role.label}</h2><p className="mt-1 text-muted prose-calm">{role.summary}</p></div>
              <button className="btn" aria-pressed={pinned.includes(role.id)} onClick={() => toggle(role.id)}>{pinned.includes(role.id) ? <><PinOff className="h-4 w-4" aria-hidden /> Unpin target</> : <><Pin className="h-4 w-4" aria-hidden /> Pin as target</>}</button></div>
            <div className="mt-5 grid gap-6 md:grid-cols-2 small">
              <div><h3>Typical responsibilities</h3><ul className="mt-1 list-disc pl-5">{role.responsibilities.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><h3>Types of employers</h3><ul className="mt-1 list-disc pl-5">{role.employers.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><h3>What a thesis can demonstrate</h3><ul className="mt-1 list-disc pl-5">{role.thesisDemonstrates.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><h3>Methods and competencies</h3><p className="mt-1">{role.methods.map((m) => methodById(m)?.label).join(', ')}</p></div>
              <div><h3>Link to your International Relations background</h3><p className="mt-1">{role.irLink}</p></div>
              <div><h3>Extra qualifications to consider</h3><ul className="mt-1 list-disc pl-5">{role.extraQualifications.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><h3>Needs separate professional experience</h3><ul className="mt-1 list-disc pl-5">{role.needsSeparateExperience.map((x) => <li key={x}>{x}</li>)}</ul><p className="mt-1 text-muted">A thesis shows skills; it does not replace this.</p></div>
              <div><h3>Job-search keywords</h3><p className="mt-1 flex flex-wrap gap-2">{role.keywords.map((k) => <span key={k} className="badge badge-muted">{k}</span>)}</p></div>
            </div>
            <div className="mt-5 rule-t pt-4 small"><h3>Official careers pages</h3>
              <ul className="mt-1 space-y-1">{role.links.map((l) => { const li = linkInfo(l.url); return <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label} <ExternalLink className="inline h-3 w-3" aria-hidden /></a> {li?.ok ? <span className="badge badge-ok">link checked {li.checkedAt}</span> : <span className="badge badge-muted">{li ? 'not auto-verifiable' : 'unchecked'}</span>}</li>; })}</ul>
              <p className="mt-2 text-muted">Live vacancies change daily; this app does not list any. Check each page directly.</p></div>
          </section>

          <section>
            <h2>Thesis topics that support this role</h2>
            <ul className="mt-3 space-y-3">
              {topicsForRole.map(({ t, link }) => (
                <li key={t.id} className="card p-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><Link className="font-medium" to={`/topics/${t.id}`}>{t.title}</Link><span className="badge badge-data">{link!.strength === 3 ? 'Strong link' : link!.strength === 2 ? 'Moderate link' : 'Some link'}</span></div>
                  <p className="small">{link!.note}</p><p className="small text-muted">Best portfolio output: {t.outputs.map((o) => OUTPUTS.find((x) => x.id === o.outputId)).filter((o) => o?.bestFor.includes(role.id)).map((o) => o!.label).join(', ') || 'a policy brief (general)'} · profile fit {Math.round((score.get(t.id) ?? 0) * 100)}%</p></li>
              ))}
            </ul>
          </section>

          <section><h2>Portfolio outputs useful for this role</h2>
            <ul className="mt-3 grid gap-3 md:grid-cols-2">{OUTPUTS.filter((o) => o.bestFor.includes(role.id)).map((o) => <li key={o.id} className="card p-4 small"><p className="font-medium">{o.label}</p><p>{o.what}</p><p className="text-muted">Effort: {o.effort}/5 · skills: {o.skills.join(', ')}</p></li>)}</ul></section>
        </div>
      )}
      <div className="mt-8"><Notice>Pinned roles ({pinned.length}) raise topics that support them in the rankings. You can unpin at any time.</Notice></div>
    </div>
  );
}
