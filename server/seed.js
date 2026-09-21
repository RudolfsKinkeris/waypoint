import db from './db.js';

const SEED_TEST_CASES = [
  {
    title: 'Successful Login with Valid Credentials',
    preconditions: 'User has an existing, active account with a known valid username and password.',
    steps: [
      'Navigate to the Log In page.',
      'Enter a valid username into the Username field.',
      'Enter the correct password into the Password field.',
      'Click the "Log In" button.',
    ],
    expected_result: 'The user is redirected to the Main page, with their username shown at the top right corner.',
    severity: 'Critical',
    priority: 'High',
    status: 'passed',
  },
  {
    title: 'Login Fails with Incorrect Password',
    preconditions: 'User has an existing, active account.',
    steps: [
      'Navigate to the Log In page.',
      'Enter a valid username into the Username field.',
      'Enter an incorrect password into the Password field.',
      'Click the "Log In" button.',
    ],
    expected_result: 'An error message is shown telling the user the credentials are invalid, and the user remains on the Log In page.',
    severity: 'Major',
    priority: 'High',
    status: 'ready',
  },
  {
    title: 'Password Reset Email Is Sent',
    preconditions: 'User has a registered email address on an existing account.',
    steps: [
      'Navigate to the Log In page.',
      'Click "Forgot password?".',
      'Enter the registered email address.',
      'Click "Send reset link".',
    ],
    expected_result: 'A password reset email arrives within 2 minutes and contains a valid, working reset link.',
    severity: 'Major',
    priority: 'Medium',
    status: 'draft',
  },
  {
    title: 'Search Bar Returns Matching Results',
    preconditions: 'At least one item exists in the list that matches the search term.',
    steps: [
      'Navigate to a page with a search bar.',
      'Type a search term that matches an existing item.',
      'Press Enter or click the search icon.',
    ],
    expected_result: 'Only items matching the search term are displayed in the results list.',
    severity: 'Minor',
    priority: 'Medium',
    status: 'passed',
  },
  {
    title: 'Logout Button Clears Session',
    preconditions: 'User is currently logged in.',
    steps: [
      'Click the user menu at the top right corner.',
      'Click "Log out".',
    ],
    expected_result: 'The user is redirected to the Log In page and their session is fully cleared; navigating back does not restore the session.',
    severity: 'Critical',
    priority: 'High',
    status: 'failed',
  },
];

