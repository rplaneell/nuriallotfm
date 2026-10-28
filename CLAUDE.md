# Migration Policy TFM Explorer

Local-first React + TypeScript + Vite + Tailwind v4 app helping Núria (UPF Master in Governance, Migration track) choose a thesis topic. See README.md.

- Run: `npm run start` (web on :5173, research service on :8787). On a machine with a TLS-inspecting proxy, Node needs `--use-system-ca` (already set in the npm scripts).
- Quality gate: `npm run typecheck && npm run lint && npm test`, then `npm run e2e` and `npm run a11y` with the app running.
- Project skills: `.claude/skills/migration-policy-research` (evidence integrity), `tfm-methodology` (research design checks), `frontend-quality` (UI gate). Read the first before touching `src/data/`.
- Hard rules: never invent citations, sources, statistics, vacancies or deadlines; label evidence status; user data stays in the browser unless the user turns on opt-in cloud saving (Supabase, private recovery code, no accounts, see docs/DEPLOY.md); only the Supabase publishable key may be in browser code, never a service-role or AI key.

## Secrets rule (applies to every project)

* Keep API keys, tokens and passwords only in a local `.env` file. (API means application programming interface, the door a program uses to talk to another service, and a key is the password for that door.)
* `.env` must always be listed in `.gitignore`. Check this before the first commit of any project, and check that `git ls-files` shows no `.env` file with real secrets.
* Commit a `.env.example` with the variable names and empty values, so anyone can see what to fill in without seeing the secrets.
* Never paste a key into source code, docs, chat messages, screenshots or commit messages.
* If a key ever reaches GitHub, even for a minute, treat it as stolen: revoke it at the provider and make a new one. Deleting the commit is not enough, because bots scan GitHub within seconds.

Why: Git remembers everything forever, and a public or shared repository is read by automated scanners that steal keys and run up bills on your account. A file that Git never sees can never be uploaded by mistake.
