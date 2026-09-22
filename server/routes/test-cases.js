import { Router } from 'express';
import db from '../db.js';

const VALID_SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const VALID_PRIORITIES = ['High', 'Medium', 'Low'];
const VALID_STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];

const SEVERITY_RANK_SQL = `
  CASE severity
    WHEN 'Critical' THEN 4 WHEN 'Major' THEN 3 WHEN 'Minor' THEN 2 WHEN 'Trivial' THEN 1 ELSE 0
  END
`;
const PRIORITY_RANK_SQL = `
  CASE priority
    WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0
  END
`;
const SORTABLE_COLUMNS = {
  updated_at: 'updated_at',
  severity: SEVERITY_RANK_SQL,
  priority: PRIORITY_RANK_SQL,
};

function serializeRow(row) {
  return { ...row, steps: JSON.parse(row.steps) };
}

function isSubsequence(needle, haystack) {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
}

function titleMatchesSearch(title, search) {
  const needle = search.toLowerCase();
  return title.split(/\s+/).some((word) => isSubsequence(needle, word.toLowerCase()));
}

export function validatePayload(body, { partial = false } = {}) {
  const errors = [];
  const requiredFields = ['title', 'steps', 'expected_result', 'severity', 'priority'];

  for (const field of requiredFields) {
    const value = body[field];
    const isEmpty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
    if (!partial && isEmpty) {
      errors.push(`${field} is required`);
    }
  }

  if (body.steps !== undefined && !Array.isArray(body.steps)) {
    errors.push('steps must be an array of strings');
  }
  if (body.severity !== undefined && !VALID_SEVERITIES.includes(body.severity)) {
    errors.push(`severity must be one of ${VALID_SEVERITIES.join(', ')}`);
  }
  if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of ${VALID_PRIORITIES.join(', ')}`);
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    errors.push(`status must be one of ${VALID_STATUSES.join(', ')}`);
  }

  return errors;
}

export function handleListTestCases(req, res) {
  const {
    search = '',
    status = '',
    sortBy = 'updated_at',
    sortDir = 'desc',
    page = '1',
    pageSize = '20',
  } = req.query;

  const column = SORTABLE_COLUMNS[sortBy] || SORTABLE_COLUMNS.updated_at;
  const direction = sortDir === 'asc' ? 'ASC' : 'DESC';

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const size = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 20));

  const where = [];
  const params = {};
  if (status) {
    where.push('status = @status');
    params.status = status;
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const rows = db
      .prepare(`SELECT * FROM test_cases ${whereClause} ORDER BY ${column} ${direction}, id DESC`)
      .all(params);

    const filtered = search ? rows.filter((row) => titleMatchesSearch(row.title, search)) : rows;

    const total = filtered.length;
    const offset = (pageNum - 1) * size;
    const pageItems = filtered.slice(offset, offset + size);

    res.json({
      success: true,
      data: { items: pageItems.map(serializeRow), total, page: pageNum, pageSize: size },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export function handleGetTestCase(req, res) {
  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ success: false, data: null, error: 'Test case not found' });
  }
  res.json({ success: true, data: serializeRow(row), error: null });
}

function insertTestCaseRow(payload, now) {
  const { title, preconditions = '', steps, expected_result, severity, priority, status = 'draft' } = payload;

  const result = db
    .prepare(`
      INSERT INTO test_cases (title, preconditions, steps, expected_result, severity, priority, status, created_at, updated_at)
      VALUES (@title, @preconditions, @steps, @expected_result, @severity, @priority, @status, @created_at, @updated_at)
    `)
    .run({
      title,
      preconditions,
      steps: JSON.stringify(steps),
      expected_result,
      severity,
      priority,
      status,
      created_at: now,
      updated_at: now,
    });

  return result.lastInsertRowid;
}

export function handleCreateTestCase(req, res) {
  const errors = validatePayload(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, data: null, error: errors.join('; ') });
  }

  const now = new Date().toISOString();
  const id = insertTestCaseRow(req.body, now);

  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(id);
  res.status(201).json({ success: true, data: serializeRow(row), error: null });
}

export function handleImportTestCases(req, res) {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ success: false, data: null, error: 'rows must be a non-empty array' });
  }

  const now = new Date().toISOString();
  const skipped = [];
  const toInsert = [];

  rows.forEach((row, i) => {
    const errors = validatePayload(row);
    if (errors.length) {
      skipped.push({ row: i + 1, title: row.title || '(untitled)', errors });
    } else {
      toInsert.push(row);
    }
  });

  let imported = 0;
  db.exec('BEGIN');
  try {
    for (const row of toInsert) {
      insertTestCaseRow(row, now);
      imported++;
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    return res.status(500).json({ success: false, data: null, error: err.message });
  }

  res.status(201).json({ success: true, data: { imported, skipped, total: rows.length }, error: null });
}

export function handleUpdateTestCase(req, res) {
  const existing = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, data: null, error: 'Test case not found' });
  }

  const errors = validatePayload(req.body, { partial: true });
  if (errors.length) {
    return res.status(400).json({ success: false, data: null, error: errors.join('; ') });
  }

  const merged = {
    id: req.params.id,
    title: req.body.title ?? existing.title,
    preconditions: req.body.preconditions ?? existing.preconditions,
    steps: req.body.steps ? JSON.stringify(req.body.steps) : existing.steps,
    expected_result: req.body.expected_result ?? existing.expected_result,
    severity: req.body.severity ?? existing.severity,
    priority: req.body.priority ?? existing.priority,
    status: req.body.status ?? existing.status,
    updated_at: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE test_cases
    SET title = @title, preconditions = @preconditions, steps = @steps,
        expected_result = @expected_result, severity = @severity, priority = @priority,
        status = @status, updated_at = @updated_at
    WHERE id = @id
  `).run(merged);

  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: serializeRow(row), error: null });
}

export function handleDeleteTestCase(req, res) {
  const existing = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, data: null, error: 'Test case not found' });
  }
  db.prepare('DELETE FROM test_cases WHERE id = ?').run(req.params.id);
  res.json({ success: true, data: { id: Number(req.params.id) }, error: null });
}

const router = Router();
router.get('/', handleListTestCases);
router.get('/:id', handleGetTestCase);
router.post('/', handleCreateTestCase);
router.post('/import', handleImportTestCases);
router.put('/:id', handleUpdateTestCase);
router.delete('/:id', handleDeleteTestCase);

export default router;
