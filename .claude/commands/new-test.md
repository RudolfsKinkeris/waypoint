---
description: Create a new manual test case through a short Q&A, saved under tests/manual/
argument-hint: [optional feature name]
---

## Goal

Create one new manual test case file for this project, saved under `tests/manual/`.

## Flow — follow these steps in order

1. **Ask three questions**, one at a time, and wait for the user's answer to each before asking the next:
   1. "What feature does this test case cover?"
   2. "What steps does the user take to run this test?" (get the actions in order — it's fine if they give you a rough list or a sentence; you'll clean it up)
   3. "What is the expected result?"

   If `$ARGUMENTS` is non-empty, treat it as the answer to question 1 (the feature) and don't ask that one — just confirm it back to the user in one line and move on to questions 2 and 3.

   Ask only these three questions. Do not ask a fourth question about severity.

2. **Decide the severity yourself** — one of `Critical`, `Major`, `Minor`, or `Trivial` — based on how much impact it would have if this specific test failed in production (e.g. blocks a core flow → Critical/Major; a small visual or edge-case issue → Minor/Trivial). Pick the single best fit and state your reasoning in one short sentence when you report back to the user. Never leave severity blank and never ask the user to pick it.

3. **Turn the steps answer into a clean numbered list**: one concrete, imperative action per step (e.g. "Navigate to the login page", "Enter valid credentials", "Click the Submit button"). Split run-on answers into separate steps; don't invent steps the user didn't describe.

4. **Write the file** under `tests/manual/` (create the directory if it doesn't exist yet). Name it with a kebab-case slug of the feature name, e.g. a feature of "User Login" becomes `tests/manual/user-login.md`. If that filename already exists, append `-2`, `-3`, etc. — never overwrite an existing test case.

5. **Use exactly this format** for the file contents:

   ```markdown
   # <Title — the feature name, in title case>

   ## Steps
   1. <step 1>
   2. <step 2>
   3. <...>

   ## Expected Result
   <the expected result, as the user described it, cleaned up into a clear sentence or two>

   ## Severity
   <Critical | Major | Minor | Trivial>
   ```

6. **Confirm to the user**: report the file path you wrote to, show the final file contents, and give the one-sentence reason for the severity you chose.
