import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth.js';
import { config } from '../config.js';
import { db, getAllNotices, getNoticeById, getPublishedNotices } from '../db.js';
import { markContentChanged } from '../sync.js';
import type { NoticeAudience, NoticePriority, NoticeStatus } from '../types.js';

interface NoticeInput {
  title: string;
  body: string;
  category: string;
  priority?: NoticePriority;
  status?: NoticeStatus;
  audience?: NoticeAudience;
  location?: string | null;
  event_start?: string | null;
  event_end?: string | null;
  publish_at?: string;
  expires_at?: string | null;
}

function saveUpload(filename: string, buffer: Buffer): string {
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const dest = path.join(config.mediaDir, safeName);
  fs.writeFileSync(dest, buffer);
  return safeName;
}

export async function noticeRoutes(app: FastifyInstance) {
  app.get('/api/notices/public', async () => {
    return { notices: getPublishedNotices() };
  });

  app.get<{ Params: { id: string } }>('/api/notices/public/:id', async (request, reply) => {
    const notice = getNoticeById(request.params.id);
    if (!notice || notice.status !== 'published') {
      return reply.code(404).send({ error: 'Notice not found' });
    }
    const now = new Date().toISOString();
    if (notice.publish_at > now || (notice.expires_at && notice.expires_at <= now)) {
      return reply.code(404).send({ error: 'Notice not found' });
    }
    return { notice };
  });

  app.get('/api/notices', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;
    return { notices: getAllNotices() };
  });

  app.post('/api/notices', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    const parts = request.parts();
    const fields: Record<string, string> = {};
    let imagePath: string | null = null;
    let attachmentPath: string | null = null;

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        if (part.fieldname === 'image') imagePath = saveUpload(part.filename, buffer);
        if (part.fieldname === 'attachment') attachmentPath = saveUpload(part.filename, buffer);
      } else {
        fields[part.fieldname] = String(part.value);
      }
    }

    const input = fields as unknown as NoticeInput;
    if (!input.title || !input.body || !input.category) {
      return reply.code(400).send({ error: 'Title, body, and category are required' });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    // Handle empty strings for date fields and convert datetime-local format to ISO
    const eventStart = (input.event_start && input.event_start.trim()) 
      ? new Date(input.event_start).toISOString() 
      : null;
    const eventEnd = (input.event_end && input.event_end.trim()) 
      ? new Date(input.event_end).toISOString() 
      : null;
    const publishAt = (input.publish_at && input.publish_at.trim()) 
      ? new Date(input.publish_at).toISOString() 
      : now;
    const expiresAt = (input.expires_at && input.expires_at.trim()) 
      ? new Date(input.expires_at).toISOString() 
      : null;

    db.prepare(`
      INSERT INTO notices (
        id, title, body, category, priority, status, audience, location,
        event_start, event_end, image_path, attachment_path, publish_at, expires_at,
        created_by_id, updated_by_id, created_at, updated_at, version, deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `).run(
      id,
      input.title,
      input.body,
      input.category,
      input.priority ?? 'normal',
      input.status || 'published',
      input.audience ?? 'all',
      input.location ?? null,
      eventStart,
      eventEnd,
      imagePath,
      attachmentPath,
      publishAt,
      expiresAt,
      user.id,
      user.id,
      now,
      now,
    );

    markContentChanged();
    return { notice: getNoticeById(id) };
  });

  app.put<{ Params: { id: string } }>('/api/notices/:id', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    const existing = getNoticeById(request.params.id);
    if (!existing) return reply.code(404).send({ error: 'Notice not found' });

    const parts = request.parts();
    const fields: Record<string, string> = {};
    let imagePath = existing.image_path;
    let attachmentPath = existing.attachment_path;

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        if (part.fieldname === 'image') imagePath = saveUpload(part.filename, buffer);
        if (part.fieldname === 'attachment') attachmentPath = saveUpload(part.filename, buffer);
      } else {
        fields[part.fieldname] = String(part.value);
      }
    }

    const input = fields as unknown as NoticeInput;
    const now = new Date().toISOString();

    // Handle empty strings for date fields and convert datetime-local format to ISO
    const eventStart = (input.event_start !== undefined)
      ? ((input.event_start && input.event_start.trim()) ? new Date(input.event_start).toISOString() : null)
      : existing.event_start;
    const eventEnd = (input.event_end !== undefined)
      ? ((input.event_end && input.event_end.trim()) ? new Date(input.event_end).toISOString() : null)
      : existing.event_end;
    const publishAt = (input.publish_at && input.publish_at.trim()) 
      ? new Date(input.publish_at).toISOString() 
      : existing.publish_at;
    const expiresAt = (input.expires_at !== undefined) 
      ? ((input.expires_at && input.expires_at.trim()) ? new Date(input.expires_at).toISOString() : null)
      : existing.expires_at;

    db.prepare(`
      UPDATE notices SET
        title = ?, body = ?, category = ?, priority = ?, status = ?, audience = ?,
        location = ?, event_start = ?, event_end = ?, image_path = ?, attachment_path = ?,
        publish_at = ?, expires_at = ?, updated_by_id = ?, updated_at = ?, version = version + 1
      WHERE id = ?
    `).run(
      input.title ?? existing.title,
      input.body ?? existing.body,
      input.category ?? existing.category,
      input.priority ?? existing.priority,
      input.status ?? existing.status,
      input.audience ?? existing.audience,
      input.location !== undefined ? input.location : existing.location,
      eventStart,
      eventEnd,
      imagePath,
      attachmentPath,
      publishAt,
      expiresAt,
      user.id,
      now,
      existing.id,
    );

    markContentChanged();
    return { notice: getNoticeById(existing.id) };
  });

  app.delete<{ Params: { id: string } }>('/api/notices/:id', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    const existing = getNoticeById(request.params.id);
    if (!existing) return reply.code(404).send({ error: 'Notice not found' });

    db.prepare(`
      UPDATE notices SET deleted = 1, updated_at = datetime('now'), version = version + 1
      WHERE id = ?
    `).run(existing.id);

    markContentChanged();
    return { ok: true };
  });
}
