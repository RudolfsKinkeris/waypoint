#!/usr/bin/env bash
# PostToolUse hook (Write|Edit): warns — never blocks — when a file under
# server/routes/ is written or edited and one of its res.json(...) calls
# doesn't look like it follows CLAUDE.md's {success, data, error} envelope.

set -u

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_response.filePath // .tool_input.file_path // empty' 2>/dev/null)

# Only check files under server/routes/.
if [[ -z "$file_path" || "$file_path" != *"/server/routes/"* ]]; then
  exit 0
fi

if [[ ! -f "$file_path" ]]; then
  exit 0
fi

violations=()
total=0
max_line=$(wc -l < "$file_path")

while IFS=: read -r line_num _; do
  [[ -z "$line_num" ]] && continue
  total=$((total + 1))
  # Extend forward from the call line to its actual closing `);`, capped at
  # 15 lines, so we never bleed into an unrelated later response call.
  end_line=$line_num
  while (( end_line < line_num + 15 && end_line <= max_line )); do
    this_line=$(sed -n "${end_line}p" "$file_path")
    [[ "$this_line" == *");"* ]] && break
    end_line=$((end_line + 1))
  done
  window=$(sed -n "${line_num},${end_line}p" "$file_path")
  if ! grep -q 'success' <<< "$window" || ! grep -q '\berror\b' <<< "$window"; then
    violations+=("line $line_num")
  fi
done < <(grep -nE '\.json\(' "$file_path")

if [[ ${#violations[@]} -gt 0 ]]; then
  rel_path="${file_path#*/bootcamp-app/}"
  joined=$(IFS=', '; echo "${violations[*]}")
  message="check-response-shape: ${rel_path} has ${#violations[@]} of ${total} response(s) that may not follow CLAUDE.md's {success, data, error} envelope (${joined})."
  jq -n --arg msg "$message" '{systemMessage: $msg, hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $msg}}'
fi

exit 0
