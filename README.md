# bootcamp-app

Minimal full-stack skeleton: an Express API in `server/` and a React (Vite) client in `client/`.

This repo also packages the **Waypoint QA Toolkit**, a Claude Code plugin built
across the bootcamp — see the four sections at the bottom of this README, plus
[`examples/`](examples/) for real worked examples.

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

---

# Waypoint QA Toolkit (Claude Code plugin)

The rest of this README documents the Claude Code plugin also packaged in this
repo. It bundles every piece of custom Claude Code tooling built across the
bootcamp into one installable unit: four agents, three skills, four hooks, and
four slash commands, covering the everyday QA workflow this app supports —
writing test cases, filing bugs, reviewing changes, and tracking flaky tests.

## Build

The toolkit is four agents, each backed by a skill or a direct data source,
plus the hooks and commands that trigger them:

| Component | Type | What it does |
|---|---|---|
| `bug-report-formatter` | agent + skill | Turns a scribbled bug note into a structured ticket matching `CLAUDE.md`'s Bug Report Fields exactly. |
| `test-writer` | agent + skill | Generates a full ISTQB-style test suite (happy path, boundaries, equivalence partitions, negatives) for a described feature. |
| `qa-reviewer` | agent + skill | Reviews a file, feature, or diff from a QA tester's angle — missing validation, error handling, unclear messages, missing confirmations, accessibility — grouped by `CLAUDE.md`'s severity levels. |
| `flake-analyzer` | agent (no skill; reads the live SQLite DB directly) | Computes flakiness scores from real pass/fail history and writes AI-reasoned root-cause hypotheses back to the database. |

Three of the four agents delegate their methodology to a skill
(`.claude/skills/bug-report-formatter/`, `.claude/skills/test-generator/`,
`.claude/skills/qa-review/`) so the checklist/format logic lives in one place
and the agent file stays focused on process. `flake-analyzer` has no skill
because its job is schema-specific SQL, not a reusable methodology.

Four slash commands round the toolkit out. Only `/analyze-flaky-tests`
delegates to an agent (`flake-analyzer`); `/bug-report`, `/new-test`, and
`/daily-report` are each their own short, guided Q&A that writes straight to
a file (`tests/bugs/`, `tests/manual/`, `tests/daily report/`) — a quicker,
more structured path to the same kind of output the corresponding agent
produces from freeform input, not a wrapper around it.

The **novel use of the kit** is the flaky-test-tracker's closed loop, which is
the one piece that isn't just "an agent you call manually": a developer edits
`server/seed.js` or `server/routes/test-runs.js` (the files that create or
mutate test-result data) → the `flake-analysis-reminder` PostToolUse hook
notices and nudges Claude to re-run `/analyze-flaky-tests` → `flake-analyzer`
recomputes scores and refreshes hypotheses → independently, the *live app*
(no AI involved, just arithmetic) recomputes flakiness on every real test
result and posts a Discord alert the instant a test crosses into "flaky" →
the `/flaky-tests` page reads both the live score and whatever hypothesis
text the subagent has written so far. Detection is fast and free; the
reasoning is genuinely AI work, done asynchronously.

**Second integration**: the flaky-test count also appears as its own metric
card on the app's Dashboard, not just on the dedicated `/flaky-tests` page.

**Unprompted enhancement**: `/analyze-flaky-tests` itself — the original
request only asked for the `flake-analyzer` agent to exist; the slash command
was added on top so it's a one-line invocation instead of asking for the
agent by name.

## Validation

Every component produces real output against real data, not zeros or a
crash:

- `bug-report-formatter` and `test-writer`'s output already exists in this
  repo — `tests/bugs/*.md` and `tests/manual/*.md` are real files these
  tools wrote, each following `CLAUDE.md`'s exact field shape (Title, Steps
  to Reproduce, Expected, Actual, Severity, Priority, Status for bugs;
  Preconditions, Steps, Expected Result, Severity, Priority, Status for test
  cases).
- `qa-reviewer` found and helped fix real bugs during the App Polish Pass —
  not stylistic nitpicks. Examples: a chart component that would crash the
  entire app (no `ErrorBoundary` exists) on an unrecognized status value; a
  page that could get stuck on "Loading..." forever with no error shown; a
  "Download HTML" link that would navigate the whole single-page app away to
  a raw JSON error response on failure. Fourteen pages were reviewed this
  way, one at a time, each finding verified live before being called fixed.
- `flake-analyzer` produces varied, evidence-grounded hypotheses, not
  templated filler — e.g. it read one test case's actual failure notes
  ("results list still shows the unfiltered list for ~1s") and concluded a
  specific mechanism (a UI render race), rather than a generic "flaky test"
  guess.

