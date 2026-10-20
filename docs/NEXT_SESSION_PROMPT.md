# Prompt for the next session: fetch evidence for the 84 new topics and deploy

Paste everything inside the block below into a new Claude Code session on this repository.

Before you start, in that session's environment settings set Network access to **Full** (or allow these hosts): `api.openalex.org`, `api.crossref.org`, `repositori.upf.edu`, `studenttheses.uu.nl`, `www.diva-portal.org`, `vercel.com`, `api.vercel.com`, `migration-tfm-explorer.vercel.app`, plus every host listed in `src/data/sources.ts` (needed for the link checker). Add a `VERCEL_TOKEN` secret if you want the session to deploy for you.

```text
You are working on the Migration Policy TFM Explorer (see CLAUDE.md and README.md). TFM stands for Treball de Fi de Màster, the master's thesis. The app now has 100 thesis topic profiles. The first 16 already have literature and past thesis data. The other 84 (files topics-global.ts, topics-africa-mena.ts, topics-americas-oceania.ts, topics-asia-gulf.ts, topics-europe-spain.ts in src/data/) show "snapshot not yet fetched" because the sandbox that created them could not reach OpenAlex (the open scholarly index) or the thesis repositories.

Goal: link the 84 new topics to real OpenAlex citations and real past master's theses, refresh link checks, then deploy to Vercel. Follow the project's evidence rules strictly. Read .claude/skills/migration-policy-research/SKILL.md first.

Hard rules (from CLAUDE.md and the skill):
1. Never write a citation, author, year, DOI, venue or statistic by hand. Records enter the app only through the snapshot scripts.
2. Do not edit JSON snapshots by hand. Re-run scripts instead.
3. Label evidence status honestly. OpenAlex "journal" means journal article, not peer reviewed.
4. Never claim a research gap from a thin search result. A gap is claimed only after reading.
5. Respect each API's terms and rate limits. No paywall or authentication bypass.
6. Only the Supabase publishable key may appear in browser code. Never add a service role key or AI key.

Steps:
1. Run `npm ci`, then `npm run typecheck && npm run lint && npm test` to confirm a green baseline.
2. Run `npm run snapshot:literature -- --missing`. This fetches OpenAlex works only for topics without an entry and keeps existing retrieval dates. Report how many works were added per topic and list any errors from the script output.
3. Run `npm run snapshot:precedents -- --missing` the same way (repositories: UPF e-repository, Utrecht student theses, DiVA in Sweden).
4. Run `npm run check:links` to refresh src/data/linkstatus.json. This also covers the roughly 68 new sources and 3 new career roles. For any link that fails, do NOT delete it silently: report the status, check whether the URL moved, and only then update the registry entry in src/data/sources.ts or careers.ts with a verified replacement.
5. Review relevance for each new topic. The scripts keep records by keyword overlap, which is not human vetted. For each of the 84 topics, open the Evidence tab data and list: number of works, number of past theses, and whether the top results look on topic. For topics where results look off topic or empty, improve the search terms in src/data/queries.json (plain topical phrases only), delete that topic's entries from the two snapshots by re-running the script for it, and fetch again. Do not hand-pick or hand-write records.
6. Add or extend a test in src/lib/engine.test.ts that every topic now has an entry in literature.snapshot.json byTopic and precedents.snapshot.json byTopic (an empty list is allowed, a missing entry is not), and that every referenced work id resolves.
7. Run the full gate: `npm run typecheck && npm run lint && npm test`, then start the app with `npm run start` and run `npm run e2e` and `npm run a11y`. If Chromium is not found, set CHROME_PATH (the scripts also look in /opt/pw-browsers).
8. Update the README counts (works, theses, link checks, retrieval dates) from the real script output. Do not estimate.
9. Commit with a clear message and push to the working branch. Do not open a pull request unless asked.
10. Deploy: from the project root run `vercel deploy --prod --scope rogerplanell-8520s-projects` (see docs/DEPLOY.md). The Supabase URL and publishable key already live in .env.production. If there is no Vercel login or token, stop and tell me exactly what is missing instead of working around it. After deploying, open https://migration-tfm-explorer.vercel.app and confirm: the topic count reads 100, the World region filter works, the orientation test shows the new region and language questions, and a new topic's Evidence tab shows retrieved literature with "Verified metadata" badges and DOI links.

Report at the end: what was fetched (counts per topic group), what failed, which topics have thin evidence, which links failed, and the deployed URL. Be explicit about anything you could not verify.
```
