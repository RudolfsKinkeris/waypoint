---
description: Create a new daily report through a short Q&A, saved under tests/daily report/
---

## Goal

Create one new daily report file for this project, saved under `tests/daily report/`.

## Flow — follow these steps in order

1. **Ask "How many tasks did you do today?"** and wait for a number, N.

2. **Ask "Describe or give the name of the task."** once per task, N times in total (e.g. "Task 1 — describe or give the name of the task.", "Task 2 — ...", etc.), waiting for the answer each time before asking about the next task.

3. **Ask "Which one is complete and which one is In progress?"** once, after all N tasks have been named. Take the user's answer (which may name tasks individually or group them) and sort every task from step 2 into exactly one of two buckets: `Completed` or `In Progress`. Every task must end up in one bucket; don't invent a status the user didn't state, and if a task's status is ambiguous, ask a quick follow-up before finalizing.

   Ask only these three questions, each just once (question 2 repeats only because it is asked per task).

4. **Build a title**: `Daily Report — <today's date, e.g. September 20, 2026>`.

5. **Get the current timestamp** by running `date` in the shell, formatted as `YYYY-MM-DD HH:MM`.

6. **Write the file** under `tests/daily report/` (create the directory if it doesn't exist yet). Name it `<YYYY-MM-DD>.md`, using the date from step 5. If that filename already exists, append `-2`, `-3`, etc. — never overwrite an existing daily report.

7. **Use exactly this format** for the file contents:

   ```markdown
   # <Title>

   ## Tasks
   1. <task 1>
   2. <task 2>
   3. <...>

   ## Completed
   - <task>
   - <...>

   ## In Progress
   - <task>
   - <...>

   ## Timestamp
   <YYYY-MM-DD HH:MM>
   ```

8. **Confirm to the user**: report the file path you wrote to and show the final file contents.
