# Migration Policy TFM Explorer

A local-first research and decision tool for choosing a master's thesis (TFM) topic in migration governance and connecting it to a first job. Built for Núria Llorens de la Cruz (UPF Master in Governance, Migration track).

It combines: an adaptive orientation test, an interface-preference test that really changes the layout, a topic explorer (100 structured profiles, about three quarters of them international or intercontinental), a world map, a career explorer, a topic laboratory, a feasibility evaluator and a comparison dashboard with sensitivity analysis. **Each topic also shows similar past master's theses and literature candidates retrieved from real repositories.**

## Install and start

Requires Node.js 20+ (developed on Node 24).

```bash
npm install
npm run start          # web app on http://localhost:5173 + research service on :8787
```

`npm run dev` starts only the web app. Everything core works without the service; the service adds live repository search, URL rechecks and the optional AI helper.

On a network that inspects TLS (corporate proxies), Node must trust the system certificate store. The npm scripts already pass `--use-system-ca`. Certificate verification is never disabled.

## What is implemented (all verified, see Tests)

| Module | What it does |
|---|---|
| A. Orientation test | 6 stages, 37 questions defined (about 30 shown; follow-ups appear only when relevant): scenarios, follow-ups that appear only when relevant, a ranking built from your earlier picks, pairwise trade-offs, sliders, open reflection. Skip, "not sure" (half weight), revisit, edit. Result: explainable profile with strength labels (strong, moderate, tentative), the answers behind each score, preference conflicts, uncertainties, 3 to 5 research directions. Editable. |
| B. How do you want to explore? | Seven modes (combinable) plus detail, breadth and format. Changes navigation order, Home content, default topic tab and card density. "Complete overview" and reset available in Settings. Kept separate from research interests. |
| C. Topic explorer | 100 profiles with all required fields, world region and language fields, filters (including world region), ranking by profile, per-topic "why recommended", reactions (9 kinds) with undo and "set aside, restore". |
| D. Map | Leaflet + OpenStreetMap tiles, Natural Earth boundaries. 28 curated places. Filters by theme, level, method, actor, data availability, topic feasibility. Context panel, saved places, descriptive two-place comparison. |
| E. Careers | 16 role families both ways (role to topics, topic to roles), portfolio outputs, official careers links with link status. No vacancies are listed. |
| F/G. Feasibility and lab | 13 criteria, configurable importance, uncertainty band. Lab: scope, level, cases, breadth, focus, method, academic/practical, technical ambition, data load, population, career. Every change updates the question, method, evidence list, workload and scores with written reasons. Ambitious / balanced / lower-risk versions. Edit the question yourself. |
| H. Dashboard | Shortlist, side-by-side matrix, weights with live re-ranking, 600-scenario sensitivity analysis, adjustable work plan (you enter confirmed dates), notes, open questions. Export Markdown, CSV, print-friendly HTML, full JSON backup with validated restore. |
| J. Evidence | Source registry with link status and recheck, DOI check against Crossref, duplicate grouping, status labels on every item. |

## Past theses from similar programmes

Source: public repository APIs, retrieved on **2026-10-19** and bundled as `src/data/precedents.snapshot.json` (87 master-level theses across the original 16 topics; the 84 later topics show "snapshot not yet fetched" until `npm run snapshot:precedents -- --missing` is run):

- UPF e-repository (DSpace 7): the political and social sciences master collection (the department behind the Master in Governance) and IBEI master theses.
- Utrecht University student theses (DSpace 7).
- DiVA portal: Swedish master's theses (programmes in migration and ethnic relations, political science, etc.).

**Limits:** UPF deposits few theses (3 to 10 on migration per collection), so most precedents come from comparable programmes elsewhere. Relevance is keyword overlap, not human judgment. "Overlap with your question" is a rough word-overlap signal. The "methods used" tags come from words in titles and abstracts only. Always read a thesis before judging it. Refresh with `npm run snapshot:precedents`, or search live from a topic's *Past theses* tab (needs the service).

## Evidence, sources and their limits

