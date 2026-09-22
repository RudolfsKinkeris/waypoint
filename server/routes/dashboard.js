import { Router } from 'express';
import db from '../db.js';

// "Open bugs" = anything not yet resolved/closed: open, in-progress, reopened.
const OPEN_BUG_STATUSES = ['open', 'in-progress', 'reopened'];
const CLOSED_BUG_STATUSES = ['resolved', 'closed'];
const TEST_CASE_STATUS_ORDER = ['draft', 'ready', 'passed', 'failed', 'skipped'];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TREND_WEEKS = 8;
const TREND_RUNS = 10;

function buildActivitySummary(row) {
  if (row.action === 'status_change') {
    return `Bug #${row.bug_id} marked ${row.new_value}`;
  }
  return `Comment added to Bug #${row.bug_id}`;
}

export function handleGetDashboardMetrics(req, res) {
  try {
    const { count: totalTestCases } = db.prepare('SELECT COUNT(*) AS count FROM test_cases').get();

    // Pass rate = passed / (passed + failed) across all recorded run results,
    // excluding skipped (skipped is neither a pass nor a fail).
    const { passed, failed } = db
      .prepare(`
        SELECT
          SUM(CASE WHEN result = 'passed' THEN 1 ELSE 0 END) AS passed,
          SUM(CASE WHEN result = 'failed' THEN 1 ELSE 0 END) AS failed
        FROM test_run_results
      `)
      .get();
    const decided = (passed || 0) + (failed || 0);
    const passRate = decided > 0 ? Math.round(((passed || 0) / decided) * 1000) / 10 : null;

    const { count: openBugs } = db
      .prepare(`SELECT COUNT(*) AS count FROM bugs WHERE status IN (${OPEN_BUG_STATUSES.map(() => '?').join(',')})`)
      .get(...OPEN_BUG_STATUSES);

    // Average duration (minutes) across completed runs only — an in-progress
    // run has no end_time yet, so it can't contribute a duration.
    const { avgMinutes } = db
      .prepare(`
        SELECT AVG((julianday(end_time) - julianday(start_time)) * 24 * 60) AS avgMinutes
        FROM test_runs_v2
        WHERE end_time IS NOT NULL
      `)
      .get();
    const avgRunDurationMinutes = avgMinutes !== null ? Math.round(avgMinutes * 10) / 10 : null;

    const recentRuns = db
      .prepare(`
        SELECT tr.id, tr.status, tr.pass_count, tr.fail_count, tr.skip_count, tr.start_time, tr.end_time, s.name AS suite_name
        FROM test_runs_v2 tr
        JOIN suites s ON s.id = tr.suite_id
        ORDER BY tr.start_time DESC
        LIMIT 10
      `)
      .all();

    const recentActivityRows = db
      .prepare(`
        SELECT ba.id, ba.bug_id, ba.action, ba.old_value, ba.new_value, ba.message, ba.timestamp, b.title AS bug_title
        FROM bug_activity ba
        JOIN bugs b ON b.id = ba.bug_id
        ORDER BY ba.timestamp DESC
        LIMIT 10
      `)
      .all();

    const recentActivity = recentActivityRows.map((row) => ({ ...row, summary: buildActivitySummary(row) }));

    res.json({
      success: true,
      data: {
        metrics: {
          total_test_cases: totalTestCases,
          pass_rate: passRate,
          open_bugs: openBugs,
          avg_run_duration_minutes: avgRunDurationMinutes,
        },
        recent_runs: recentRuns,
        recent_activity: recentActivity,
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

function buildPassRateTrend() {
  const runs = db
    .prepare(`
      SELECT tr.id, tr.pass_count, tr.fail_count, tr.start_time, s.name AS suite_name
      FROM test_runs_v2 tr
      JOIN suites s ON s.id = tr.suite_id
      ORDER BY tr.start_time DESC
      LIMIT ?
    `)
    .all(TREND_RUNS);

  return runs.reverse().map((run) => {
    const decided = run.pass_count + run.fail_count;
    return {
      run_id: run.id,
      suite_name: run.suite_name,
      date: run.start_time,
      pass_rate: decided > 0 ? Math.round((run.pass_count / decided) * 1000) / 10 : null,
    };
  });
}

function buildBugVelocity() {
  const since = new Date(Date.now() - TREND_WEEKS * WEEK_MS).toISOString();

  const opened = db.prepare('SELECT created_at FROM bugs WHERE created_at >= ?').all(since);
  const closed = db
    .prepare(`
      SELECT timestamp FROM bug_activity
      WHERE action = 'status_change' AND new_value IN (${CLOSED_BUG_STATUSES.map(() => '?').join(',')}) AND timestamp >= ?
    `)
    .all(...CLOSED_BUG_STATUSES, since);

  const weeks = [];
  const now = Date.now();
  for (let w = TREND_WEEKS - 1; w >= 0; w--) {
    const weekEnd = now - w * WEEK_MS;
    const weekStart = weekEnd - WEEK_MS;
    weeks.push({
      week_start: new Date(weekStart).toISOString(),
      opened: opened.filter((b) => {
        const t = new Date(b.created_at).getTime();
        return t >= weekStart && t < weekEnd;
      }).length,
      closed: closed.filter((a) => {
        const t = new Date(a.timestamp).getTime();
        return t >= weekStart && t < weekEnd;
      }).length,
    });
  }
  return weeks;
}

function buildStatusBreakdown() {
  const rows = db.prepare('SELECT status, COUNT(*) AS count FROM test_cases GROUP BY status').all();
  const countByStatus = Object.fromEntries(rows.map((r) => [r.status, r.count]));
  return TEST_CASE_STATUS_ORDER.map((status) => ({ status, count: countByStatus[status] || 0 }));
}

export function handleGetDashboardTrends(req, res) {
  try {
    res.json({
      success: true,
      data: {
        pass_rate_trend: buildPassRateTrend(),
        bug_velocity: buildBugVelocity(),
        status_breakdown: buildStatusBreakdown(),
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

const router = Router();
router.get('/metrics', handleGetDashboardMetrics);
router.get('/trends', handleGetDashboardTrends);

export default router;
