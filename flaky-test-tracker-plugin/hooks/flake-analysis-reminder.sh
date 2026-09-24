#!/usr/bin/env bash
# PostToolUse hook (Write|Edit): notices when a file that creates or mutates
# test-result data (server/seed.js or server/routes/test-runs.js) is edited,
# and nudges Claude to re-run the flake-analyzer subagent so the flakiness
# hypotheses on /flaky-tests stay grounded in the current data. Never blocks.

set -u

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_response.filePath // .tool_input.file_path // empty' 2>/dev/null)

case "$file_path" in
  */server/seed.js | */server/routes/test-runs.js) ;;
  *) exit 0 ;;
esac

rel_path="${file_path#*/bootcamp-app/}"
message="flake-analysis-reminder: ${rel_path} (test-result data) changed — consider running /analyze-flaky-tests to refresh the flakiness hypotheses on /flaky-tests."
jq -n --arg msg "$message" '{systemMessage: $msg, hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $msg}}'

exit 0
