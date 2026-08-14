# Kegel Tracker

Mobile-first Vue 3 (Options API) app: a guided kegel timer plus a stats page with
streaks and a session calendar. Sessions are logged to Supabase (`kegel` schema).

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

Without Supabase env vars the timer still runs; it just can't save or show history.

## Supabase setup

1. Run [supabase/schema.sql](supabase/schema.sql) in the SQL editor.
2. Settings → API → **Exposed schemas**: add `kegel`.

The table is `kegel.sessions` (`squeeze_s`, `relax_s`, `repititions`, `created_at`).
Set `VITE_SUPABASE_TABLE` if you name it something else.

## Deploying

1. Push to a repo named `kegel-tracker` (the Vite `base` in
   [vite.config.js](vite.config.js) assumes that path — change it if the repo name
   differs).
2. Repo Settings → Pages → **Source: GitHub Actions**.
3. Repo Settings → Secrets and variables → Actions, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.
4. Push to `main`; [the workflow](.github/workflows/deploy.yml) builds and deploys.

The anon key is embedded in the built JS and is public — the RLS policies in the
schema file are what actually protect the data.
