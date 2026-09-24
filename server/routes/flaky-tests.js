import { Router } from 'express';
import db from '../db.js';

const FLAKY_SCORE_THRESHOLD = 0.3;
const MIN_DECIDED_RESULTS = 3;

// Pull one test case's ordered, decided (passed/failed only — skips don't break
// adjacency, they're just excluded) result history and compute its flakiness score:
// the fraction of adjacent pass<->fail transitions. Shared with
// server/routes/test-runs.js so the live alert-on-new-flake check uses the exact
// same formula as this page.
export function computeFlakinessForTestCase(testCaseId) {
  const rows = db
    .prepare(`
      SELECT trr.result, trr.run_id, tr.start_time AS date
      FROM test_run_results trr
      JOIN test_runs_v2 tr ON tr.id = trr.run_id
      WHERE trr.test_case_id = ?
      ORDER BY tr.start_time ASC, trr.run_id ASC
    `)
    .all(testCaseId);

  const decided = rows.filter((row) => row.result === 'passed' || row.result === 'failed');

  let flips = 0;
  for (let i = 1; i < decided.length; i++) {
    if (decided[i].result !== decided[i - 1].result) flips++;
  }

  const flakinessScore = decided.length >= 2 ? flips / (decided.length - 1) : 0;
  const isFlaky = flakinessScore >= FLAKY_SCORE_THRESHOLD && decided.length >= MIN_DECIDED_RESULTS;

  return { flakinessScore, isFlaky, resultSequence: rows };
}

export function handleListFlakyTests(req, res) {
  try {
    const testCases = db
      .prepare(`
        SELECT DISTINCT tc.id, tc.title, tc.severity, tc.priority
        FROM test_cases tc
        JOIN test_run_results trr ON trr.test_case_id = tc.id
        WHERE trr.result IS NOT NULL
      `)
      .all();

    const analysisStmt = db.prepare('SELECT hypothesis, analyzed_at FROM flaky_test_analysis WHERE test_case_id = ?');

    const data = testCases
      .map((testCase) => {
        const { flakinessScore, isFlaky, resultSequence } = computeFlakinessForTestCase(testCase.id);
        const analysis = analysisStmt.get(testCase.id);

        return {
          test_case_id: testCase.id,
          title: testCase.title,
          severity: testCase.severity,
          priority: testCase.priority,
          flakiness_score: flakinessScore,
          is_flaky: isFlaky,
          result_sequence: resultSequence.map((row) => ({ result: row.result, run_id: row.run_id, date: row.date })),
          hypothesis: analysis ? analysis.hypothesis : null,
          analyzed_at: analysis ? analysis.analyzed_at : null,
        };
      })
      .sort((a, b) => b.flakiness_score - a.flakiness_score);

    res.json({ success: true, data, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

const router = Router();
router.get('/', handleListFlakyTests);

export default router;
