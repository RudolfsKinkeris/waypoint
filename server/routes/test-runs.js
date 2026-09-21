import { Router } from 'express';
import db from '../db.js';

const VALID_RESULTS = ['passed', 'failed', 'skipped'];
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

function getRunWithResults(runId) {
  const run = db
    .prepare(`
      SELECT tr.*, s.name AS suite_name, s.feature AS suite_feature
      FROM test_runs_v2 tr
      JOIN suites s ON s.id = tr.suite_id
      WHERE tr.id = ?
    `)
    .get(runId);

  if (!run) return null;

  const results = db
    .prepare(`
      SELECT trr.*, tc.title, tc.severity, tc.priority
      FROM test_run_results trr
      JOIN test_cases tc ON tc.id = trr.test_case_id
      WHERE trr.run_id = ?
      ORDER BY trr.id ASC
    `)
    .all(runId);

  return { ...run, results: results.map((r) => ({ ...r, alert_sent: !!r.alert_sent })) };
}

function recomputeRunCounts(runId) {
  const rows = db.prepare('SELECT result FROM test_run_results WHERE run_id = ?').all(runId);
  const passCount = rows.filter((r) => r.result === 'passed').length;
  const failCount = rows.filter((r) => r.result === 'failed').length;
  const skipCount = rows.filter((r) => r.result === 'skipped').length;
  const allDone = rows.length > 0 && rows.every((r) => r.result !== null);

  const run = db.prepare('SELECT end_time FROM test_runs_v2 WHERE id = ?').get(runId);
  const status = allDone ? 'completed' : 'in-progress';
  const endTime = allDone ? run.end_time || new Date().toISOString() : null;

  db.prepare('UPDATE test_runs_v2 SET pass_count = ?, fail_count = ?, skip_count = ?, status = ?, end_time = ? WHERE id = ?')
    .run(passCount, failCount, skipCount, status, endTime, runId);
}

async function sendDiscordFailureAlert({ runId, testCaseId, notes }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL is not set — skipping failure alert.');
    return false;
  }

  const testCase = db.prepare('SELECT title FROM test_cases WHERE id = ?').get(testCaseId);
  const runLink = `${APP_BASE_URL}/test-runs/${runId}`;
  const content = [
    `🔴 **Test Failed:** ${testCase ? testCase.title : `Test case #${testCaseId}`}`,
    `**Notes:** ${notes && notes.trim() ? notes.trim() : '_No notes provided._'}`,
    `**Run:** ${runLink}`,
  ].join('\n');

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to send Discord failure alert:', err.message);
    return false;
  }
}

export function handleListRuns(req, res) {
  try {
    const rows = db
      .prepare(`
        SELECT tr.*, s.name AS suite_name
        FROM test_runs_v2 tr
        JOIN suites s ON s.id = tr.suite_id
        ORDER BY tr.start_time DESC
      `)
      .all();

    res.json({ success: true, data: { items: rows }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export function handleGetRun(req, res) {
  const run = getRunWithResults(req.params.id);
  if (!run) {
    return res.status(404).json({ success: false, data: null, error: 'Run not found' });
  }
  res.json({ success: true, data: run, error: null });
}

export function handleCreateRun(req, res) {
  const { suite_id: suiteId, created_by: createdBy } = req.body;
  if (!suiteId) {
    return res.status(400).json({ success: false, data: null, error: 'suite_id is required' });
  }

  const suite = db.prepare('SELECT id FROM suites WHERE id = ?').get(suiteId);
  if (!suite) {
    return res.status(404).json({ success: false, data: null, error: 'Suite not found' });
  }

  const caseLinks = db
    .prepare('SELECT test_case_id FROM suite_test_cases WHERE suite_id = ? ORDER BY sort_order ASC')
    .all(suiteId);

  if (caseLinks.length === 0) {
    return res.status(400).json({ success: false, data: null, error: 'Suite has no test cases to run' });
  }

  const now = new Date().toISOString();

  try {
    const runResult = db
      .prepare(`
        INSERT INTO test_runs_v2 (suite_id, status, pass_count, fail_count, skip_count, start_time, end_time, created_by)
        VALUES (@suite_id, 'in-progress', 0, 0, 0, @start_time, NULL, @created_by)
      `)
      .run({ suite_id: suiteId, start_time: now, created_by: createdBy || null });

    const runId = runResult.lastInsertRowid;
    const insertResultStmt = db.prepare(`
      INSERT INTO test_run_results (run_id, test_case_id, result, duration_ms, notes, failed_at, alert_sent)
      VALUES (@run_id, @test_case_id, NULL, NULL, NULL, NULL, 0)
    `);
    caseLinks.forEach(({ test_case_id: testCaseId }) => insertResultStmt.run({ run_id: runId, test_case_id: testCaseId }));

    res.status(201).json({ success: true, data: getRunWithResults(runId), error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export async function handleUpdateRunResult(req, res) {
  const { id: runId, resultId } = req.params;
  const { result, duration_ms: durationMs, notes } = req.body;

  if (!VALID_RESULTS.includes(result)) {
    return res.status(400).json({ success: false, data: null, error: `result must be one of ${VALID_RESULTS.join(', ')}` });
  }

  const existing = db.prepare('SELECT * FROM test_run_results WHERE id = ? AND run_id = ?').get(resultId, runId);
  if (!existing) {
    return res.status(404).json({ success: false, data: null, error: 'Result not found in this run' });
  }

  const now = new Date().toISOString();
  const failedAt = result === 'failed' ? now : existing.failed_at;

  try {
    db.prepare(`
      UPDATE test_run_results
      SET result = @result, duration_ms = @duration_ms, notes = @notes, failed_at = @failed_at
      WHERE id = @id
    `).run({
      id: resultId,
      result,
      duration_ms: durationMs ?? existing.duration_ms ?? null,
      notes: notes ?? existing.notes ?? null,
      failed_at: failedAt,
    });

    if (result === 'failed') {
      const alertSent = await sendDiscordFailureAlert({ runId, testCaseId: existing.test_case_id, notes: notes ?? existing.notes });
      db.prepare('UPDATE test_run_results SET alert_sent = ? WHERE id = ?').run(alertSent ? 1 : 0, resultId);
    }

    recomputeRunCounts(runId);

    res.json({ success: true, data: getRunWithResults(runId), error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

const router = Router();
router.get('/', handleListRuns);
router.get('/:id', handleGetRun);
router.post('/', handleCreateRun);
router.patch('/:id/results/:resultId', handleUpdateRunResult);

export default router;
