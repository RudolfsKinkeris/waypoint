# CLAUDE.md

## Stack

React (Vite) client + Express server, plain JavaScript, split into `client/` and `server/`.

## Severity Levels

- **Critical** — blocks a core flow entirely; no workaround exists.
- **Major** — breaks important functionality but a workaround exists.
- **Minor** — a real defect with limited impact on usability.
- **Trivial** — cosmetic or negligible issue with no functional impact.

## Priority Levels

- **High** — should be addressed as soon as possible, ahead of other work.
- **Medium** — should be addressed in the normal course of work, without urgency.
- **Low** — can be addressed whenever time allows, with no pressing timeline.

## Test Case Fields

- **Title** — the feature or behavior under test.
- **Preconditions** — state required before running the steps.
- **Steps** — numbered, one concrete action per step.
- **Expected Result** — what should happen if the test passes.
- **Severity** — Critical / Major / Minor / Trivial.
- **Priority** — High / Medium / Low.
- **Status** — draft / ready / passed / failed / skipped.

## Bug Report Fields

- **Title** — short summary of the defect.
- **Steps to Reproduce** — numbered, one concrete action per step.
- **Expected** — what should have happened.
- **Actual** — what happened instead.
- **Severity** — Critical / Major / Minor / Trivial.
- **Priority** — High / Medium / Low.
- **Status** — open / in-progress / resolved / closed / reopened.

## API Response Shape

Every endpoint returns:

```json
{ "success": boolean, "data": any, "error": string | null }
```

## File Naming

- Files: `kebab-case`.
- React components: `PascalCase`.
- API handlers: `handleVerbNoun` (e.g. `handleCreateUser`, `handleDeleteBug`).

## Voice

All generated test cases and bug reports are written in clear, direct English. No buzzwords, no filler.
