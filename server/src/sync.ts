import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { bumpSyncVersion, db, getDepartment, getSyncVersion, runTransaction } from './db.js';
import type { Notice, SyncBundle, SyncAdminUser } from './types.js';

function collectMediaFiles(notices: Notice[]): { filename: string; base64: string }[] {
  const files = new Set<string>();
  const dept = getDepartment();
  if (dept.logo_path) files.add(dept.logo_path);

  for (const notice of notices) {
    if (notice.image_path) files.add(notice.image_path);
    if (notice.attachment_path) files.add(notice.attachment_path);
  }

  return [...files].map((filename) => {
    const fullPath = path.join(config.mediaDir, filename);
    if (!fs.existsSync(fullPath)) return null;
    const buffer = fs.readFileSync(fullPath);
    return { filename, base64: buffer.toString('base64') };
  }).filter((item): item is { filename: string; base64: string } => item !== null);
}

export function buildSyncBundle(): SyncBundle {
  const department = getDepartment();
  const notices = db.prepare('SELECT * FROM notices').all() as unknown as Notice[];
  const admins = db.prepare(`
    SELECT email, display_name, password_hash, active, created_at
    FROM admin_users ORDER BY email
  `).all() as unknown as SyncBundle['admins'];
  return {
    version: getSyncVersion(),
    department,
    notices,
    admins,
    media: collectMediaFiles(notices),
  };
}

export function applySyncBundle(bundle: SyncBundle): void {
  runTransaction(() => {
    db.prepare(`
      UPDATE department
      SET university_name = ?, department_name = ?, accent_color = ?, logo_path = ?, updated_at = ?
      WHERE id = 1
    `).run(
      bundle.department.university_name,
      bundle.department.department_name,
      bundle.department.accent_color,
      bundle.department.logo_path,
      bundle.department.updated_at,
    );

    db.prepare('DELETE FROM notices').run();
    const insert = db.prepare(`
      INSERT INTO notices (
        id, title, body, category, priority, status, audience, location,
        event_start, event_end, image_path, attachment_path, publish_at, expires_at,
        created_by_id, updated_by_id, created_at, updated_at, version, deleted
      ) VALUES (
        @id, @title, @body, @category, @priority, @status, @audience, @location,
        @event_start, @event_end, @image_path, @attachment_path, @publish_at, @expires_at,
        @created_by_id, @updated_by_id, @created_at, @updated_at, @version, @deleted
      )
    `);

    for (const notice of bundle.notices) {
      insert.run(notice as unknown as Record<string, string | number | null>);
    }

    if (bundle.admins?.length) {
      const upsertAdmin = db.prepare(`
        INSERT INTO admin_users (email, display_name, password_hash, active, created_at)
        VALUES (@email, @display_name, @password_hash, @active, @created_at)
        ON CONFLICT(email) DO UPDATE SET
          display_name = excluded.display_name,
          password_hash = excluded.password_hash,
          active = excluded.active
      `);
      for (const admin of bundle.admins as SyncAdminUser[]) {
        upsertAdmin.run(admin as unknown as Record<string, string | number>);
      }
    }

    for (const file of bundle.media) {
      const dest = path.join(config.mediaDir, file.filename);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(file.base64, 'base64'));
    }

    db.prepare(`
      INSERT INTO sync_meta (key, value) VALUES ('bundle_version', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(String(bundle.version));

    db.prepare(`
      INSERT INTO sync_meta (key, value) VALUES ('last_sync_at', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(new Date().toISOString());
  });
}

export async function pullFromHub(): Promise<{ ok: boolean; message: string }> {
  if (!config.syncHubUrl || !config.syncApiKey) {
    return { ok: false, message: 'Sync hub not configured' };
  }

  try {
    const localVersion = getSyncVersion();
    const response = await fetch(`${config.syncHubUrl}/api/sync/bundle`, {
      headers: { 'x-sync-key': config.syncApiKey },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return { ok: false, message: `Hub returned ${response.status}` };
    }

    const bundle = (await response.json()) as SyncBundle;
    if (bundle.version <= localVersion) {
      return { ok: true, message: 'Already up to date' };
    }

    applySyncBundle(bundle);
    return { ok: true, message: `Synced to version ${bundle.version}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    return { ok: false, message };
  }
}

export function startSyncLoop(onResult?: (result: { ok: boolean; message: string }) => void) {
  if (config.role !== 'edge' || !config.syncHubUrl) return;

  const run = async () => {
    const result = await pullFromHub();
    onResult?.(result);
  };

  void run();
  setInterval(() => void run(), config.syncIntervalMs);
}

export function markContentChanged(): number {
  const version = bumpSyncVersion();
  if (config.role === 'edge') {
    void pushToHub();
  }
  return version;
}

export async function pushToHub(): Promise<{ ok: boolean; message: string }> {
  if (!config.syncHubUrl || !config.syncApiKey) {
    return { ok: false, message: 'Sync hub not configured' };
  }

  try {
    const bundle = buildSyncBundle();
    const response = await fetch(`${config.syncHubUrl}/api/sync/import`, {
      method: 'POST',
      headers: {
        'x-sync-key': config.syncApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bundle),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return { ok: false, message: `Hub rejected push (${response.status})` };
    }

    return { ok: true, message: 'Pushed to hub' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Push failed';
    return { ok: false, message };
  }
}
