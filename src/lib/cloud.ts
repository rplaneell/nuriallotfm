import { create } from 'zustand';
import { initialState, useApp, STORE_VERSION, type PersistedState } from '@/store/useApp';
import { parseBackup } from '@/lib/io';

/**
 * Optional cloud copy of the persisted state, keyed by a private recovery code (no email, no account).
 * The code is generated in the browser. Only sha256("tfm-v1:" + code) is sent; the database stores a second hash of that,
 * so neither the code nor a usable lookup id is ever stored. The table has no direct access: only three database functions touch it.
 * The browser stays the primary store: with no code, or without the VITE_SUPABASE_* settings, nothing here runs.
 */
const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const CODE_KEY = 'tfm-sync-code';
const META_KEY = 'tfm-sync-meta';
const PUSH_DELAY_MS = 1500;
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // 32 symbols = 5 bits each; 25 symbols = 125 bits
const CODE_LEN = 25;

export type CloudStatus = 'off' | 'inactive' | 'checking' | 'conflict' | 'synced' | 'saving' | 'error';
interface CloudState { status: CloudStatus; code: string | null; error: string | null; conflict: { remoteAt: string } | null }

export const useCloud = create<CloudState>(() => ({ status: 'off', code: null, error: null, conflict: null }));
const set = (p: Partial<CloudState>) => useCloud.setState(p);

export const cloudAvailable = Boolean(URL_ && KEY) && typeof location !== 'undefined' && location.protocol !== 'file:';

// ---------- recovery code ----------
export const formatCode = (c: string) => c.match(/.{1,5}/g)?.join('-') ?? c;
export function normalizeCode(input: string): string | null {
  const c = input.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  return c.length === CODE_LEN && [...c].every((ch) => ALPHABET.includes(ch)) ? c : null;
}
const newCode = () => { const b = crypto.getRandomValues(new Uint8Array(CODE_LEN)); return [...b].map((x) => ALPHABET[x & 31]).join(''); };
async function lookupId(code: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`tfm-v1:${code}`));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
const readCode = (): string | null => { try { return normalizeCode(localStorage.getItem(CODE_KEY) ?? ''); } catch { return null; } };
const storeCode = (c: string | null) => { try { if (c) localStorage.setItem(CODE_KEY, c); else localStorage.removeItem(CODE_KEY); } catch { /* ignore */ } };

// ---------- local helpers ----------
const persisted = (): PersistedState => {
  const s = useApp.getState() as unknown as Record<string, unknown>;
  return Object.fromEntries(Object.keys(initialState()).map((k) => [k, s[k]])) as unknown as PersistedState;
};
const stable = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x));
const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); };
const isEmpty = (s: PersistedState) => stable(s) === stable(initialState());

interface Meta { id: string; at: string; hash: string }
const readMeta = (id: string): Meta | null => { try { const m = JSON.parse(localStorage.getItem(META_KEY) ?? 'null') as Meta | null; return m?.id === id ? m : null; } catch { return null; } };
const writeMeta = (m: Meta | null) => { try { if (m) localStorage.setItem(META_KEY, JSON.stringify(m)); else localStorage.removeItem(META_KEY); } catch { /* ignore */ } };

/** Remote data is treated as untrusted: keep known keys of the right shape, then let the backup validator tighten the rest. */
function sanitize(remote: unknown): Partial<PersistedState> {
  if (typeof remote !== 'object' || remote === null || Array.isArray(remote)) return {};
  const r = remote as Record<string, unknown>; const base = initialState() as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, def] of Object.entries(base)) {
    const v = r[k];
    if (v === undefined) continue;
    if (Array.isArray(def) ? Array.isArray(v) : typeof def === 'object' ? (typeof v === 'object' && v !== null && !Array.isArray(v)) : typeof v === typeof def) out[k] = v;
  }
  const checked = parseBackup(JSON.stringify({ app: 'migration-tfm-explorer', version: STORE_VERSION, state: r }));
  return { ...(out as Partial<PersistedState>), ...(checked.ok ? checked.state : {}) };
}

// ---------- remote I/O (PostgREST RPC) ----------
let lookup: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let applying = false;

