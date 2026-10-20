import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { SOURCES } from '@/data/sources';
import { useApp } from '@/store/useApp';
import { useBackend } from '@/lib/backend';
import { linkInfo, linkMeta, literatureMeta, precedentMeta } from '@/lib/evidence';
import litSnap from '@/data/literature.snapshot.json';
import { EvidenceBadge, Notice, PageHeader, SelectField } from '@/components/ui';

interface Lit { works: Record<string, { doi: string | null; title: string }> }

export default function SourcesPage() {
  const checks = useApp((s) => s.sourceChecks);
  const setCheck = useApp((s) => s.setSourceCheck);
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const backend = useBackend();
  const [busy, setBusy] = useState<string | null>(null);
  const [doiMsg, setDoiMsg] = useState<string>('');

  const list = useMemo(() => SOURCES.filter((s) => (!kind || s.kind === kind) && (!q || `${s.name} ${s.publisher} ${s.notes}`.toLowerCase().includes(q.toLowerCase()))), [kind, q]);
  const kinds = [...new Set(SOURCES.map((s) => s.kind))];

  const recheck = async (url: string) => {
    setBusy(url);
    try {
      const r = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`);
      const j = await r.json();
      setCheck(url, { ok: !!j.ok, status: j.status ?? null, at: String(j.checkedAt ?? new Date().toISOString()).slice(0, 10), note: j.error });
    } catch { setCheck(url, { ok: false, status: null, at: new Date().toISOString().slice(0, 10), note: 'local service not running' }); }
    setBusy(null);
  };

  const verifyDoi = async () => {
    const dois = Object.values((litSnap as unknown as Lit).works).filter((w) => w.doi).slice(0, 5);
    setDoiMsg('Checking 5 DOIs against Crossref…');
    let ok = 0; const bad: string[] = [];
    for (const w of dois) {
      try {
        const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(w.doi!.replace('https://doi.org/', ''))}`);
        if (!r.ok) { bad.push(`${w.doi} (HTTP ${r.status})`); continue; }
        const j = await r.json();
        const t = String(j.message?.title?.[0] ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const mine = w.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (t && (t.includes(mine.slice(0, 25)) || mine.includes(t.slice(0, 25)))) ok++; else bad.push(`${w.doi} (title differs)`);
      } catch { bad.push(`${w.doi} (unreachable)`); }
    }
    setDoiMsg(`${ok} of ${dois.length} DOIs matched Crossref titles.${bad.length ? ' Not confirmed: ' + bad.join('; ') : ''}`);
  };

  return (
    <div>
      <PageHeader eyebrow="Module J · Evidence" title="Sources and verification status">
        Every external item in this app carries its status. Nothing is invented: when a link could not be checked or a record could not be confirmed, it says so.
      </PageHeader>

      <section className="card mb-6 p-5" aria-labelledby="st-h">
        <h2 id="st-h">What each label means</h2>
        <ul className="mt-3 grid gap-2 small md:grid-cols-2">
          <li><EvidenceBadge status="verified-metadata" /> The record was returned by an open index (OpenAlex, a thesis repository) on the date shown.</li>
          <li><EvidenceBadge status="link-checked" /> The URL answered when tested by the project’s link checker.</li>
          <li><EvidenceBadge status="source-backed" /> Tied to an identified official source. Still needs reading.</li>
          <li><EvidenceBadge status="interpretation" /> A reasoned judgment by the author of the tool.</li>
          <li><EvidenceBadge status="hypothesis" /> Generated and provisional.</li>
          <li><EvidenceBadge status="unverified" /> From background knowledge; verify before relying.</li>
        </ul>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="card p-4 small"><p className="eyebrow">Literature snapshot</p><p>{literatureMeta.total} works from OpenAlex</p><p className="text-muted">Retrieved {literatureMeta.retrievedAt}</p></div>
        <div className="card p-4 small"><p className="eyebrow">Past theses snapshot</p><p>{precedentMeta.total} master-level theses</p><p className="text-muted">Retrieved {precedentMeta.retrievedAt}; {precedentMeta.sources.length} repositories</p></div>
        <div className="card p-4 small"><p className="eyebrow">Link check</p><p>{linkMeta.ok} of {linkMeta.total} source links answered</p><p className="text-muted">Checked {linkMeta.checkedAt ?? 'never'}. Some sites block automated checks.</p></div>
      </section>

      <section className="card mb-6 p-5" aria-labelledby="re-h">
        <h2 id="re-h">Recheck</h2>
        <p className="mt-1 small text-muted">Re-run the checks yourself. DOIs are checked directly against Crossref (needs internet).{backend ? ' Source links can be rechecked with the button on each source.' : ' This copy has no link rechecker: open a link in your browser to test it.'}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3"><button className="btn" onClick={() => void verifyDoi()}><RefreshCw className="h-4 w-4" aria-hidden /> Verify 5 sample DOIs with Crossref</button><span className="small" role="status">{doiMsg}</span></div>
        <p className="mt-3 small text-muted">The bundled snapshots were refreshed by the project owner on the dates shown above.</p>
      </section>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1"><label htmlFor="sq" className="block small font-medium">Search sources</label><input id="sq" className="field" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <SelectField label="Type" value={kind} onChange={setKind} options={[{ value: '', label: 'All types' }, ...kinds.map((k) => ({ value: k, label: k.replace('-', ' ') }))]} />
      </div>
      <p className="mb-3 small text-muted" role="status">{list.length} sources</p>
      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((s) => { const li = linkInfo(s.url); const re = checks[s.url]; return (
          <li key={s.id} className="card p-4 small">
            <p className="font-medium">{s.name}</p>
            <p className="text-muted">{s.publisher} · {s.kind.replace('-', ' ')} · access: {s.access} · {s.geo}</p>
            <p className="mt-1">{s.notes}</p>
            <p className="mt-2 flex flex-wrap items-center gap-2"><a href={s.url} target="_blank" rel="noreferrer">Open <ExternalLink className="inline h-3 w-3" aria-hidden /></a>
              {li ? (li.ok ? <EvidenceBadge status="link-checked" label={`Checked ${li.checkedAt}`} /> : <span className="badge badge-warn" title={li.error}>Not auto-verifiable ({li.status ?? li.error})</span>) : <span className="badge badge-muted">Unchecked</span>}
              {re && <span className={clsx('badge', re.ok ? 'badge-ok' : 'badge-bad')}>Your recheck {re.at}: {re.ok ? 'OK' : re.status ?? re.note}</span>}
              {backend && <button className="btn btn-sm" onClick={() => void recheck(s.url)} disabled={busy === s.url}>{busy === s.url ? 'Checking…' : 'Recheck'}</button>}</p>
          </li>
        ); })}
      </ul>
      <div className="mt-6"><Notice>Link checks run from a script; a failure may mean the site blocks automated requests (HTTP 403/503), not that the page is gone. Open it in your browser to be sure.</Notice></div>
    </div>
  );
}
