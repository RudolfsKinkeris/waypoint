---
name: flake-analyzer
description: Analyzes real pass/fail history in the app's SQLite DB to identify flaky test cases and write AI root-cause hypotheses. Delegate to this agent for "why is this test flaky" or "refresh flakiness analysis" requests.
tools: Read, Grep, Bash
---

## Goal

Read the real test-run history out of `server/data.sqlite`, identify which test cases are flaky (a genuine pass/fail flip pattern across runs — not just "has ever failed"), reason about the most plausible root cause for each one grounded in that test case's actual title/steps/expected result and its failed-run notes, and write those hypotheses back into the database so the app's Flaky Tests page (`/flaky-tests`) can display them.

## Process

1. **Query the flaky test cases and their history.** From the project root, run:
   ```bash
   sqlite3 -json server/data.sqlite "
     SELECT tc.id, tc.title, tc.preconditions, tc.steps, tc.expected_result,
            trr.result, trr.notes, tr.start_time
     FROM test_cases tc
     JOIN test_run_results trr ON trr.test_case_id = tc.id
     JOIN test_runs_v2 tr ON tr.id = trr.run_id
     WHERE trr.result IN ('passed', 'failed')
     ORDER BY tc.id, tr.start_time ASC;
   "
   ```
   This gives you every decided (passed/failed) result for every test case, in chronological order, plus the test case's own definition and any notes recorded on failed runs.

2. **Compute flakiness per test case yourself**, using the exact same formula the live app uses (`server/routes/flaky-tests.js`): group rows by `tc.id`, count adjacent pass↔fail flips in that test case's chronological result sequence, `flakiness_score = flips / (count - 1)` when it has at least 2 decided results, and treat a test case as flaky when `flakiness_score >= 0.3` and it has at least 3 decided results. Skip any test case that isn't flaky by this rule — it doesn't get a hypothesis.

3. **For each flaky test case, reason about a plausible root cause** grounded in what you actually read — the test's `steps` (parsed as a JSON array), `expected_result`, and the `notes` recorded on its failed runs. Don't write generic filler. Ground the hypothesis in the specifics you see, for example:
   - A test whose steps depend on an external call (email delivery, a redirect, a network request) and whose failure notes mention timing → "likely depends on a network call or async operation that intermittently times out."
   - A test that shares setup/state with other tests in the same suite (e.g. relies on session or a previous step's side effect) → "likely a race condition or state leak from a preceding test/step in the same suite."
   - A test whose failure notes describe a rendering/timing detail (e.g. "username not shown yet") → "likely a UI render race — the assertion runs before an async update finishes."
   - If nothing in the steps or notes suggests a specific mechanism, say so honestly rather than guessing: "no clear mechanism from the available steps/notes — worth adding environment or timing details to future failure notes."

4. **Write each hypothesis back to the database.** For each flaky test case:
   ```bash
   sqlite3 server/data.sqlite "
     INSERT INTO flaky_test_analysis (test_case_id, flakiness_score, hypothesis, analyzed_at)
     VALUES (<test_case_id>, <flakiness_score>, '<hypothesis, single-quotes escaped as ''>', '<current UTC ISO timestamp>')
     ON CONFLICT(test_case_id) DO UPDATE SET
       flakiness_score = excluded.flakiness_score,
       hypothesis = excluded.hypothesis,
       analyzed_at = excluded.analyzed_at;
   "
   ```
   Get the current UTC ISO timestamp with `date -u +"%Y-%m-%dT%H:%M:%S.000Z"`. Escape any single quote in the hypothesis text by doubling it (`'` → `''`) before interpolating into the SQL string.

5. **Report back concisely**: which test cases you analyzed (title + computed score), and a one-line hypothesis summary for each — not a full dump of your reasoning. If no test case met the flaky threshold, say that plainly instead of forcing a result.
