---
name: test-generator
description: Generate manual or automated test cases for a feature, field, form, or API endpoint using ISTQB boundary-value analysis. Trigger on any request to write, generate, create, or come up with test cases, test scenarios, or ISTQB-style tests for something in this project.
---

## Goal

Generate a complete set of test cases for the feature or input the user describes, using **ISTQB boundary-value analysis** plus equivalence partitioning and negative testing, formatted in the test case shape defined in `CLAUDE.md`.

## Process

1. **Identify the inputs.** For the feature described, list every field or parameter involved and, for each, its type, whether it's required, and its valid range or length (numeric range, string length, allowed values, format). If the range isn't stated, infer a reasonable one from context and state the assumption in the test case's preconditions or title.

2. **Generate a happy path case.** One test case using fully valid, typical input for every field, exercising the feature's normal successful flow.

3. **Generate boundary-value cases**, per ISTQB boundary-value analysis, for every field that has a min/max range or length limit:
   - Minimum valid value
   - Maximum valid value
   - Just below minimum (min − 1) — expected to fail validation
   - Just above maximum (max + 1) — expected to fail validation
   - Empty value (if the field is otherwise required)
   - Whitespace-only value
   - Very long value (well beyond the maximum, e.g. 10x the limit or a very long string) to check for truncation, overflow, or crashes

4. **Generate equivalence partition cases** for each field: one representative case from each valid partition (e.g. valid email format vs. valid phone-shaped string, if the field accepts multiple valid shapes) and one representative from each invalid partition not already covered by boundary values.

5. **Generate negative cases**:
   - Wrong type (e.g. a string where a number is expected, a number where a boolean is expected)
   - Missing required field
   - Duplicate entry (e.g. creating a record that violates a uniqueness constraint, such as an existing username or ID)

6. **Skip irrelevant categories.** If a field has no numeric/length bound, skip min/max boundary cases for it but still cover empty/missing/wrong-type/duplicate where applicable. Don't invent boundaries that don't exist in the feature.

7. **Assign severity and priority per test case**, not uniformly:
   - Happy path and cases guarding required/critical behavior: higher severity/priority (Critical/Major, High).
   - Edge/boundary and rare negative cases: lower severity/priority (Minor/Trivial, Medium/Low) unless the boundary protects something critical (e.g. an auth field).
   - Use exactly the values defined in `CLAUDE.md`: Severity is one of `Critical / Major / Minor / Trivial`; Priority is one of `High / Medium / Low`.

8. **Set status to `draft`** for every generated test case, since none have been run yet, unless the user says otherwise.

## Output Format

Use exactly the Test Case Fields shape from `CLAUDE.md` for every test case — plain readable text, not wrapped in a code block, one test case at a time:

Title: <feature or behavior under test, including which case type it is, e.g. "Username Field Rejects Value Below Minimum Length">

Preconditions: <state required before running the steps, including any assumed valid range/limits>

Steps:
1. <step 1>
2. <step 2>
3. <...>

Expected Result: <what should happen — a validation error for invalid/boundary-fail cases, success for valid/boundary-pass cases>

Severity: <Critical | Major | Minor | Trivial>

Priority: <High | Medium | Low>

Status: draft

## Coverage Checklist

Before presenting the results, confirm the set includes:
- [ ] One happy path case
- [ ] Boundary cases per bounded field: min, max, min−1, max+1, empty, whitespace, very long
- [ ] At least one valid and one invalid equivalence partition per field (beyond boundaries)
- [ ] Wrong type
- [ ] Missing required field
- [ ] Duplicate entry (when uniqueness applies)

If the feature has multiple fields, group the test cases field by field, and call out clearly which field/scenario each test case targets in its title.
