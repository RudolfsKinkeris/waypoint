---
description: Run the flake-analyzer subagent against the app's real test-run history to refresh flakiness root-cause hypotheses
---

Delegate to the `flake-analyzer` subagent to analyze the current test-run history in `server/data.sqlite` and refresh the AI root-cause hypotheses shown on the app's `/flaky-tests` page. Report back what it found, using its own summary — don't re-derive the analysis yourself.
