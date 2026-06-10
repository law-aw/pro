import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';
import type { Department, Notice } from './types.js';

fs.mkdirSync(config.dataDir, { recursive: true });
fs.mkdirSync(config.mediaDir, { recursive: true });

export const db = new DatabaseSync(config.dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS department (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    university_name TEXT NOT NULL,
    department_name TEXT NOT NULL,
    accent_color TEXT NOT NULL DEFAULT '#1e4d8c',
    logo_path TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'draft',
    audience TEXT NOT NULL DEFAULT 'all',
    location TEXT,
    event_start TEXT,
    event_end TEXT,
    image_path TEXT,
    attachment_path TEXT,
    publish_at TEXT NOT NULL,
    expires_at TEXT,
    created_by_id INTEGER,
    updated_by_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (created_by_id) REFERENCES admin_users(id),
    FOREIGN KEY (updated_by_id) REFERENCES admin_users(id)
  );

  CREATE TABLE IF NOT EXISTS sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

export function runTransaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

const deptCount = db.prepare('SELECT COUNT(*) as count FROM department').get() as { count: number };
if (deptCount.count === 0) {
  db.prepare(`
    INSERT INTO department (id, university_name, department_name, accent_color, updated_at)
    VALUES (1, ?, ?, '#1e4d8c', datetime('now'))
  `).run('Southern Delta University', 'Electrical Engineering');
}

// Initialize default admin if none exist
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
if (adminCount.count === 0) {
  // Import here to avoid circular dependency
  const { createAdmin } = await import('./auth.js');
  createAdmin('admin@southerndelta.edu', 'Department Admin', 'admin123');
  console.log('✓ Created default admin: admin@southerndelta.edu / admin123');
  console.log('  Change this password after first login!');
}

export function getDepartment(): Department {
  return db.prepare('SELECT * FROM department WHERE id = 1').get() as unknown as Department;
}

export function updateDepartment(data: Partial<Department>): Department {
  const current = getDepartment();
  const next = {
    university_name: data.university_name ?? current.university_name,
    department_name: data.department_name ?? current.department_name,
    accent_color: data.accent_color ?? current.accent_color,
    logo_path: data.logo_path !== undefined ? data.logo_path : current.logo_path,
    updated_at: new Date().toISOString(),
  };
  db.prepare(`
    UPDATE department
    SET university_name = ?, department_name = ?, accent_color = ?, logo_path = ?, updated_at = ?
    WHERE id = 1
  `).run(next.university_name, next.department_name, next.accent_color, next.logo_path, next.updated_at);
  return getDepartment();
}

export function getSyncVersion(): number {
  const row = db.prepare("SELECT value FROM sync_meta WHERE key = 'bundle_version'").get() as { value: string } | undefined;
  return row ? Number(row.value) : 1;
}

export function bumpSyncVersion(): number {
  const next = getSyncVersion() + 1;
  db.prepare(`
    INSERT INTO sync_meta (key, value) VALUES ('bundle_version', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(String(next));
  return next;
}

export function getPublishedNotices(): Notice[] {
  const now = new Date().toISOString();
  return db.prepare(`
    SELECT * FROM notices
    WHERE deleted = 0
      AND status = 'published'
      AND publish_at <= ?
      AND (expires_at IS NULL OR expires_at > ?)
    ORDER BY
      CASE priority WHEN 'urgent' THEN 0 WHEN 'pinned' THEN 1 ELSE 2 END,
      publish_at DESC
  `).all(now, now) as unknown as Notice[];
}

export function getAllNotices(): Notice[] {
  return db.prepare(`
    SELECT * FROM notices WHERE deleted = 0 ORDER BY updated_at DESC
  `).all() as unknown as Notice[];
}

export function getNoticeById(id: string): Notice | undefined {
  return db.prepare('SELECT * FROM notices WHERE id = ? AND deleted = 0').get(id) as unknown as Notice | undefined;
}
