---
name: qa-review
description: Review a code change, feature, or file from a QA tester's angle and report what could break. Trigger on requests like "QA review", "review this from a QA angle", "test my change", "what could break", "review this for bugs a tester would catch", or "check this before I ship it".
---

## Goal

Review the code, diff, or feature the user points to — not as a code-quality or architecture review, but the way a QA tester would: looking for what a real user could hit that would break, confuse, or frustrate them. Report findings as a structured list grouped by severity, using the severity values defined in `CLAUDE.md`.

## Scope

If the user doesn't name a specific file, diff, or feature, review the current uncommitted changes (`git diff` / `git status`) in the working directory. If they name a file, feature, or area, review that instead. Read the actual code — don't guess at behavior from file names alone.

## What to look for

Go through the reviewed code/feature checking each of these angles. Skip a category only if it genuinely doesn't apply (e.g. no destructive actions exist in this code) — don't force a finding that isn't real.

1. **Missing validation** — required fields that aren't checked, no length/format/range limits enforced, client-side validation with no matching server-side check (or vice versa), no check for duplicate/conflicting data where uniqueness matters.

2. **Missing error handling** — network or API failures with no catch/fallback, promises without `.catch` or try/catch, no handling for empty states (empty lists, null data), no handling for slow/failed responses, unhandled edge cases in conditionals (e.g. an `else` branch that's silently missing).

3. **Unclear user-facing messages** — error messages that are vague ("Something went wrong"), expose raw technical detail (stack traces, SQL errors, HTTP status codes) to the user, don't tell the user what to do next, or are missing entirely where an action fails silently.

4. **Missing confirmation for destructive actions** — delete, remove, discard, overwrite, or any irreversible action that fires immediately on click with no "are you sure" step, and no undo path afterward.

5. **Accessibility issues** — interactive elements with no accessible label (icon-only buttons with no `aria-label`), form inputs with no associated `<label>`, insufficient color contrast, functionality that only works with a mouse (no keyboard access), missing focus management (e.g. a modal that doesn't trap or return focus), content conveyed by color alone.

## Output Format

Group findings under one heading per severity, using exactly the four values from `CLAUDE.md`: **Critical**, **Major**, **Minor**, **Trivial**. Only include headings that have at least one finding. Under each heading, list findings as:

- **<short title of the issue>** — <file path and line, if applicable> — <what happens and why it matters to a real user> — *Suggested fix:* <a short, concrete fix>

Order findings within each severity group by which category they came from (validation, error handling, messaging, confirmation, accessibility), so related issues stay together.

If no issues are found in a category, don't mention it — don't pad the output with "no issues found" filler per category. If the review turns up nothing at all, say so plainly in one line rather than presenting an empty structure.

## Severity Guidance

Use `CLAUDE.md`'s definitions to place each finding:
- **Critical** — blocks a core flow entirely; no workaround exists (e.g. a form that can never be submitted, a delete with no confirmation that wipes required data).
- **Major** — breaks important functionality but a workaround exists (e.g. a missing validation that lets bad data through but doesn't crash anything, an error that's swallowed silently but doesn't corrupt state).
- **Minor** — a real defect with limited impact on usability (e.g. a vague error message, a missing aria-label on a secondary icon button).
- **Trivial** — cosmetic or negligible issue with no functional impact (e.g. minor wording inconsistency, a non-blocking contrast issue on a low-traffic screen).