**What I noticed in the data, and what I'd do differently**: the flakiness
formula (adjacent pass/fail flips ÷ decided-result count) correctly tells a
genuinely flaky test apart from one that's just consistently broken — a test
that always fails scores 0, not 1, since it never *flips*. With real
production data instead of seeded/demo data, the next useful step would be
recency-weighting the score (a test that started flipping this week matters
more than one that flipped once months ago), correlating flips with
environment/browser notes, and flagging duration outliers as a separate
signal from pass/fail flips. This note is also shown in-app, in the
`/flaky-tests` page's info popover.

## Polish

The app this toolkit ships with went through a dedicated, systematic polish
pass: one global CSS/token foundation commit, then one checkpoint → qa-review
→ fix → commit cycle per page, fourteen pages in total, each verified live.

- **One consistent design system**: a three-color brand palette (periwinkle
  primary, mint secondary, coral for the logo) applied everywhere — buttons,
  links, nav, focus rings — while the separate, intentional
  severity/priority/status badge system (red/orange/green/blue) was
  deliberately left alone, since collapsing it into three colors would make
  severity indistinguishable at a glance.
- **Intentional states**: every list page has a real loading skeleton, an
  empty state, and an error state that's distinct from the empty state (a
  bug caught and fixed on three separate pages during the review — a failed
  fetch was showing "No results yet" instead of an error).
- **Usable phone layout**: tables scroll horizontally within themselves
  instead of blowing out the page, chart grids and page headers wrap instead
  of forcing one unbroken line, and every one of the fourteen pages was
  confirmed at 390px width with zero horizontal overflow.
- **Dark mode throughout**, including catching and fixing a global
  `.error-banner` that had never been made theme-aware despite the rest of
  the palette being fully dark-mode-covered.

**One phrase a grader could use for the aesthetic**: soft, rounded,
periwinkle-and-mint pastel — playful but restrained, with dark mode built in
rather than bolted on.

## Plugin

**Manifest**: `.claude-plugin/plugin.json` at the repo root — metadata only
(`name`, `description`, `version`, `author`), no file list. Claude Code finds
every component below by folder convention.

**Layout** (all under `.claude/`, at the repo root, alongside `client/` and
`server/`):

```
.claude/
├── agents/
│   ├── bug-report-formatter.md
│   ├── flake-analyzer.md
│   ├── qa-reviewer.md
│   └── test-writer.md
├── commands/
│   ├── analyze-flaky-tests.md
│   ├── bug-report.md
│   ├── daily-report.md
│   └── new-test.md
├── hooks/
│   ├── check-response-shape.sh
│   ├── check-severity-enum.sh
│   ├── flake-analysis-reminder.sh
│   └── vocabulary-check.sh
├── skills/
│   ├── bug-report-formatter/SKILL.md
│   ├── qa-review/SKILL.md
│   └── test-generator/SKILL.md
└── settings.json         # registers all four hooks on PostToolUse (Write|Edit)
```

### Install

This toolkit is already active in this repo — `.claude/` is checked in, so
opening this project in Claude Code picks up every agent, skill, hook, and
command automatically. To reuse it in a different project: copy `.claude/`
(and `.claude-plugin/plugin.json` if you want it recognized as a plugin)
into the new repo, then adjust two things that are specific to this app's
layout:

1. `flake-analysis-reminder.sh`'s watched paths (`server/seed.js`,
   `server/routes/test-runs.js`) — point it at wherever the new app writes
   test-result data.
2. `flake-analyzer.md`'s `sqlite3` queries — they assume this app's exact
   schema (`test_cases`, `test_run_results`, `test_runs_v2`,
   `flaky_test_analysis`); adjust table/column names to match.

The other three agents (`bug-report-formatter`, `test-writer`, `qa-reviewer`)
and their skills are schema-agnostic — they work unmodified in any project
that defines the same `CLAUDE.md` field shapes, or with a quick edit to
match a different one.

### Worked examples

Two real prompts from this project's own session history, reproduced
verbatim, are in [`examples/`](examples/):

- [`examples/01-flaky-test-tracker.md`](examples/01-flaky-test-tracker.md) —
  the prompt that built three of this toolkit's pieces in one request: the
  `flake-analyzer` agent, the `flake-analysis-reminder` hook, and the
  `/analyze-flaky-tests` command.
- [`examples/02-app-polish-qa-review.md`](examples/02-app-polish-qa-review.md)
  — the prompt whose one line, "After each page, run qa-review on it," put
  the `qa-reviewer` agent to work fourteen times over, catching real bugs
  well outside the original color/phone-layout scope.