- **Literature:** 387 works from OpenAlex (Social Sciences field), retrieved 2026-10-19 (`npm run snapshot:literature`). Metadata is verified in the sense that OpenAlex returned it. Relevance is not human-checked; abstracts were not read in full; "journal article" does not confirm peer review. No research gap is claimed anywhere.
- **Topic profiles, questions, hypotheses, feasibility scores:** generated or judged by the tool's author and labelled so. Named theoretical frameworks are background knowledge flagged "citation unverified" with a search link.
- **Legal and policy claims** (e.g. Pact application dates, regularisation reforms, minors' distribution, Catalan competence talks) are listed per topic as *unverified* with the primary source to check.
- **Links:** 57 source and career URLs checked by `npm run check:links` on 2026-10-19: 49 answered. The other 8 returned 403, 429, 503, a timeout or a dropped socket (some sites block automated requests, others were slow) and are shown as "not auto-verifiable", not as broken. Use the Recheck button or open them in a browser.
- **Official UPF facts used** (checked from the UPF pages): 60 ECTS, thesis 20 ECTS, article format up to 10,000 words, English, February topic/supervisor request, mid-June submission, late June/early July defence. Exact yearly dates are **not assumed**: you enter them.

## Optional API configuration

AI brainstorming (Refine tab) is optional and always labelled "AI-generated, not evidence". Copy `.env.example` to `.env`, set `ANTHROPIC_API_KEY`, then run `node --use-system-ca --env-file=.env server/index.mjs` (with `npm run dev` for the web app). The key stays on the server. Without it, the panel explains that AI is not configured.

## Privacy and security

No analytics, accounts or cookies. Answers, notes and shortlist live in `localStorage`. The service binds to 127.0.0.1, rate-limits requests, blocks private addresses in URL checks (SSRF guard), and treats all retrieved text as untrusted (markup stripped). Backups are parsed as JSON only, key-whitelisted and type-checked. CSV export neutralises spreadsheet formulas; HTML export escapes everything.

## Tests performed

| Check | Result (2026-10-19) |
|---|---|
| `npm run typecheck`, `npm run lint` | clean |
| `npm test`: 36 tests (profile scoring, adaptive follow-ups, ranking, feedback undo, lab, feasibility bounds, decision weights, reproducible sensitivity, timeline, duplicates, exports, import validation and prototype-pollution guard, content integrity, 4 component journeys) | 36 passed |
| `npm run e2e`: 66 real-browser checks (full test run, profile editing, UI personalisation, feedback and undo, filters, every topic tab, lab, notes, save, dashboard weights, 4 export formats, backup restore and rejection, persistence after reload, map filter/select/compare, careers both ways, sources recheck, skip link, 7 routes at 375px, dark theme, zero console errors) | 66/66 |
| `npm run a11y`: axe-core WCAG 2.2 AA + best practice, 15 routes, light and dark | 0 violations after fixes |
| `npm run build` | succeeds |

Bugs found by these tests and fixed: Notes tab crashed from an unstable store selector; test auto-advanced after answering; focus landed on `<main>` before the skip link; links relied on colour alone; invalid `aria-pressed` on radios; skipped heading levels; raw HTML tags in repository abstracts.

## Remaining limitations

- Not tested with a screen reader or on real phones (only emulated 375px width).
- Map tiles come from OpenStreetMap's public tile server (light-use policy); swap the provider for heavy use. Coverage is 28 places and is labelled incomplete.
- Place notes and policy context are unverified background knowledge. No flows, indices or rankings are included because none were verified.
- Literature and thesis snapshots are as of 2026-10-19. Utrecht's server is slow and may time out in live search; the error is shown.
- Feasibility scores for intrinsic criteria are the author's judgments. Take them as discussion prompts for a supervisor, not measurements.
- The bundle is large (about 800 kB main chunk plus a 600 kB evidence chunk) because snapshots ship with the app.

## Extending

- Add a topic: the original 16 live in `src/data/topics-a.ts` / `topics-b.ts` (`mk({...})`); newer ones use the compact `lite({...})` format in `topics-global.ts`, `topics-africa-mena.ts`, `topics-americas-oceania.ts`, `topics-asia-gulf.ts` and `topics-europe-spain.ts`. Add its search terms to `src/data/queries.json`, then run `npm run snapshot:literature -- --missing` and `npm run snapshot:precedents -- --missing` (they fetch only topics without an entry and keep existing retrieval dates). `npm test` checks every id resolves.
- Add a question: `src/data/questions.ts` (weights keys documented at the top; follow-ups use `showIf`).
- Add a source or role: `src/data/sources.ts`, `src/data/careers.ts`, then `npm run check:links`.
- Add a repository: an adapter in `server/adapters.mjs` (DSpace 7 sources are one entry).
- Logic lives in `src/lib/` (pure, tested); UI in `src/pages` and `src/components`.

## Skills Usage Report

**Installed.** All three requested collections were already present at user scope (`~/.claude/skills`) when this session began. I did not install anything and did **not verify** that they came from the named GitHub repositories, nor read their licences. The frontend skills named in the brief exist (`calm-ui`, `frontend-design`, `frameworks-react`, `tailwind-design-system`, `component-refactoring`, `frontend-testing`, `frontend-code-review`, `guiding-users`, `how-to-write-component`), as do the `scholar-*` skills and many `frontend-*` design-package skills.

**Actually read and applied:**
- `calm-ui`: restrained palette, neutral-first, one statement size, hover changes colour only, no default-shadcn look (hand-built primitives on Radix).
- `tailwind-design-system`: Tailwind v4 CSS-first `@theme` tokens in OKLCH, dark mode through variables.
- `frontend-design`: the "research notebook" direction (warm paper, ink, one brick accent, serif display).
- `guiding-users`: the single "next step" panel, progressive disclosure (details collapsed in guided/brief modes), explicit empty, error and loading states.
- `frontend-code-review`: read its checklist and applied its two applicable rules (shared class utility `clsx`, Tailwind-first). Its React Flow and Dify-specific rules do not apply.

**Not used, and why:** I did not invoke through the Skill tool or read `frameworks-react`, `how-to-write-component`, `component-refactoring`, `frontend-testing`, or any `scholar-*`/Open Scholar skill, and did not use the OpenAEC design package's skills. Testing used Vitest, Testing Library, Playwright-core and axe-core directly; literature discovery used the OpenAlex API through my own adapter, not the Open Scholar skill. I did not claim these skills were used beyond the above.

**Project skills created:** `.claude/skills/migration-policy-research`, `tfm-methodology`, `frontend-quality`, plus `CLAUDE.md`.

**Principal improvements attributable to skills:** the calm token system and typography, the guided next-step flow, consistent empty and error states, and removal of template-string class logic. The accessibility defects were found by axe, not by a skill.

## Sharing

A single-file, no-server version is built with `npm run build:share` (output: `share/TFM-Explorer.html`, tested from disk). See **docs/SHARING.md** for how to share it and a guide for the people you share it with. Backend-only features (live search, link recheck, AI) hide themselves when no service is present.
