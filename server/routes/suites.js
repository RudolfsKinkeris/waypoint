import { Router } from 'express';
import db from '../db.js';

const VALID_STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed'];

function parseTestCaseRow(row) {
  return { ...row, steps: JSON.parse(row.steps) };
}

const MAX_LENGTHS = { name: 200, feature: 100 };

function validateSuitePayload(body, { partial = false } = {}) {
  const errors = [];
  const requiredFields = ['name', 'feature'];

  for (const field of requiredFields) {
    const value = body[field];
    const isBlank = value === undefined || value === null || (typeof value === 'string' && !value.trim());
    if (!partial && isBlank) {
      errors.push(`${field} is required`);
    } else if (typeof value === 'string' && value.length > MAX_LENGTHS[field]) {
      errors.push(`${field} must be ${MAX_LENGTHS[field]} characters or fewer`);
    }
  }

  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    errors.push(`status must be one of ${VALID_STATUSES.join(', ')}`);
  }

  return errors;
}

export function handleListSuites(req, res) {
  const { status = '', test_case_id: testCaseId = '' } = req.query;

  const where = [];
  const params = {};
  if (status) {
    where.push('s.status = @status');
    params.status = status;
  }
  if (testCaseId) {
    where.push('EXISTS (SELECT 1 FROM suite_test_cases x WHERE x.suite_id = s.id AND x.test_case_id = @testCaseId)');
    params.testCaseId = testCaseId;
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const rows = db
      .prepare(`
        SELECT s.*, COUNT(stc.id) AS case_count
        FROM suites s
        LEFT JOIN suite_test_cases stc ON stc.suite_id = s.id
        ${whereClause}
        GROUP BY s.id
        ORDER BY s.updated_at DESC
      `)
      .all(params);

    res.json({ success: true, data: { items: rows }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export function handleGetSuite(req, res) {
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!suite) {
    return res.status(404).json({ success: false, data: null, error: 'Suite not found' });
  }

  const caseRows = db
    .prepare(`
      SELECT tc.*, stc.sort_order
      FROM suite_test_cases stc
      JOIN test_cases tc ON tc.id = stc.test_case_id
      WHERE stc.suite_id = @suiteId
      ORDER BY stc.sort_order ASC
    `)
    .all({ suiteId: req.params.id });

  res.json({ success: true, data: { ...suite, cases: caseRows.map(parseTestCaseRow) }, error: null });
}

export function handleCreateSuite(req, res) {
  const errors = validateSuitePayload(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, data: null, error: errors.join('; ') });
  }

  const now = new Date().toISOString();
  const { name, feature, status = 'draft' } = req.body;

  const result = db
    .prepare(`
      INSERT INTO suites (name, feature, status, created_at, updated_at)
      VALUES (@name, @feature, @status, @created_at, @updated_at)
    `)
    .run({ name, feature, status, created_at: now, updated_at: now });

  const row = db.prepare('SELECT * FROM suites WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: { ...row, case_count: 0 }, error: null });
}

export function handleUpdateSuite(req, res) {
  const existing = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, data: null, error: 'Suite not found' });
  }

  const errors = validateSuitePayload(req.body, { partial: true });
  if (errors.length) {
    return res.status(400).json({ success: false, data: null, error: errors.join('; ') });
  }

  const merged = {
    id: req.params.id,
    name: req.body.name ?? existing.name,
    feature: req.body.feature ?? existing.feature,
    status: req.body.status ?? existing.status,
    updated_at: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE suites SET name = @name, feature = @feature, status = @status, updated_at = @updated_at
    WHERE id = @id
  `).run(merged);

  const row = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: row, error: null });
}

export function handleDeleteSuite(req, res) {
  const existing = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, data: null, error: 'Suite not found' });
  }
  db.prepare('DELETE FROM suite_test_cases WHERE suite_id = ?').run(req.params.id);
  db.prepare('DELETE FROM suites WHERE id = ?').run(req.params.id);
  res.json({ success: true, data: { id: Number(req.params.id) }, error: null });
}

export function handleAddSuiteCase(req, res) {
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!suite) {
    return res.status(404).json({ success: false, data: null, error: 'Suite not found' });
  }

  const { test_case_id: testCaseId } = req.body;
  if (!testCaseId) {
    return res.status(400).json({ success: false, data: null, error: 'test_case_id is required' });
  }

  const testCase = db.prepare('SELECT id FROM test_cases WHERE id = ?').get(testCaseId);
  if (!testCase) {
    return res.status(404).json({ success: false, data: null, error: 'Test case not found' });
  }

  const alreadyLinked = db
    .prepare('SELECT id FROM suite_test_cases WHERE suite_id = @suiteId AND test_case_id = @testCaseId')
    .get({ suiteId: req.params.id, testCaseId });
  if (alreadyLinked) {
    return res.status(400).json({ success: false, data: null, error: 'Test case is already in this suite' });
  }

  const { maxOrder } = db
    .prepare('SELECT MAX(sort_order) AS maxOrder FROM suite_test_cases WHERE suite_id = ?')
    .get(req.params.id);
  const nextOrder = maxOrder === null ? 0 : maxOrder + 1;

  db.prepare(`
    INSERT INTO suite_test_cases (suite_id, test_case_id, sort_order)
    VALUES (@suiteId, @testCaseId, @sortOrder)
  `).run({ suiteId: req.params.id, testCaseId, sortOrder: nextOrder });

  db.prepare('UPDATE suites SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);

  res.status(201).json({ success: true, data: { suite_id: Number(req.params.id), test_case_id: testCaseId }, error: null });
}

export function handleRemoveSuiteCase(req, res) {
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!suite) {
    return res.status(404).json({ success: false, data: null, error: 'Suite not found' });
  }

  const link = db
    .prepare('SELECT id FROM suite_test_cases WHERE suite_id = @suiteId AND test_case_id = @testCaseId')
    .get({ suiteId: req.params.id, testCaseId: req.params.testCaseId });
  if (!link) {
    return res.status(404).json({ success: false, data: null, error: 'Test case is not in this suite' });
  }

  db.prepare('DELETE FROM suite_test_cases WHERE id = ?').run(link.id);
  db.prepare('UPDATE suites SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);

  res.json({ success: true, data: { suite_id: Number(req.params.id), test_case_id: Number(req.params.testCaseId) }, error: null });
}

export function handleReorderSuiteCases(req, res) {
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!suite) {
    return res.status(404).json({ success: false, data: null, error: 'Suite not found' });
  }

  const { test_case_ids: testCaseIds } = req.body;
  if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
    return res.status(400).json({ success: false, data: null, error: 'test_case_ids must be a non-empty array' });
  }

  const existingLinks = db
    .prepare('SELECT test_case_id FROM suite_test_cases WHERE suite_id = ?')
    .all(req.params.id);
  const existingIds = new Set(existingLinks.map((row) => row.test_case_id));
  const providedIds = new Set(testCaseIds);

  const sameSet =
    existingIds.size === providedIds.size && [...existingIds].every((id) => providedIds.has(id));
  if (!sameSet) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'test_case_ids must contain exactly the test cases currently in this suite',
    });
  }

  const updateOrder = db.prepare(
    'UPDATE suite_test_cases SET sort_order = @sortOrder WHERE suite_id = @suiteId AND test_case_id = @testCaseId'
  );
  testCaseIds.forEach((testCaseId, index) => {
    updateOrder.run({ sortOrder: index, suiteId: req.params.id, testCaseId });
  });

  db.prepare('UPDATE suites SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);

  res.json({ success: true, data: { suite_id: Number(req.params.id), test_case_ids: testCaseIds }, error: null });
}

const router = Router();
router.get('/', handleListSuites);
router.get('/:id', handleGetSuite);
router.post('/', handleCreateSuite);
router.put('/:id', handleUpdateSuite);
router.delete('/:id', handleDeleteSuite);
router.put('/:id/cases/reorder', handleReorderSuiteCases);
router.post('/:id/cases', handleAddSuiteCase);
router.delete('/:id/cases/:testCaseId', handleRemoveSuiteCase);

export default router;
