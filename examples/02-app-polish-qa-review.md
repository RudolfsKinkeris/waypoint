# Worked example 2 — `qa-reviewer` in action across the App Polish Pass

The prompt below is reproduced verbatim. Its one line, "After each page, run
qa-review on it — it'll spot gaps you missed," is what put the `qa-reviewer`
agent to work fourteen times over — once per page in the app.

## Prompt

> Lets create a plan for the App Polish:
> - the palette used for the app everywhere should be - Periwinkle (primary accent), Mint (secondary accent), Coral (mainly for Logo);
> - Drop a checkpoint before each page changes are applied;
> - After each page, run qa-review on it — it'll spot gaps you missed;
> - Phone layout doesn't have to be gorgeous, just functional;
> - verify that the app can be usable on Phone.

## Did

1. Ran two research subagents (a color-literal audit across every `.jsx`/CSS
   file, a phone-layout-risk audit across every page) before planning, so the
   plan was grounded in what actually needed fixing, not assumptions.
2. Presented a plan: one global CSS/color-token foundation pass first, then a
   checkpoint → fix → qa-review → commit cycle per page, fourteen pages in
   total, in risk order (highest-impact pages first).
3. Built the global pass, then went page by page: applied fixes, ran
   `qa-reviewer` scoped to that page's files, triaged every finding (fixed if
   real and in scope, explicitly noted and deferred if bigger than a polish
   fix — never rubber-stamped), then verified the fix live before moving on.
4. For interaction-heavy findings (a discard-confirmation dialog, a search
   debounce), verified with real browser automation — e.g. stubbing
   `window.confirm` to prove a dialog fires with the right message and
   respects Cancel, without ever blocking the session on a real native
   dialog.
5. Closed with a full-app phone sweep confirming zero horizontal overflow at
   390px across all fourteen routes.

## Result

Fifteen commits (the global pass plus one per page), each with real
`qa-reviewer` findings triaged and fixed — not just cosmetic changes. Examples
of what it caught well outside the original color/phone-layout scope:

- A chart component that would crash the entire app (no `ErrorBoundary`
  exists anywhere) on an unrecognized status value.
- A page combining three independent data fetches into one `Promise.all`, so
  one failing endpoint blocked metrics and charts that had otherwise loaded
  successfully.
- A "Download HTML" link that would navigate the whole single-page app away
  to a raw JSON error response if the download ever failed.
- A stale Failed-Step dropdown that could keep showing a value the server
  had never actually saved.

See the commits directly: `git log --oneline --grep="page pass\|Global polish pass"`
(`.claude/agents/qa-reviewer.md` and `.claude/skills/qa-review/SKILL.md` are
the agent/skill that did the reviewing.)
