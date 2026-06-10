import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth.js';
import { config } from '../config.js';
import { db } from '../db.js';
import { applySyncBundle, buildSyncBundle, pullFromHub } from '../sync.js';
import type { SyncBundle } from '../types.js';

function verifySyncKey(request: { headers: Record<string, string | string[] | undefined> }): boolean {
  const key = request.headers['x-sync-key'];
  return typeof key === 'string' && key === config.syncApiKey && config.syncApiKey.length > 0;
}

export async function syncRoutes(app: FastifyInstance) {
  app.get('/api/sync/bundle', async (request, reply) => {
    if (!verifySyncKey(request)) {
      return reply.code(401).send({ error: 'Invalid sync key' });
    }
    return buildSyncBundle();
  });

  app.post<{ Body: SyncBundle }>('/api/sync/import', async (request, reply) => {
    if (!verifySyncKey(request)) {
      return reply.code(401).send({ error: 'Invalid sync key' });
    }

    if (config.role !== 'hub') {
      return reply.code(400).send({ error: 'Import sync is only for hub servers' });
    }

    applySyncBundle(request.body);
    return { ok: true };
  });

  app.post<{ Body: SyncBundle }>('/api/sync/apply', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    if (config.role !== 'edge') {
      return reply.code(400).send({ error: 'Apply sync is only for edge devices' });
    }

    applySyncBundle(request.body);
    return { ok: true };
  });

  app.post('/api/sync/pull', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    if (config.role !== 'edge') {
      return reply.code(400).send({ error: 'Pull sync is only for edge devices' });
    }

    const result = await pullFromHub();
    return result;
  });

  app.post('/api/sync/push-to-edges', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    if (config.role !== 'hub') {
      return reply.code(400).send({ error: 'Push is only available on hub servers' });
    }

    // Build current sync bundle to make available for edge devices to pull
    const bundle = buildSyncBundle();
    return { 
      ok: true, 
      version: bundle.version, 
      message: 'Updates ready. Edge devices will sync on next interval or can pull manually.' 
    };
  });

  app.get('/api/sync/status', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    const lastSync = db.prepare("SELECT value FROM sync_meta WHERE key = 'last_sync_at'").get() as
      | { value: string }
      | undefined;

    return {
      role: config.role,
      hubConfigured: Boolean(config.syncHubUrl && config.syncApiKey),
      syncHubUrl: config.syncHubUrl || null,
      lastSyncAt: lastSync?.value ?? null,
    };
  });
}
