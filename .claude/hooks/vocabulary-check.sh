#!/usr/bin/env bash
# PostToolUse hook (Write|Edit): fires when a test case markdown file under
# tests/manual/ is written or edited. Scans the newly introduced content for
# forbidden/insensitive words, censors every match IN PLACE in the file
# (first letter kept, rest replaced with stars), and sends a Discord alert
# naming the test case. Never blocks or removes the test case.

set -u

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_response.filePath // .tool_input.file_path // empty' 2>/dev/null)
tool_name=$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null)

if [[ -z "$file_path" ]]; then
  exit 0
fi

# Only test case files under tests/manual/.
case "$file_path" in
  */tests/manual/*.md) ;;
  *) exit 0 ;;
esac

if [[ ! -f "$file_path" ]]; then
  exit 0
fi

# Content to scan: the newly introduced text for Edit, the whole file for
# Write (or anything else).
if [[ "$tool_name" == "Edit" ]]; then
  new_content=$(printf '%s' "$input" | jq -r '.tool_input.new_string // empty' 2>/dev/null)
else
  new_content=$(cat "$file_path")
fi

[[ -z "$new_content" ]] && exit 0

# Forbidden/insensitive word list — extend as needed.
WORDS=(fart suicide idiot moron kill stupid dumb hate)
pattern=$(IFS='|'; echo "${WORDS[*]}")

found=$(grep -iohE "\\b(${pattern})\\b" <<< "$new_content" | tr '[:upper:]' '[:lower:]' | sort -u | paste -sd, -)

[[ -z "$found" ]] && exit 0

# Censor every match in the file itself: keep the first letter, replace the
# rest with stars (e.g. "idiot" -> "i****"). Content is never removed.
if command -v perl >/dev/null 2>&1; then
  perl -pi -e "s/\\b(${pattern})\\b/substr(\$1,0,1) . ('*' x (length(\$1)-1))/gie" "$file_path"
fi

# Test case name for the alert: first Markdown heading (level 1-3) in the file.
test_case_name=$(grep -m1 -E '^#{1,3} ' "$file_path" | sed -E 's/^#{1,3} //')
[[ -z "$test_case_name" ]] && test_case_name="$(basename "$file_path")"

rel_path="${file_path#*/bootcamp-app/}"
message="⚠️ vocabulary-check: Test case \"${test_case_name}\" (${rel_path}) contained flagged word(s): ${found}. Censored in place — not blocked or removed."

# .env lives at the project root; hooks run with cwd = project root.
if [[ -f ".env" ]]; then
  webhook_url=$(grep -E '^DISCORD_WEBHOOK_URL=' .env | tail -1 | cut -d'=' -f2-)
fi

if [[ -n "${webhook_url:-}" ]]; then
  curl -s -X POST "$webhook_url" -H "Content-Type: application/json" \
    -d "$(jq -n --arg c "$message" '{content: $c}')" > /dev/null 2>&1 || true
fi

out_message="vocabulary-check: Test case \"${test_case_name}\" contained flagged word(s) (${found}); censored in place and alerted on Discord."
jq -n --arg msg "$out_message" '{systemMessage: $msg, hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $msg}}'

exit 0
