# bootcamp-app

Minimal full-stack skeleton: an Express API in `server/` and a React (Vite) client in `client/`.

## First-time setup

```
npm run install:all
```

## Run everything (server + client) with one command

```
npm run dev
```

- Server runs on http://localhost:3001
- Client runs on http://localhost:5173 and proxies `/api` requests to the server

Open http://localhost:5173 in your browser — you should see a page that says
"Hello from the server!", fetched live from the Express API.

## Project layout

```
server/       Express API (entry point: server/index.js)
client/       React app (source in client/src/)
```

Add new routes in `server/index.js` and new UI in `client/src/App.jsx` as you build out
each session's features.

## Deploy

The app deploys as a **single service**: in production, `server/index.js` serves the
built React app (`client/dist`) as static files alongside the `/api/*` routes, so there's
one process and one URL — no separate frontend host, no CORS to configure.

**Why Render, and not Vercel/Netlify/Cloudflare Pages:** this app stores data in a local
SQLite file (`server/data.sqlite`) via a long-lived Express process. Vercel, Netlify, and
Cloudflare Pages run backend code as short-lived serverless functions with no shared
persistent disk — a SQLite file there would be inconsistent or reset between requests.
Render's free **Web Service** runs a single persistent Node process instead, which is a
correct fit for this setup.

**The catch (free tier only):** Render's free Web Services don't include a persistent
disk. The filesystem — including `server/data.sqlite` — resets on every redeploy **and**
whenever the service spins down from ~15 minutes of inactivity (it spins back up
automatically on the next request, cold start ~30–60s). Since `server/seed.js` reseeds
automatically whenever the test_cases table is empty, the app always comes back with
working demo data rather than erroring — but anything *you* create or edit during a
session (new bugs, edited test cases, settings changes, CSV imports) won't survive an
idle reset. Fine for a portfolio/demo deployment; if you need real persistence later,
attach a paid persistent disk on Render, or swap `server/db.js` for a hosted database.

### Environment variables

Copy `.env.example` → `.env` for local use. In production, set these as real environment
variables in Render's dashboard instead (`render.yaml` already declares both as prompted,
optional values):

- `APP_BASE_URL` — public URL of this deployment, used to build the link in Discord
  failure-alert and flaky-test-alert messages. Set it to your Render URL once you have
  it; safe to leave blank.
- `DISCORD_WEBHOOK_URL` — optional. Only needed if you want a Discord alert posted when
  a test-run result is marked "failed" or a test case newly becomes flaky (see
  `/flaky-tests`). Leave unset to disable both alerts.

`PORT` is set automatically by Render — don't set it manually in production.

### One-time deploy

This repo's `origin` remote isn't on GitHub, and Render deploys from a GitHub (or
GitLab) repo, so the steps below first push a mirror to a new GitHub repo (as a
second remote, `render-deploy` — your existing `origin` is untouched), then hand off to
Render.

The command below `cd`s into the project itself first — safe to paste from anywhere,
including a fresh terminal tab or your home directory (`gh repo create --source=.`
initializes git in *whatever directory it's run from*, so this guards against
accidentally doing that somewhere it shouldn't). Run it once:

```bash
cd /Users/rudolfskinkeris/Documents/bootcamp-app && brew install gh render-oss/render/render && (gh auth status || gh auth login) && gh repo create waypoint --public --source=. --remote=render-deploy --push && render login && open https://dashboard.render.com
```

This installs the GitHub and Render CLIs, opens your browser to authenticate with
GitHub (skipped if you're already logged in), creates a new **public** GitHub repo named
`waypoint` from this codebase and pushes it, opens your browser to authenticate with
Render, then opens the Render dashboard.

From there (a few browser clicks Render's OAuth flow can't skip):
1. **New +** → **Blueprint**.
2. Select the `waypoint` repo you just created (authorize Render's GitHub App on it if
   asked).
3. Render reads `render.yaml` and pre-fills everything — service name, build/start
   commands, health check, free plan, and prompts for the two optional env vars above.
   Click **Apply**.

Your live URL (`https://waypoint.onrender.com` or similar — Render appends a random
suffix if the exact name is taken) appears on the service's dashboard page once the
first build finishes (a few minutes). The URL isn't shown on the Blueprint overview
page — click into the `waypoint` service itself to find it, at the top of its page.

**Currently live at: https://waypoint-6bro.onrender.com**
