import { Router } from 'express';
import db from '../db.js';

const RESULT_LIMIT = 6;

export function handleSearchAll(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.json({ success: true, data: { items: [] }, error: null });
  }

  const like = `%${q}%`;

  try {
    const testCases = db
      .prepare(`
        SELECT id, title, severity, priority
        FROM test_cases
        WHERE title LIKE ?
        ORDER BY updated_at DESC
        LIMIT ?
      `)
      .all(like, RESULT_LIMIT);

    const bugs = db
      .prepare(`
        SELECT id, title, status
        FROM bugs
        WHERE title LIKE ? OR description LIKE ?
        ORDER BY updated_at DESC
        LIMIT ?
      `)
      .all(like, like, RESULT_LIMIT);

    const suites = db
      .prepare(`
        SELECT id, name, feature, status
        FROM suites
        WHERE name LIKE ? OR feature LIKE ?
        ORDER BY updated_at DESC
        LIMIT ?
      `)
      .all(like, like, RESULT_LIMIT);

    const items = [
      ...testCases.map((tc) => ({
        type: 'test_case',
        id: tc.id,
        title: tc.title,
        subtitle: `${tc.severity} · ${tc.priority}`,
      })),
      ...bugs.map((b) => ({
        type: 'bug',
        id: b.id,
        title: b.title,
        subtitle: b.status,
      })),
      ...suites.map((s) => ({
        type: 'suite',
        id: s.id,
        title: s.name,
        subtitle: `${s.feature} · ${s.status}`,
      })),
    ];

    res.json({ success: true, data: { items }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

const router = Router();
router.get('/', handleSearchAll);

export default router;
