import { Router } from 'express';
import db from '../db.js';

const VALID_SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const VALID_PRIORITIES = ['High', 'Medium', 'Low'];
const VALID_STATUSES = ['open', 'in-progress', 'resolved', 'closed', 'reopened'];

const ALLOWED_TRANSITIONS = {
  open: ['in-progress', 'closed'],
  'in-progress': ['resolved', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in-progress', 'closed'],
};

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
  title: 'title',
  updated_at: 'updated_at',
  severity: SEVERITY_RANK_SQL,
  priority: PRIORITY_RANK_SQL,
  status: 'status',
};

function serializeBugRow(row) {
  return {
    ...row,
    steps_to_reproduce: JSON.parse(row.steps_to_reproduce),
    allowed_next_statuses: ALLOWED_TRANSITIONS[row.status] || [],
  };
}

function validateBugPayload(body, { partial = false } = {}) {
  const errors = [];
  const requiredFields = ['title', 'steps_to_reproduce', 'expected', 'actual', 'severity', 'priority'];

  for (const field of requiredFields) {
    const value = body[field];
    const provided = value !== undefined;
    const isEmpty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

    if (!partial && isEmpty) {
      errors.push(`${field} is required`);
    } else if (partial && provided && isEmpty) {
      // Partial updates may omit a field, but an explicitly-sent blank value for
      // a required field is still invalid — otherwise PUT could silently wipe it.
      errors.push(`${field} cannot be set to empty`);
    }
  }

  if (body.steps_to_reproduce !== undefined) {
    if (!Array.isArray(body.steps_to_reproduce)) {
      errors.push('steps_to_reproduce must be an array of strings');
    } else if (body.steps_to_reproduce.some((step) => typeof step !== 'string' || !step.trim())) {
      // Every step is rendered directly as a React child on the detail page —
      // a non-string entry (object, boolean, etc.) would crash that page with
      // no way to recover short of editing the database directly.
      errors.push('steps_to_reproduce must contain only non-empty strings');
    }
  }
  if (body.severity !== undefined && !VALID_SEVERITIES.includes(body.severity)) {
    errors.push(`severity must be one of ${VALID_SEVERITIES.join(', ')}`);
  }
  if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of ${VALID_PRIORITIES.join(', ')}`);
  }

  return errors;
}

export function handleListBugs(req, res) {
  const {
    search = '',
    status = '',
    severity = '',
    priority = '',
    sortBy = 'updated_at',
    sortDir = 'desc',
  } = req.query;

  const column = SORTABLE_COLUMNS[sortBy] || SORTABLE_COLUMNS.updated_at;
  const direction = sortDir === 'asc' ? 'ASC' : 'DESC';

  const where = [];
  const params = {};
  if (status) {
    where.push('status = @status');
    params.status = status;
  }
  if (severity) {
    where.push('severity = @severity');
    params.severity = severity;
  }
  if (priority) {
    where.push('priority = @priority');
    params.priority = priority;
  }
  if (search) {
    where.push('(title LIKE @search OR description LIKE @search)');
    params.search = `%${search}%`;
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const rows = db
      .prepare(`SELECT * FROM bugs ${whereClause} ORDER BY ${column} ${direction}, id DESC`)
      .all(params);

    res.json({ success: true, data: { items: rows.map(serializeBugRow) }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export function handleGetBug(req, res) {
  const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ success: false, data: null, error: 'Bug not found' });
  }

  const activity = db
    .prepare('SELECT * FROM bug_activity WHERE bug_id = ? ORDER BY timestamp ASC, id ASC')
    .all(req.params.id);

  res.json({ success: true, data: { ...serializeBugRow(row), activity }, error: null });
}

export function handleCreateBug(req, res) {
  const errors = validateBugPayload(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, data: null, error: errors.join('; ') });
  }

  const now = new Date().toISOString();
  const {
    title,
    description = '',
    steps_to_reproduce: stepsToReproduce,
    expected,
    actual,
    environment = '',
    severity,
    priority,
  } = req.body;

  try {
    const result = db
      .prepare(`
        INSERT INTO bugs
          (title, description, steps_to_reproduce, expected, actual, environment, severity, priority, status, created_at, updated_at)
        VALUES
          (@title, @description, @steps_to_reproduce, @expected, @actual, @environment, @severity, @priority, 'open', @created_at, @updated_at)
      `)
      .run({
        title,
        description,
        steps_to_reproduce: JSON.stringify(stepsToReproduce),
        expected,
        actual,
        environment,
        severity,
        priority,
        created_at: now,
        updated_at: now,
      });

    const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: { ...serializeBugRow(row), activity: [] }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export function handleUpdateBug(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, data: null, error: 'Bug not found' });
  }

  const errors = validateBugPayload(req.body, { partial: true });
  if (errors.length) {
    return res.status(400).json({ success: false, data: null, error: errors.join('; ') });
  }

  // Status is intentionally not editable here — it can only change through
  // PATCH /:id/status, which enforces valid transitions and logs to bug_activity.
  const merged = {
    id: req.params.id,
    title: req.body.title ?? existing.title,
    description: req.body.description ?? existing.description,
    steps_to_reproduce: req.body.steps_to_reproduce
      ? JSON.stringify(req.body.steps_to_reproduce)
      : existing.steps_to_reproduce,
    expected: req.body.expected ?? existing.expected,
    actual: req.body.actual ?? existing.actual,
    environment: req.body.environment ?? existing.environment,
    severity: req.body.severity ?? existing.severity,
    priority: req.body.priority ?? existing.priority,
    updated_at: new Date().toISOString(),
  };

  try {
    db.prepare(`
      UPDATE bugs
      SET title = @title, description = @description, steps_to_reproduce = @steps_to_reproduce,
          expected = @expected, actual = @actual, environment = @environment,
          severity = @severity, priority = @priority, updated_at = @updated_at
      WHERE id = @id
    `).run(merged);

    const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: serializeBugRow(row), error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export function handleDeleteBug(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, data: null, error: 'Bug not found' });
  }
  try {
    db.prepare('DELETE FROM bug_activity WHERE bug_id = ?').run(req.params.id);
    db.prepare('DELETE FROM bugs WHERE id = ?').run(req.params.id);
    res.json({ success: true, data: { id: Number(req.params.id) }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export function handleChangeBugStatus(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, data: null, error: 'Bug not found' });
  }

  const { status: newStatus, message = '' } = req.body;
  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return res.status(400).json({ success: false, data: null, error: `status must be one of ${VALID_STATUSES.join(', ')}` });
  }
  if (typeof message === 'string' && message.length > 500) {
    return res.status(400).json({ success: false, data: null, error: 'message must be 500 characters or fewer' });
  }

  const allowedNext = ALLOWED_TRANSITIONS[existing.status] || [];
  if (!allowedNext.includes(newStatus)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: `Cannot move a bug from "${existing.status}" to "${newStatus}". Allowed next status(es): ${allowedNext.join(', ') || 'none'}.`,
    });
  }

  const now = new Date().toISOString();

  try {
    db.prepare('UPDATE bugs SET status = @status, updated_at = @updated_at WHERE id = @id').run({
      status: newStatus,
      updated_at: now,
      id: req.params.id,
    });

    db.prepare(`
      INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, timestamp)
      VALUES (@bug_id, 'status_change', @old_value, @new_value, @message, @timestamp)
    `).run({
      bug_id: req.params.id,
      old_value: existing.status,
      new_value: newStatus,
      message: message || null,
      timestamp: now,
    });

    const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
    const activity = db
      .prepare('SELECT * FROM bug_activity WHERE bug_id = ? ORDER BY timestamp ASC, id ASC')
      .all(req.params.id);

    res.json({ success: true, data: { ...serializeBugRow(row), activity }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export function handleAddBugComment(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, data: null, error: 'Bug not found' });
  }

  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, data: null, error: 'message is required' });
  }
  if (message.length > 500) {
    return res.status(400).json({ success: false, data: null, error: 'message must be 500 characters or fewer' });
  }

  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, timestamp)
      VALUES (@bug_id, 'comment', NULL, NULL, @message, @timestamp)
    `).run({ bug_id: req.params.id, message: message.trim(), timestamp: now });

    db.prepare('UPDATE bugs SET updated_at = ? WHERE id = ?').run(now, req.params.id);

    const activity = db
      .prepare('SELECT * FROM bug_activity WHERE bug_id = ? ORDER BY timestamp ASC, id ASC')
      .all(req.params.id);

    res.status(201).json({ success: true, data: { activity }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

const router = Router();
router.get('/', handleListBugs);
router.get('/:id', handleGetBug);
router.post('/', handleCreateBug);
router.put('/:id', handleUpdateBug);
router.delete('/:id', handleDeleteBug);
router.patch('/:id/status', handleChangeBugStatus);
router.post('/:id/comments', handleAddBugComment);

export default router;
