# Worked example 1 — building the Flaky Test Tracker

This is the actual prompt, reproduced verbatim (including its typo — nothing
here has been cleaned up), that built three of this toolkit's pieces in one
request: the `flake-analyzer` agent, the `flake-analysis-reminder` PostToolUse
hook, and the `/analyze-flaky-tests` command.

## Prompt (verbatim)

> Lets plan out our new feature and everything around it as well as what it will do and how it will be integreted into our app. We are going to do 4 stack actions: plan mode; Discord webhook alert (URL from `.env`); flake-analyzer subagent at `.claude/agents/flake-analyzer.md`; PostToolUse hook on test_run_results. The Feature is 'Flaky Test Tracker'. The feature does 2 things in one new page: It tracks pass/fail history for every test case across every run, so you can see which tests are unreliable over time; And it surfaces the top-10 flakiest tests in a leaderboard, each row with an AI-written root-cause hypothesis ('likely a race condition on shared state', 'depends on a network call that times out', etc.). When a new flake appears (a test that was passing recently flips to intermittent), the feature also posts an alert to a Discord channel so QA's notified the moment something starts going wrong. The feature should run against whatever's already in the app.
>
> Additional rules/criteria: 4 sections (Build, Validation, Polish, Plugin) with 3 gradings (passable/strong/exemplary), aiming for exemplary.
> - Build: Passable=brief works end-to-end + all 4 stack pieces present; Strong=error/empty states + a genuinely useful AI narrative; Exemplary=unprompted enhancement + second integration + novel use of kit.
> - Validation: Passable=meaningful output, not zeros/crashes; Strong=reads cleanly to a non-engineer; Exemplary=a UI note on what was noticed in the data and what I'd do differently.
> - Polish: Passable=one type system/palette/spacing across pages; Strong=intentional hover/loading/empty/error states + usable phone layout; Exemplary=grader can name the aesthetic in one phrase.
> - Plugin: Passable=manifest (name/description/version/author, metadata only, never a file list) + commands/skills/agents/hooks under `.claude/` + README with the four required sections + ≥2 worked examples; Strong=a teammate could install and use the examples immediately; Exemplary=solves something a real QA team would buy.
>
> The created plan should be: showing each prompt in sections, so it isn't too much information for each prompt (all prompts combined must fully build the function and everything else); also visibly understandable for a User (me) to check.

## What it produced

Claude Code entered plan mode, explored the existing `.claude/` conventions
and the app's Discord-alert pattern (already used for failed test results),
then presented a plan broken into ten self-contained prompts covering:
schema + seed data, the flakiness-scoring API, the Discord alert, the
`/flaky-tests` page, a Dashboard integration, the `flake-analyzer` agent plus
`/analyze-flaky-tests` command, the `flake-analysis-reminder` hook, a
portable plugin package, a polish pass, and end-to-end verification. After
approval, all ten were built, and the subagent was actually run against the
real seeded data (not left as an untested stub) before the feature was
called done.

## Where to see it

- `.claude/agents/flake-analyzer.md`
- `.claude/commands/analyze-flaky-tests.md`
- `.claude/hooks/flake-analysis-reminder.sh`
- `server/routes/flaky-tests.js`, `client/src/pages/FlakyTestsPage.jsx`
