---
name: frontend-quality
description: Frontend quality gate for the Migration Policy TFM Explorer covering responsive layout, accessibility, working interactions and tests. Run before finishing any UI change.
---

# Frontend quality gate

1. `npm run typecheck && npm run lint && npm test` must pass.
2. With the app running (`npm run start`): `npm run e2e` (real-browser workflows; console errors fail the run) and `npm run a11y` (axe-core, WCAG 2.2 AA plus best practice, light and dark, every route) must report zero failures.
3. Design system (`src/index.css`): tokens only (`var(--ink)`, `bg-surface`). No hard-coded colours in components. One statement size, body size otherwise. Hover changes colour or background only. Accent means action; green, amber and red mean evidence status.
4. Class logic through `clsx`; a component's `className` goes last. Tailwind first; component classes (`.btn`, `.chip`, `.card`) for repeated patterns.
5. Accessibility: native controls first; every control has an accessible name; no `aria-pressed` on `role=radio`; one `h1` and no skipped heading levels (TabPanel adds an sr-only `h2`); links inside text are underlined; visible focus; skip link stays the first Tab stop on load.
6. States: every list and page has loading, empty, error and success states that say what to do next.
7. Responsive: no horizontal page scroll at 375px (tables scroll inside their own container).
8. Zustand selectors must return stable references (never an inline `?? []`), otherwise the page loops.
9. Every visible control performs a real action. Remove decoration that implies features that do not exist.
