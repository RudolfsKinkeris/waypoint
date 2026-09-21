#!/usr/bin/env bash
# PostToolUse hook (Write|Edit): warns — never blocks — when a JavaScript,
# TypeScript, or React file's newly written/edited content contains common
# wrong severity words instead of CLAUDE.md's Critical/Major/Minor/Trivial.

set -u

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_response.filePath // .tool_input.file_path // empty' 2>/dev/null)
tool_name=$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null)

if [[ -z "$file_path" ]]; then
  exit 0
fi

# Only JavaScript, TypeScript, and React files.
case "$file_path" in
  *.js|*.jsx|*.ts|*.tsx) ;;
  *) exit 0 ;;
esac

# Scan just the newly introduced content: for Edit, that's new_string; for
# Write (or anything else), the whole file just became "new".
if [[ "$tool_name" == "Edit" ]]; then
  content=$(printf '%s' "$input" | jq -r '.tool_input.new_string // empty' 2>/dev/null)
else
  [[ -f "$file_path" ]] || exit 0
  content=$(cat "$file_path")
fi

[[ -z "$content" ]] && exit 0

found_words=$(grep -iohE '\b(high|medium|low|blocker|cosmetic)\b' <<< "$content" | tr '[:upper:]' '[:lower:]' | sort -u | paste -sd, -)

if [[ -n "$found_words" ]]; then
  rel_path="${file_path#*/bootcamp-app/}"
  message="check-severity-enum: ${rel_path} contains word(s) that look like wrong severity values (${found_words}). CLAUDE.md's Severity values are exactly: Critical, Major, Minor, Trivial."
  jq -n --arg msg "$message" '{systemMessage: $msg, hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $msg}}'
fi

exit 0
