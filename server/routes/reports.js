import { Router } from 'express';
import db from '../db.js';

function getRunSnapshot(runId) {
  const run = db
    .prepare(`
      SELECT tr.*, s.name AS suite_name
      FROM test_runs_v2 tr
      JOIN suites s ON s.id = tr.suite_id
      WHERE tr.id = ?
    `)
    .get(runId);

  if (!run) return null;

  const results = db
    .prepare(`
      SELECT tc.title, tc.severity, tc.priority, trr.result, trr.notes, trr.duration_ms
      FROM test_run_results trr
      JOIN test_cases tc ON tc.id = trr.test_case_id
      WHERE trr.run_id = ?
      ORDER BY trr.id ASC
    `)
    .all(runId);

  return { run, results };
}

function parseReportRow(row) {
  return { ...row, results: JSON.parse(row.results) };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const RESULT_LABELS = { passed: 'Passed', failed: 'Failed', skipped: 'Skipped', pending: 'Pending' };

function buildReportHtml(report, { autoPrint = false } = {}) {
  const decided = report.passed_count + report.failed_count;
  const passRate = decided > 0 ? Math.round((report.passed_count / decided) * 100) : null;

  const rows = report.results
    .map((r) => {
      const outcome = r.result || 'pending';
      return `
        <tr>
          <td>${escapeHtml(r.title)}</td>
          <td><span class="tag tag-severity-${escapeHtml((r.severity || '').toLowerCase())}">${escapeHtml(r.severity)}</span></td>
          <td><span class="tag tag-priority-${escapeHtml((r.priority || '').toLowerCase())}">${escapeHtml(r.priority)}</span></td>
          <td><span class="badge badge-${outcome}">${escapeHtml(RESULT_LABELS[outcome] || outcome)}</span></td>
          <td class="notes-cell">${escapeHtml(r.notes || '—')}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Test Report — ${escapeHtml(report.suite_name)}</title>
<style>
  * { box-sizing: border-box; }
  :root { color-scheme: light; }
  body {
    font-family: -apple-system, 'Segoe UI', Roboto, system-ui, sans-serif;
    color: #1f2430;
    background: #f5f6f8;
    max-width: 880px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 4rem;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    background: #fff;
    border: 1px solid #e2e5ea;
    border-radius: 12px;
    padding: 2.25rem 2.5rem 2.5rem;
  }

  /* Header */
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 3px solid #7761d1;
    margin-bottom: 1.75rem;
  }
  .report-eyebrow {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #7761d1;
    margin: 0 0 0.4rem;
  }
  .report-title {
    font-size: 1.65rem;
    font-weight: 700;
    margin: 0;
    color: #1f2430;
  }
  .report-header-right {
    text-align: right;
    color: #5f6368;
    font-size: 0.85rem;
    white-space: nowrap;
  }
  .report-header-right strong {
    display: block;
    color: #1f2430;
    font-size: 0.95rem;
  }

  /* Summary cards */
  .summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.9rem;
    margin-bottom: 2rem;
  }
  .summary-card {
    border-radius: 10px;
    padding: 1rem 1.1rem;
    border: 1px solid transparent;
  }
  .summary-value { font-size: 1.9rem; font-weight: 700; line-height: 1; }
  .summary-label {
    margin-top: 0.35rem;
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .summary-card--total { background: #eef1f5; border-color: #dde1e7; }
  .summary-card--total .summary-value, .summary-card--total .summary-label { color: #3c4043; }
  .summary-card--passed { background: #e6f4ea; border-color: #c5e6d1; }
  .summary-card--passed .summary-value, .summary-card--passed .summary-label { color: #1e6f4c; }
  .summary-card--failed { background: #fce8e6; border-color: #f6cdc8; }
  .summary-card--failed .summary-value, .summary-card--failed .summary-label { color: #b3261e; }
  .summary-card--skipped { background: #f1f2f4; border-color: #e2e5ea; }
  .summary-card--skipped .summary-value, .summary-card--skipped .summary-label { color: #5f6368; }

  .pass-rate {
    display: inline-block;
    margin-bottom: 1.75rem;
    font-size: 0.88rem;
    color: #3c4043;
  }
  .pass-rate strong { color: #1f2430; }

  /* Results table */
  table { width: 100%; border-collapse: collapse; }
  th, td {
    text-align: left;
    padding: 0.65rem 0.75rem;
    border-bottom: 1px solid #e9ebee;
    vertical-align: top;
    font-size: 0.9rem;
  }
  th {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #5f6368;
    border-bottom: 2px solid #dde1e7;
  }
  tbody tr:nth-child(even) { background: #fafbfc; }
  .notes-cell { color: #5f6368; }

  .badge, .tag {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .badge-passed { background: #e6f4ea; color: #1e6f4c; }
  .badge-failed { background: #fce8e6; color: #b3261e; }
  .badge-skipped { background: #eceff1; color: #5f6368; }
  .badge-pending { background: #fdf6d8; color: #8a6d00; }

  .tag-severity-critical, .tag-priority-high { background: #fce8e6; color: #b3261e; }
  .tag-severity-major { background: #fdecd8; color: #b3651e; }
  .tag-severity-minor, .tag-priority-medium { background: #fef7d6; color: #8a6d00; }
  .tag-severity-trivial, .tag-priority-low { background: #eceff1; color: #5f6368; }

  /* Footer */
  .report-footer {
    margin-top: 2.25rem;
    padding-top: 1rem;
    border-top: 1px solid #e9ebee;
    display: flex;
    justify-content: space-between;
    color: #8a8f98;
    font-size: 0.78rem;
  }

  @media print {
    body { background: #fff; max-width: none; padding: 0; }
    .sheet { border: none; border-radius: 0; padding: 0; }
    .summary-card, tr, .report-header { break-inside: avoid; }
    table { font-size: 0.85rem; }
    th, td { padding: 0.5rem 0.6rem; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="report-header">
      <div>
        <p class="report-eyebrow">Waypoint &middot; QA Test Report</p>
        <h1 class="report-title">${escapeHtml(report.suite_name)}</h1>
      </div>
      <div class="report-header-right">
        <strong>Run: ${formatDate(report.run_date)}</strong>
        Generated ${formatDate(report.generated_at)}
      </div>
    </div>

    <div class="summary">
      <div class="summary-card summary-card--total">
        <div class="summary-value">${report.total_count}</div>
        <div class="summary-label">Total</div>
      </div>
      <div class="summary-card summary-card--passed">
        <div class="summary-value">${report.passed_count}</div>
        <div class="summary-label">Passed</div>
      </div>
      <div class="summary-card summary-card--failed">
        <div class="summary-value">${report.failed_count}</div>
        <div class="summary-label">Failed</div>
      </div>
      <div class="summary-card summary-card--skipped">
        <div class="summary-value">${report.skipped_count}</div>
        <div class="summary-label">Skipped</div>
      </div>
    </div>

    ${passRate !== null ? `<p class="pass-rate"><strong>${passRate}%</strong> pass rate (of ${decided} decided results)</p>` : ''}

    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Severity</th>
          <th>Priority</th>
          <th>Result</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="report-footer">
      <span>Report #${report.id} &middot; Run #${report.run_id}</span>
      <span>Generated ${formatDate(report.generated_at)}</span>
    </div>
  </div>
  ${autoPrint ? '<script>window.onload = () => window.print();</script>' : ''}
</body>
</html>`;
}

export function handleCreateReport(req, res) {
  const { run_id: runId } = req.body;
  if (!runId) {
    return res.status(400).json({ success: false, data: null, error: 'run_id is required' });
  }

  const snapshot = getRunSnapshot(runId);
  if (!snapshot) {
    return res.status(404).json({ success: false, data: null, error: 'Test run not found' });
  }

  const { run, results } = snapshot;
  const now = new Date().toISOString();

  try {
    const insertResult = db
      .prepare(`
        INSERT INTO reports
          (run_id, suite_name, run_date, total_count, passed_count, failed_count, skipped_count, results, generated_at)
        VALUES
          (@run_id, @suite_name, @run_date, @total_count, @passed_count, @failed_count, @skipped_count, @results, @generated_at)
      `)
      .run({
        run_id: runId,
        suite_name: run.suite_name,
        run_date: run.start_time,
        total_count: results.length,
        passed_count: run.pass_count,
        failed_count: run.fail_count,
        skipped_count: run.skip_count,
        results: JSON.stringify(results),
        generated_at: now,
      });

    const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(insertResult.lastInsertRowid);
    res.status(201).json({ success: true, data: parseReportRow(row), error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export function handleListReports(req, res) {
  try {
    const rows = db
      .prepare(`
        SELECT id, run_id, suite_name, run_date, total_count, passed_count, failed_count, skipped_count, generated_at
        FROM reports
        ORDER BY generated_at DESC
      `)
      .all();

    res.json({ success: true, data: { items: rows }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export function handleGetReport(req, res) {
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ success: false, data: null, error: 'Report not found' });
  }
  res.json({ success: true, data: parseReportRow(row), error: null });
}

export function handleExportReportHtml(req, res) {
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ success: false, data: null, error: 'Report not found' });
  }

  const report = parseReportRow(row);
  const autoPrint = req.query.print === '1';
  const html = buildReportHtml(report, { autoPrint });
  const filename = `report-${report.id}-${report.suite_name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.html`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Printing needs the browser to render the file inline (in a tab) rather
  // than saving it, so only the plain download request gets `attachment`.
  if (!autoPrint) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
  res.send(html);
}

const router = Router();
router.get('/', handleListReports);
router.get('/:id', handleGetReport);
router.get('/:id/export/html', handleExportReportHtml);
router.post('/', handleCreateReport);

export default router;
