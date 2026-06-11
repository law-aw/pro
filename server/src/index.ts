import fs from 'node:fs';
import path from 'node:path';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import session from '@fastify/session';
import fastifyStatic from '@fastify/static';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { noticeRoutes } from './routes/notices.js';
import { settingsRoutes } from './routes/settings.js';
import { syncRoutes } from './routes/sync.js';
import { startSyncLoop } from './sync.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  credentials: true,
});

await app.register(cookie);
await app.register(session, {
  secret: config.sessionSecret,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 12,
  },
});

await app.register(multipart, {
  limits: { fileSize: 20 * 1024 * 1024 },
});

await app.register(fastifyStatic, {
  root: config.mediaDir,
  prefix: '/media/',
  decorateReply: false,
});

await authRoutes(app);
await noticeRoutes(app);
await settingsRoutes(app);
await syncRoutes(app);

app.get('/api/health', async () => ({
  ok: true,
  role: config.role,
}));

const webIndex = path.join(config.webDist, 'index.html');
if (fs.existsSync(webIndex)) {
  await app.register(fastifyStatic, {
    root: config.webDist,
    prefix: '/',
    decorateReply: false,
  });

  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api') || request.url.startsWith('/media')) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return reply.sendFile('index.html');
  });
}

try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`Notice board running as ${config.role} on http://${config.host}:${config.port}`);

  if (config.role === 'edge') {
    startSyncLoop((result) => {
      app.log.info({ sync: result }, 'Background sync');
    });
  }
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
