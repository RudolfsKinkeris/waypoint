---
description: Create a new bug report through a short Q&A, saved under tests/bugs/
---

## Goal

Create one new bug report file for this project, saved under `tests/bugs/`.

## Flow — follow these steps in order

1. **Ask five questions**, one at a time, and wait for the user's answer to each before asking the next:
   1. "What did you do?" (the actions leading up to the bug, in order — a rough list or a sentence is fine, you'll clean it up)
   2. "What did you expect to happen?"
   3. "What actually happened?"
   4. "Where did this happen (which page/screen)?"
   5. "What is the severity — Critical, Major, Minor, or Trivial?"

   For question 5, the answer must be one of `Critical`, `Major`, `Minor`, or `Trivial`. If the user gives anything else, ask again until they give a valid value. Never infer or default the severity yourself — always ask.

2. **Turn the "what did you do" answer into a clean numbered list**: one concrete, imperative action per step (e.g. "Navigate to the login page", "Enter valid credentials", "Click the Submit button"). Split run-on answers into separate steps; don't invent steps the user didn't describe.

3. **Build a title** by combining the "where" answer with a short summary of "what actually happened," in title case (e.g. "Login Page — Submit Button Unresponsive").

4. **Get the current timestamp** by running `date` in the shell, formatted as `YYYY-MM-DD HH:MM`.

5. **Write the file** under `tests/bugs/` (create the directory if it doesn't exist yet). Name it `<YYYY-MM-DD>-<kebab-case-slug-of-title>.md`, using the date from step 4. If that filename already exists, append `-2`, `-3`, etc. — never overwrite an existing bug report.

6. **Use exactly this format** for the file contents:

   ```markdown
   # <Title>

   ## Steps to Reproduce
   1. <step 1>
   2. <step 2>
   3. <...>

   ## Expected
   <what the user expected to happen, cleaned up into a clear sentence or two>

   ## Actual
   <what actually happened, cleaned up into a clear sentence or two>

   ## Severity
   <Critical | Major | Minor | Trivial>

   ## Timestamp
   <YYYY-MM-DD HH:MM>
   ```

7. **Confirm to the user**: report the file path you wrote to and show the final file contents.
