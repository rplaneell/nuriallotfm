import { useEffect, useState } from 'react';

/**
 * The optional local research service is only present when the app runs with `npm run start`.
 * In a shared static copy there is no backend, so features that need it are hidden, not shown broken.
 */
let probe: Promise<boolean> | null = null;
export function probeBackend(): Promise<boolean> {
  probe ??= (async () => {
    if (typeof location !== 'undefined' && location.protocol === 'file:') return false;
    try {
      const r = await fetch('/api/health', { signal: AbortSignal.timeout(2500) });
      if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return false;
      return (await r.json())?.ok === true;
    } catch { return false; }
  })();
  return probe;
}

/** undefined while checking, then true/false. */
export function useBackend(): boolean | undefined {
  const [ok, setOk] = useState<boolean | undefined>(undefined);
  useEffect(() => { let live = true; void probeBackend().then((v) => { if (live) setOk(v); }); return () => { live = false; }; }, []);
  return ok;
}