export function seedTestCases() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM test_cases').get();
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO test_cases
      (title, preconditions, steps, expected_result, severity, priority, status, created_at, updated_at)
    VALUES
      (@title, @preconditions, @steps, @expected_result, @severity, @priority, @status, @created_at, @updated_at)
  `);

  const now = Date.now();
  SEED_TEST_CASES.forEach((testCase, index) => {
    insert.run({
      ...testCase,
      steps: JSON.stringify(testCase.steps),
      created_at: new Date(now - index * 3600 * 1000).toISOString(),
      updated_at: new Date(now - index * 3600 * 1000).toISOString(),
    });
  });
}

const SEED_SUITES = [
  {
    name: 'Login Regression Suite',
    feature: 'login',
    status: 'ready',
    caseTitles: [
      'Successful Login with Valid Credentials',
      'Login Fails with Incorrect Password',
      'Logout Button Clears Session',
    ],
  },
  {
    name: 'Core Smoke Suite',
    feature: 'smoke',
    status: 'draft',
    caseTitles: [
      'Successful Login with Valid Credentials',
      'Password Reset Email Is Sent',
      'Search Bar Returns Matching Results',
    ],
  },
];

export function seedSuites() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM suites').get();
  if (count > 0) return;

  const testCaseRows = db.prepare('SELECT id, title FROM test_cases ORDER BY id ASC').all();
  if (testCaseRows.length === 0) return;

  const idByTitle = Object.fromEntries(testCaseRows.map((row) => [row.title, row.id]));

  const insertSuite = db.prepare(`
    INSERT INTO suites (name, feature, status, created_at, updated_at)
    VALUES (@name, @feature, @status, @created_at, @updated_at)
  `);
  const insertLink = db.prepare(`
    INSERT INTO suite_test_cases (suite_id, test_case_id, sort_order)
    VALUES (@suite_id, @test_case_id, @sort_order)
  `);

  const now = Date.now();
  SEED_SUITES.forEach((suite, index) => {
    // Skip titles that no longer exist, and dedupe so a fallback never collides
    // with an already-resolved id for the same suite (would violate the
    // suite_id + test_case_id uniqueness constraint).
    const resolvedIds = [...new Set(suite.caseTitles.map((title) => idByTitle[title]).filter(Boolean))];
    if (resolvedIds.length === 0) return;

    const timestamp = new Date(now - index * 3600 * 1000).toISOString();
    const result = insertSuite.run({
      name: suite.name,
      feature: suite.feature,
      status: suite.status,
      created_at: timestamp,
      updated_at: timestamp,
    });

    resolvedIds.forEach((testCaseId, order) => {
      insertLink.run({ suite_id: result.lastInsertRowid, test_case_id: testCaseId, sort_order: order });
    });
  });
}

const SEED_BUGS = [
  {
    title: 'Login Page — Password Field Overlaps Username Field, Blocking Input',
    description:
      'On the Login page, the Password input field visually overlaps the Username field, preventing one of the fields from receiving input.',
    steps_to_reproduce: [
      'Navigate to the Login page.',
      'Observe that the Password field is visually overlapping the Username field.',
      'Click into the overlapping input area.',
      'Attempt to type text into the field.',
    ],
    expected:
      'The Username and Password fields should be displayed separately with no overlap, and each field should accept input independently, with the Password field masking its text.',
    actual:
      'The Password field overlaps the Username field, so only one field can be typed into. Based on the text being visible rather than masked, the field that receives input appears to be the Username field — meaning the Password field is effectively unusable.',
    environment: 'Chrome 128, macOS 15, Desktop, 1440x900',
    severity: 'Critical',
    priority: 'High',
    status: 'open',
    activity: [],
  },
  {
    title: 'Search Results Do Not Update When Search Term Is Cleared',
    description:
      'Clearing the search box on the Test Cases page leaves stale filtered results on screen instead of restoring the full list.',
    steps_to_reproduce: [
      'Navigate to the Test Cases page.',
      'Type a search term that filters the list.',
      'Clear the search box completely.',
    ],
    expected: 'Clearing the search box should immediately restore the full, unfiltered list of test cases.',
    actual: 'The previously filtered (narrowed) results remain on screen until the page is manually refreshed.',
    environment: 'Firefox 130, Windows 11, Desktop',
    severity: 'Minor',
    priority: 'Medium',
    status: 'in-progress',
    activity: [
      {
        old_value: 'open',
        new_value: 'in-progress',
        message: 'Reproduced locally, investigating the search state reset.',
      },
    ],
  },
  {
    title: 'Suite Detail Page Crashes When Suite Has Zero Cases',
    description:
      "Opening a newly created, empty suite's detail page threw a runtime error instead of showing an empty state.",
    steps_to_reproduce: ['Create a new suite with no test cases.', "Open the suite's detail page."],
    expected: 'The page should show a friendly empty state message ("No cases in this suite yet.") without any errors.',
    actual: 'The page crashed with a runtime error instead of rendering the empty state.',
    environment: 'Chrome 128, macOS 15, Desktop',
    severity: 'Major',
    priority: 'High',
    status: 'resolved',
    activity: [
      {
        old_value: 'open',
        new_value: 'in-progress',
        message: 'Confirmed repro, root cause is a null check missing in the case list render.',
      },
      {
        old_value: 'in-progress',
        new_value: 'resolved',
        message: 'Fixed — added an empty-state guard before rendering the cases table.',
      },
    ],
  },
];

export function seedBugs() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM bugs').get();
  if (count > 0) return;

  const insertBug = db.prepare(`
    INSERT INTO bugs
      (title, description, steps_to_reproduce, expected, actual, environment, severity, priority, status, created_at, updated_at)
    VALUES
      (@title, @description, @steps_to_reproduce, @expected, @actual, @environment, @severity, @priority, @status, @created_at, @updated_at)
  `);
  const insertActivity = db.prepare(`
    INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, timestamp)
    VALUES (@bug_id, 'status_change', @old_value, @new_value, @message, @timestamp)
  `);

  const now = Date.now();
  SEED_BUGS.forEach((bug, index) => {
    const createdAt = new Date(now - (index + 1) * 3 * 3600 * 1000);
    const result = insertBug.run({
      title: bug.title,
      description: bug.description,
      steps_to_reproduce: JSON.stringify(bug.steps_to_reproduce),
      expected: bug.expected,
      actual: bug.actual,
      environment: bug.environment,
      severity: bug.severity,
      priority: bug.priority,
      status: bug.status,
      created_at: createdAt.toISOString(),
      updated_at: new Date(now - index * 3600 * 1000).toISOString(),
    });

    bug.activity.forEach((entry, order) => {
      insertActivity.run({
        bug_id: result.lastInsertRowid,
        old_value: entry.old_value,
        new_value: entry.new_value,
        message: entry.message,
        timestamp: new Date(createdAt.getTime() + (order + 1) * 3600 * 1000).toISOString(),
      });
    });
  });
}

export function seedTestRuns() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM test_runs_v2').get();
  if (count > 0) return;

  const suite = db.prepare('SELECT id FROM suites WHERE name = ?').get('Login Regression Suite');
  if (!suite) return;

  const caseLinks = db
    .prepare('SELECT test_case_id FROM suite_test_cases WHERE suite_id = ? ORDER BY sort_order ASC')
    .all(suite.id);
  if (caseLinks.length === 0) return;

  const now = Date.now();
  const startTime = new Date(now - 2 * 3600 * 1000).toISOString();
  const endTime = new Date(now - 1 * 3600 * 1000).toISOString();

  const outcomes = ['passed', 'failed', 'skipped'];
  const notesByOutcome = {
    passed: null,
    failed: 'Login redirected to the Main page, but the username was not shown in the top right corner.',
    skipped: 'Skipped — not exercised in this run.',
  };

  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;
  caseLinks.forEach((_, i) => {
    const outcome = outcomes[i % outcomes.length];
    if (outcome === 'passed') passCount++;
    if (outcome === 'failed') failCount++;
    if (outcome === 'skipped') skipCount++;
  });

  const runResult = db
    .prepare(`
      INSERT INTO test_runs_v2 (suite_id, status, pass_count, fail_count, skip_count, start_time, end_time, created_by)
      VALUES (@suite_id, 'completed', @pass_count, @fail_count, @skip_count, @start_time, @end_time, @created_by)
    `)
    .run({
      suite_id: suite.id,
      pass_count: passCount,
      fail_count: failCount,
      skip_count: skipCount,
      start_time: startTime,
      end_time: endTime,
      created_by: 'seed',
    });

  const runId = runResult.lastInsertRowid;
  const insertResultStmt = db.prepare(`
    INSERT INTO test_run_results (run_id, test_case_id, result, duration_ms, notes, failed_at, alert_sent)
    VALUES (@run_id, @test_case_id, @result, @duration_ms, @notes, @failed_at, @alert_sent)
  `);

  caseLinks.forEach(({ test_case_id: testCaseId }, i) => {
    const outcome = outcomes[i % outcomes.length];
    insertResultStmt.run({
      run_id: runId,
      test_case_id: testCaseId,
      result: outcome,
      duration_ms: 1200 + i * 300,
      notes: notesByOutcome[outcome],
      failed_at: outcome === 'failed' ? endTime : null,
      alert_sent: outcome === 'failed' ? 1 : 0,
    });
  });
}

export function seedReports() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM reports').get();
  if (count > 0) return;

  const run = db
    .prepare(`
      SELECT tr.*, s.name AS suite_name
      FROM test_runs_v2 tr
      JOIN suites s ON s.id = tr.suite_id
      WHERE tr.status = 'completed'
      ORDER BY tr.start_time ASC
      LIMIT 1
    `)
    .get();
  if (!run) return;

  const results = db
    .prepare(`
      SELECT tc.title, tc.severity, tc.priority, trr.result, trr.notes, trr.duration_ms
      FROM test_run_results trr
      JOIN test_cases tc ON tc.id = trr.test_case_id
      WHERE trr.run_id = ?
      ORDER BY trr.id ASC
    `)
    .all(run.id);

  db.prepare(`
    INSERT INTO reports
      (run_id, suite_name, run_date, total_count, passed_count, failed_count, skipped_count, results, generated_at)
    VALUES
      (@run_id, @suite_name, @run_date, @total_count, @passed_count, @failed_count, @skipped_count, @results, @generated_at)
  `).run({
    run_id: run.id,
    suite_name: run.suite_name,
    run_date: run.start_time,
    total_count: results.length,
    passed_count: run.pass_count,
    failed_count: run.fail_count,
    skipped_count: run.skip_count,
    results: JSON.stringify(results),
    generated_at: new Date(new Date(run.end_time).getTime() + 5 * 60 * 1000).toISOString(),
  });
}
