import clsx from 'clsx';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Moon, Settings as SettingsIcon, Sun } from 'lucide-react';
import { useApp } from '@/store/useApp';
import { useCloud } from '@/lib/cloud';
import { useUiFlags } from '@/store/derived';
import { Loading } from '@/components/ui';
import { SettingsDialog } from '@/components/SettingsDialog';
import Home from '@/pages/Home';
import type { ExploreMode } from '@/types';

const TestPage = lazy(() => import('@/pages/TestPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const TopicsPage = lazy(() => import('@/pages/TopicsPage'));
const TopicDetail = lazy(() => import('@/pages/TopicDetail'));
const MapPage = lazy(() => import('@/pages/MapPage'));
const CareersPage = lazy(() => import('@/pages/CareersPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const SourcesPage = lazy(() => import('@/pages/SourcesPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

interface NavItem { to: string; label: string }
const ALL_NAV: Record<string, NavItem> = {
  home: { to: '/', label: 'Home' },
  test: { to: '/test', label: 'Orientation' },
  topics: { to: '/topics', label: 'Topics' },
  map: { to: '/map', label: 'Map' },
  careers: { to: '/careers', label: 'Careers' },
  dashboard: { to: '/dashboard', label: 'Shortlist' },
  sources: { to: '/sources', label: 'Sources' },
};
/** The navigation order follows the chosen way of exploring. Nothing is hidden: only reordered. */
const NAV_ORDER: Record<ExploreMode, string[]> = {
  guided: ['home', 'test', 'topics', 'map', 'careers', 'dashboard', 'sources'],
  research: ['home', 'topics', 'sources', 'map', 'test', 'careers', 'dashboard'],
  visual: ['home', 'map', 'topics', 'careers', 'test', 'dashboard', 'sources'],
  career: ['home', 'careers', 'topics', 'test', 'map', 'dashboard', 'sources'],
  policy: ['home', 'topics', 'map', 'careers', 'test', 'dashboard', 'sources'],
  method: ['home', 'topics', 'test', 'sources', 'careers', 'map', 'dashboard'],
  hybrid: ['home', 'test', 'topics', 'map', 'careers', 'dashboard', 'sources'],
};

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try { return (localStorage.getItem('tfm-theme') as 'light' | 'dark') ?? 'system'; } catch { return 'system'; }
  });
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', theme);
    try { if (theme === 'system') localStorage.removeItem('tfm-theme'); else localStorage.setItem('tfm-theme', theme); } catch { /* ignore */ }
  }, [theme]);
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  return { isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') };
}

export default function App() {
  const { primary, everything } = useUiFlags();
  const [settings, setSettings] = useState(false);
  const { isDark, toggle } = useTheme();
  const loc = useLocation();
  const savedCount = useApp((s) => s.saved.length);
  const cloudStatus = useCloud((s) => s.status);
  const order = (everything ? NAV_ORDER.hybrid : NAV_ORDER[primary]).map((k) => ALL_NAV[k]);

  // Move focus to the content after in-app navigation, but not on first load (keeps the skip link first).
  const lastPath = useRef(loc.pathname);
  useEffect(() => {
    if (lastPath.current === loc.pathname) return;
    lastPath.current = loc.pathname;
    window.scrollTo?.(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [loc.pathname]);

  return (
    <div className="min-h-dvh flex flex-col">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <header className="no-print rule-b site-header sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <NavLink to="/" className="shrink-0 font-display text-xl font-semibold leading-none no-underline text-ink" aria-label="Migration Policy TFM Explorer, home">
            <span className="sm:hidden">TFM</span>
            <span className="hidden sm:inline">TFM Explorer</span>
          </NavLink>
          <nav aria-label="Main" className="flex-1 overflow-x-auto">
            <ul className="flex items-center gap-1 whitespace-nowrap">
              {order.map((n) => (
                <li key={n.to}>
                  <NavLink to={n.to} end={n.to === '/'} className={({ isActive }) => clsx('inline-flex min-h-10 items-center border-b-2 px-3 text-base no-underline transition-colors duration-150', isActive ? 'border-accent font-semibold text-ink' : 'border-transparent text-muted hover:text-ink')}>
                    {n.label}{n.to === '/dashboard' && savedCount > 0 && <span className="ml-1.5 badge badge-muted">{savedCount}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <button className="btn btn-ghost btn-icon" onClick={toggle} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>{isDark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}</button>
          <button className="btn btn-sm" onClick={() => setSettings(true)}><SettingsIcon className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Settings</span><span className="sm:hidden sr-only">Settings</span></button>
        </div>
      </header>

      {cloudStatus === 'conflict' && (
        <div role="alert" className="no-print rule-b bg-accent-soft">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2 small">
            <span>Your saved copy is different from the data on this device. Nothing was overwritten.</span>
            <button className="btn btn-sm" onClick={() => setSettings(true)}>Choose which to keep</button>
          </div>
        </div>
      )}

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/topics/:id" element={<TopicDetail />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="no-print rule-t bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-5 small text-muted flex flex-wrap gap-x-6 gap-y-2 justify-between">
          <p className="max-w-prose">Your answers, notes and shortlist stay in this browser. Nothing is sent anywhere unless you use the optional live search or turn on saving with a recovery code to keep your data across devices. Scores are transparent judgments, not predictions of success.</p>
          <p><NavLink to="/about">About, limits and privacy</NavLink></p>
        </div>
      </footer>
      <SettingsDialog open={settings} onOpenChange={setSettings} />
    </div>
  );
}
