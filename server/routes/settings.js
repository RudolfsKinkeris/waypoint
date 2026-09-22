import { Router } from 'express';
import db from '../db.js';

const VALID_THEMES = ['light', 'dark', 'system'];
const VALID_SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const VALID_PAGE_SIZES = [10, 20, 50, 100];

function getSettingsRow() {
  return db.prepare('SELECT * FROM user_preferences ORDER BY id ASC LIMIT 1').get();
}

function serializeSettingsRow(row) {
  return {
    theme: row.theme,
    default_severity_for_new_bugs: row.default_severity_for_new_bugs,
    default_page_size: row.default_page_size,
    timezone: row.timezone,
    auto_generate_report_after_run: !!row.auto_generate_report_after_run,
    updated_at: row.updated_at,
  };
}

function validateSettingsPayload(body) {
  const errors = [];

  if (body.theme !== undefined && !VALID_THEMES.includes(body.theme)) {
    errors.push(`theme must be one of ${VALID_THEMES.join(', ')}`);
  }
  if (
    body.default_severity_for_new_bugs !== undefined &&
    !VALID_SEVERITIES.includes(body.default_severity_for_new_bugs)
  ) {
    errors.push(`default_severity_for_new_bugs must be one of ${VALID_SEVERITIES.join(', ')}`);
  }
  if (body.default_page_size !== undefined && !VALID_PAGE_SIZES.includes(body.default_page_size)) {
    errors.push(`default_page_size must be one of ${VALID_PAGE_SIZES.join(', ')}`);
  }
  if (body.timezone !== undefined && (typeof body.timezone !== 'string' || !body.timezone.trim())) {
    errors.push('timezone must be a non-empty string');
  }
  if (
    body.auto_generate_report_after_run !== undefined &&
    typeof body.auto_generate_report_after_run !== 'boolean'
  ) {
    errors.push('auto_generate_report_after_run must be a boolean');
  }

  return errors;
}

export function handleGetSettings(req, res) {
  try {
    const row = getSettingsRow();
    if (!row) {
      return res.status(404).json({ success: false, data: null, error: 'Settings not found' });
    }
    res.json({ success: true, data: serializeSettingsRow(row), error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

export function handleUpdateSettings(req, res) {
  const errors = validateSettingsPayload(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, data: null, error: errors.join('; ') });
  }

  const existing = getSettingsRow();
  if (!existing) {
    return res.status(404).json({ success: false, data: null, error: 'Settings not found' });
  }

  const merged = {
    id: existing.id,
    theme: req.body.theme ?? existing.theme,
    default_severity_for_new_bugs: req.body.default_severity_for_new_bugs ?? existing.default_severity_for_new_bugs,
    default_page_size: req.body.default_page_size ?? existing.default_page_size,
    timezone: req.body.timezone ?? existing.timezone,
    auto_generate_report_after_run:
      req.body.auto_generate_report_after_run !== undefined
        ? (req.body.auto_generate_report_after_run ? 1 : 0)
        : existing.auto_generate_report_after_run,
    updated_at: new Date().toISOString(),
  };

  try {
    db.prepare(`
      UPDATE user_preferences
      SET theme = @theme, default_severity_for_new_bugs = @default_severity_for_new_bugs,
          default_page_size = @default_page_size, timezone = @timezone,
          auto_generate_report_after_run = @auto_generate_report_after_run, updated_at = @updated_at
      WHERE id = @id
    `).run(merged);

    res.json({ success: true, data: serializeSettingsRow(getSettingsRow()), error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
}

const router = Router();
router.get('/', handleGetSettings);
router.put('/', handleUpdateSettings);

export default router;