async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: KEY!, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  if (!r.ok) {
    let msg = `Saving service returned ${r.status}.`;
    try { const j = await r.json() as { message?: string }; if (j.message) msg = j.message; } catch { /* keep default */ }
    throw new Error(msg);
  }
  const text = await r.text();
  return (text ? JSON.parse(text) : null) as T;
}
async function pull() {
  const rows = await rpc<{ state: unknown; updated_at: string }[]>('tfm_load', { p_lookup: lookup });
  return rows[0] ?? null;
}
async function push(): Promise<void> {
  const state = persisted();
  const at = await rpc<string>('tfm_save', { p_lookup: lookup, p_state: state });
  writeMeta({ id: lookup!.slice(0, 16), at, hash: hash(stable(state)) });
}
function applyRemote(state: unknown, at: string) {
  applying = true;
  useApp.getState().importState(sanitize(state));
  applying = false;
  writeMeta({ id: lookup!.slice(0, 16), at, hash: hash(stable(persisted())) });
}
const fail = (e: unknown) => set({ status: 'error', error: e instanceof Error ? e.message : String(e) });

/** First contact between this device and the cloud copy. Never overwrites differing data on either side without asking. */
async function reconcile() {
  set({ status: 'checking', error: null, conflict: null });
  try {
    const remote = await pull(); const local = persisted(); const meta = readMeta(lookup!.slice(0, 16));
    if (!remote) { if (!isEmpty(local)) await push(); }
    else if (stable(sanitize(remote.state)) === stable(local)) writeMeta({ id: lookup!.slice(0, 16), at: remote.updated_at, hash: hash(stable(local)) });
    else if (isEmpty(local)) applyRemote(remote.state, remote.updated_at);
    else if (meta && meta.hash === hash(stable(local))) applyRemote(remote.state, remote.updated_at); // only the cloud changed since the last sync
    else if (meta && remote.updated_at <= meta.at) await push(); // only this device changed
    else { set({ status: 'conflict', conflict: { remoteAt: remote.updated_at } }); return; }
    set({ status: 'synced' });
  } catch (e) { fail(e); }
}

/** Resolve a conflict: take the cloud copy, or overwrite it with this device. */
export async function resolveConflict(use: 'cloud' | 'device') {
  if (!lookup) return;
  set({ status: 'checking', error: null });
  try {
    if (use === 'cloud') { const r = await pull(); if (r) applyRemote(r.state, r.updated_at); } else await push();
    set({ status: 'synced', conflict: null });
  } catch (e) { fail(e); }
}

/** Turn saving on for the first time on this device: makes a new recovery code and uploads what is here. */
export async function enableSaving() {
  if (!cloudAvailable) return;
  const code = newCode(); storeCode(code); lookup = await lookupId(code);
  set({ code, error: null });
  await reconcile();
}

/** Use an existing recovery code (another device, or after clearing the browser). Returns an error message, or null. */
export async function loadWithCode(input: string): Promise<string | null> {
  if (!cloudAvailable) return 'Saving is not available in this copy of the app.';
  const code = normalizeCode(input);
  if (!code) return 'That code does not look right. It has 25 letters and numbers, like K7QX2-M9PTA-4HWBD-3ZNCE-R8YVF.';
  lookup = await lookupId(code);
  try {
    if (!(await pull())) { lookup = null; return 'No saved data was found for that code. Check it for typing mistakes.'; }
  } catch (e) { lookup = null; return e instanceof Error ? e.message : 'Could not reach the saving service.'; }
  storeCode(code); set({ code, error: null });
  await reconcile();
  return null;
}

/** Stop saving on this device. With `deleteCloudCopy`, the saved copy is erased for good; otherwise it stays and the code still opens it. */
export async function stopSaving(deleteCloudCopy: boolean) {
  try { if (deleteCloudCopy && lookup) await rpc('tfm_delete', { p_lookup: lookup }); } catch (e) { fail(e); return; }
  if (pushTimer) clearTimeout(pushTimer);
  lookup = null; storeCode(null); writeMeta(null);
  set({ status: 'inactive', code: null, error: null, conflict: null });
}

/** Retry after an error. */
export const syncNow = () => (lookup ? reconcile() : Promise.resolve());

let started = false;
export function initCloud() {
  if (started || !cloudAvailable) return;
  started = true;
  set({ status: 'inactive' });
  const code = readCode();
  if (code) { set({ code }); void lookupId(code).then((id) => { lookup = id; void reconcile(); }); }
  // Debounced push of local changes while synced.
  useApp.subscribe(() => {
    if (applying || !lookup) return;
    const st = useCloud.getState().status;
    if (st !== 'synced' && st !== 'saving') return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      if (!lookup) return;
      set({ status: 'saving' });
      try { await push(); set({ status: 'synced' }); } catch (e) { fail(e); }
    }, PUSH_DELAY_MS);
  });
}
