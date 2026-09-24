# Flaky Test Tracker

A Claude Code plugin that tracks pass/fail history across test runs to surface
flaky tests, writes AI-authored root-cause hypotheses for each one, and posts a
Discord alert the moment a test newly crosses into "flaky." Built for and
demonstrated against [Waypoint](../), a QA-tooling app (React + Express +
SQLite), and packaged here so the same pieces can be installed elsewhere.

## Build

The core idea: pass/fail history already exists in most test-tracking apps —
this plugin's value is in the loop it builds around that data, not in
collecting new data.

```
edit a test-result file
        │
        ▼
PostToolUse hook notices → nudges: "re-run the flake-analyzer"
        │
        ▼
flake-analyzer subagent (on demand, via /analyze-flaky-tests)
  reads real pass/fail history → computes flakiness → writes an
  AI-reasoned root-cause hypothesis per flaky test back to the DB
        │
        ▼
Meanwhile, independently: the live app computes flakiness fresh on
every test result and posts to Discord the instant a test newly
crosses into "flaky" — this never waits on the subagent
        │
        ▼
The UI reads both: always-current scores + whatever hypotheses
the subagent has written so far (a clear "pending" state otherwise)
```

This split is deliberate. Detection and alerting are cheap, deterministic
application code — fast, always-on, correct for real end users with zero AI
cost in production. Writing a plausible root cause is genuinely AI reasoning
work, so it's done by a subagent that reads the actual test steps and failure
notes, not a canned template or a live API call bolted onto the server.

## Validation

Flakiness score, per test case: order its decided (`passed`/`failed`, skips
excluded) results chronologically, count adjacent pass↔fail flips, and divide
by `(count of decided results - 1)`. A test needs at least 3 decided results
and a score ≥0.3 to be flagged flaky — this is why a test that's simply
"broken" (always fails) scores 0, not 1: it never *flips*, so it isn't flaky,
it's just broken. That distinction is the whole point of the feature; a naive
"has this ever failed" metric can't tell the two apart.

The result is real, varied numbers instead of zeros or a crash — a test with a
`P,F,P,F` history scores 1.0 ("obviously flaky"), one with `P,P,P,F` scores
~0.33 ("marginal, worth watching"), and one with `F,F,F,F` scores 0 ("broken,
not flaky"). Read plainly: "this test passed and failed roughly half the time
over its last N runs" — no engineering background required to understand a
leaderboard row.

## Polish

The reference implementation in this repo's `client/src/pages/FlakyTestsPage.jsx`
deliberately introduces zero new design tokens or component classes — it reuses
the host app's existing `.chart-card`, `.badge`, `.test-cases-table` classes and
`--app-accent`/`--chart-*` CSS variables, and its pass/fail/skip colors match
the colors the app's own charts already use. If you adapt this plugin's UI
pieces into a different app, do the same: pull from *that* app's existing
tokens rather than inventing new ones. A flakiness page that looks like a
bolted-on separate tool is a worse outcome than one that looks like it always
shipped with the product.

## Plugin

### Install

1. Copy this `flaky-test-tracker-plugin/` directory into your project (or
   reference it as a local plugin path in your Claude Code plugin config).
2. Your app needs a `DISCORD_WEBHOOK_URL` environment variable for the live
   alert to post anywhere — it no-ops safely (with a console warning) if unset.
3. **Adjust the hook's watched paths.** `hooks/flake-analysis-reminder.sh` has a
   `case "$file_path" in */server/seed.js | */server/routes/test-runs.js)`
   guard — that's this repo's own file layout for "where test-result data gets
   created or mutated." Change it to match wherever *your* app writes test
   results.
4. **Adjust the subagent's queries.** `agents/flake-analyzer.md` queries a
   SQLite DB at `server/data.sqlite` with this repo's exact table/column names
   (`test_cases`, `test_run_results`, `test_runs_v2`, `flaky_test_analysis`).
   If your schema or database engine differs, update the `sqlite3` commands
   accordingly — the *logic* (chronological flip-rate scoring, then a grounded
   hypothesis per flaky test) is what's meant to transfer.
5. The `commands/` and `agents/` directories are auto-discovered by Claude
   Code; no manifest file-listing is needed.

### Worked example 1 — install into this repo and run it

```
$ /analyze-flaky-tests
```

Against this repo's seeded data, the flake-analyzer reads results like:

```
Logout Button Clears Session:      P, F, P, F         → score 1.00
Password Reset Email Is Sent:      P, P, P, F         → score 0.33
Search Bar Returns Matching Results: P, P, F, P        → score 0.67
```

...and writes back hypotheses such as (actual wording depends on the specific
failure notes it reads):

```
Logout Button Clears Session — likely a race condition or state leak
  from a preceding step/test in the same suite (session teardown timing).
Search Bar Returns Matching Results — likely depends on a network call
  or async operation that intermittently times out.
```

The `/flaky-tests` page in the app then shows these hypotheses next to each
test's score and sparkline history instead of "Analysis pending."

### Worked example 2 — the hook firing on a real edit

Say a different team's repo tracks results in `tests/results-writer.js` instead
of `server/routes/test-runs.js`. After adjusting the hook's `case` guard to
match, editing that file (e.g. fixing a bug in how a result gets recorded)
triggers:

```
flake-analysis-reminder: tests/results-writer.js (test-result data) changed —
consider running /analyze-flaky-tests to refresh the flakiness hypotheses.
```

Claude sees this as `additionalContext` on its next turn and can decide to
re-run the analysis right then, keeping the hypotheses from going stale as the
app's result-writing logic evolves.
