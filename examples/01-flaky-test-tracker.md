# Worked example 1 — building the Flaky Test Tracker

The prompt below is reproduced verbatim — unedited, typo included — because
it's the real prompt that built three of this toolkit's pieces in one
request: the `flake-analyzer` agent, the `flake-analysis-reminder`
PostToolUse hook, and the `/analyze-flaky-tests` command.

## Prompt

> Lets plan out our new feature and everything around it as well as what it will do and how it will be integreted into our app. We are going to do 4 stack actions: plan mode; Discord webhook alert (URL from `.env`); flake-analyzer subagent at `.claude/agents/flake-analyzer.md`; PostToolUse hook on test_run_results. The Feature is 'Flaky Test Tracker'. The feature does 2 things in one new page: It tracks pass/fail history for every test case across every run, so you can see which tests are unreliable over time; And it surfaces the top-10 flakiest tests in a leaderboard, each row with an AI-written root-cause hypothesis ('likely a race condition on shared state', 'depends on a network call that times out', etc.). When a new flake appears (a test that was passing recently flips to intermittent), the feature also posts an alert to a Discord channel so QA's notified the moment something starts going wrong. The feature should run against whatever's already in the app.
>
> Additional rules/criteria: 4 sections (Build, Validation, Polish, Plugin) with 3 gradings (passable/strong/exemplary), aiming for exemplary.
> - Build: Passable=brief works end-to-end + all 4 stack pieces present; Strong=error/empty states + a genuinely useful AI narrative; Exemplary=unprompted enhancement + second integration + novel use of kit.
> - Validation: Passable=meaningful output, not zeros/crashes; Strong=reads cleanly to a non-engineer; Exemplary=a UI note on what was noticed in the data and what I'd do differently.
> - Polish: Passable=one type system/palette/spacing across pages; Strong=intentional hover/loading/empty/error states + usable phone layout; Exemplary=grader can name the aesthetic in one phrase.
> - Plugin: Passable=manifest (name/description/version/author, metadata only, never a file list) + commands/skills/agents/hooks under `.claude/` + README with the four required sections + ≥2 worked examples; Strong=a teammate could install and use the examples immediately; Exemplary=solves something a real QA team would buy.
>
> The created plan should be: showing each prompt in sections, so it isn't too much information for each prompt (all prompts combined must fully build the function and everything else); also visibly understandable for a User (me) to check.

## Did

1. Entered plan mode (as requested) instead of building immediately.
2. Explored the existing `.claude/agents`/`commands`/`hooks` conventions and
   the app's pre-existing Discord failure-alert pattern, so the new pieces
   would match established style rather than invent a new one.
3. Ran two parallel research subagents to validate the design before
   presenting it: one checking the plan against the app's real DB schema and
   conventions, one verifying the actual current Claude Code plugin/hook
   mechanics rather than assuming them.
4. Presented a plan broken into ten self-contained prompts (schema + seed
   data, the flakiness-scoring API, the Discord alert, the `/flaky-tests`
   page, a Dashboard integration, the `flake-analyzer` agent +
   `/analyze-flaky-tests` command, the `flake-analysis-reminder` hook, a
   portable plugin package, a polish pass, end-to-end verification) and
   waited for approval before writing any code.
5. After approval, built all ten prompts in order, then actually ran the
   `flake-analyzer` subagent against the real seeded data — not left as an
   untested stub — so the feature showed genuine hypotheses on first look.

## Result

A working `/flaky-tests` page showing real, varied flakiness scores and
AI-written root-cause hypotheses grounded in actual failure notes; a live
Discord alert that fires the moment a test crosses into "flaky"; and three
new files this toolkit still uses today:

- `.claude/agents/flake-analyzer.md`
- `.claude/commands/analyze-flaky-tests.md`
- `.claude/hooks/flake-analysis-reminder.sh`

(Application code: `server/routes/flaky-tests.js`,
`client/src/pages/FlakyTestsPage.jsx`.)
