# Deploy to Vercel (with saved data via Supabase)

Live site: https://migration-tfm-explorer.vercel.app (Vercel team `rogerplanell-8520s-projects`).

What runs where:
- **Vercel** serves the built app (`dist`) and the research service as one serverless function (`api/index.mjs`, the same Express app as `npm run server`). Live thesis search and link recheck work on the hosted site.
- **Supabase** stores each person's data under a private recovery code. Visitors never create an account, never give an email and never see Supabase.
- Without turning saving on, the app behaves exactly as before: data stays in the browser.

## How saving works
- Settings → *Keep my data across devices* → *Turn on saving* makes a 25-character code in the browser (125 bits). *I already have a code* loads data on another device.
- The browser sends only `sha256("tfm-v1:" + code)`. The database stores a second hash of that in `public.synced_state`. Neither the code nor a usable lookup id is stored.
- `synced_state` has row-level security with no policies, so it cannot be read or written directly. Only three functions can: `tfm_load`, `tfm_save`, `tfm_delete` (security definer, callable with the publishable key). Each needs the full lookup id.
- The code is the only key: whoever holds it can read and change that data, and a lost code cannot be recovered. The app says so next to the code.
- Known limits: anyone can create rows (storage spam is possible but each row is capped at 1 MB); there is no rate limit beyond Supabase's own.
- `public.user_state` (an earlier email-account design) is unused and empty. It can be dropped.

## Deploy / redeploy
`vercel deploy --prod --scope rogerplanell-8520s-projects` from the project folder (`.vercelignore` keeps test outputs and the old shared file out of the upload). The Supabase URL and publishable key are public by design and live in `.env.production`.

## Optional AI helper
Vercel → Settings → Environment Variables → `ANTHROPIC_API_KEY`. Leave it unset on a public link unless you accept that anyone with the link can spend your quota.
