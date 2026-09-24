# Worked example 2 — `qa-reviewer` in action across the App Polish Pass

This prompt is reproduced verbatim. Its one line, "After each page, run
qa-review on it — it'll spot gaps you missed," is what put the `qa-reviewer`
agent to work fourteen times over — once per page in the app.

## Prompt (verbatim)

> Lets create a plan for the App Polish:
> - the palette used for the app everywhere should be - Periwinkle (primary accent), Mint (secondary accent), Coral (mainly for Logo);
> - Drop a checkpoint before each page changes are applied;
> - After each page, run qa-review on it — it'll spot gaps you missed;
> - Phone layout doesn't have to be gorgeous, just functional;
> - verify that the app can be usable on Phone.

## What it produced

A plan covering a global CSS/color-token foundation pass, then one
checkpoint → qa-review → fix → commit cycle per page across all fourteen
pages in the app. The `qa-reviewer` agent was delegated to once per page,
scoped to that page's files, and its findings were triaged (fixed if real
and in scope, explicitly noted and deferred if bigger than a polish fix) —
not rubber-stamped. It caught real bugs well outside the original
color/phone-layout ask, including:

- A chart component that would crash the entire app (no `ErrorBoundary`
  exists anywhere) if it ever received a status value outside its hardcoded
  set.
- A page that combined three independent data fetches into one `Promise.all`,
  so one failing endpoint blocked metrics and charts that had otherwise
  loaded successfully.
- A "Download HTML" link that would navigate the whole single-page app away
  to a raw JSON error response if the download ever failed.
- A stale Failed-Step dropdown that could keep showing a value the server
  had never actually saved.

Each finding was verified live (via the Playwright browser tools) before
being reported as fixed, not just assumed from reading the diff.

## Where to see it

- Fifteen commits, one per polish-pass step (the global foundation pass plus
  one per page), in this repo's git history — e.g.
  `git log --oneline --grep="page pass\|Global polish pass"`
- `.claude/agents/qa-reviewer.md` and `.claude/skills/qa-review/SKILL.md`
