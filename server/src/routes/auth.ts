import type { FastifyInstance } from 'fastify';
import { createAdmin, findAdminByEmail, listAdmins, requireAuth, verifyPassword } from '../auth.js';
import { db } from '../db.js';
import { markContentChanged } from '../sync.js';

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: { email: string; password: string } }>('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body ?? {};
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password required' });
    }

    const admin = findAdminByEmail(email.toLowerCase().trim());
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    request.session.user = {
      id: admin.id,
      email: admin.email,
      display_name: admin.display_name,
    };

    db.prepare('UPDATE admin_users SET last_login = datetime(\'now\') WHERE id = ?').run(admin.id);

    return {
      user: request.session.user,
    };
  });

  app.post('/api/auth/logout', async (request) => {
    request.session.destroy();
    return { ok: true };
  });

  app.get('/api/auth/me', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;
    return { user };
  });

  app.get('/api/auth/admins', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;
    return { admins: listAdmins() };
  });

  app.post<{ Body: { email: string; display_name: string; password: string } }>(
    '/api/auth/admins',
    async (request, reply) => {
      const user = requireAuth(request, reply);
      if (!user) return;

      const { email, display_name, password } = request.body ?? {};
      if (!email || !display_name || !password) {
        return reply.code(400).send({ error: 'All fields required' });
      }

      try {
        const id = createAdmin(email, display_name, password);
        markContentChanged();
        return { id };
      } catch {
        return reply.code(409).send({ error: 'Email already exists' });
      }
    },
  );
}
