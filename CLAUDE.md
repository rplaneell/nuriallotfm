# Migration Policy TFM Explorer

Local-first React + TypeScript + Vite + Tailwind v4 app helping Núria (UPF Master in Governance, Migration track) choose a thesis topic. See README.md.

- Run: `npm run start` (web on :5173, research service on :8787). On a machine with a TLS-inspecting proxy, Node needs `--use-system-ca` (already set in the npm scripts).
- Quality gate: `npm run typecheck && npm run lint && npm test`, then `npm run e2e` and `npm run a11y` with the app running.
- Project skills: `.claude/skills/migration-policy-research` (evidence integrity), `tfm-methodology` (research design checks), `frontend-quality` (UI gate). Read the first before touching `src/data/`.
- Hard rules: never invent citations, sources, statistics, vacancies or deadlines; label evidence status; user data stays in the browser unless the user turns on opt-in cloud saving (Supabase, private recovery code, no accounts, see docs/DEPLOY.md); only the Supabase publishable key may be in browser code, never a service-role or AI key.
