import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, 'data.sqlite'));

db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    preconditions TEXT,
    steps TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    severity TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS suites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    feature TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS suite_test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suite_id INTEGER NOT NULL REFERENCES suites(id) ON DELETE CASCADE,
    test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    UNIQUE(suite_id, test_case_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS bugs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    steps_to_reproduce TEXT NOT NULL,
    expected TEXT NOT NULL,
    actual TEXT NOT NULL,
    environment TEXT,
    severity TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS bug_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bug_id INTEGER NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    message TEXT,
    timestamp TEXT NOT NULL
  )
`);

export default db;
