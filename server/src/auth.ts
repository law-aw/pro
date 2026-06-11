import bcrypt from 'bcryptjs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from './db.js';

export interface SessionUser {
  id: number;
  email: string;
  display_name: string;
}

declare module '@fastify/session' {
  interface FastifySessionObject {
    user?: SessionUser;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function findAdminByEmail(email: string) {
  return db.prepare('SELECT * FROM admin_users WHERE email = ? AND active = 1').get(email) as
    | { id: number; email: string; display_name: string; password_hash: string }
    | undefined;
}

export function listAdmins() {
  return db.prepare(`
    SELECT id, email, display_name, active, created_at, last_login
    FROM admin_users ORDER BY display_name
  `).all();
}

export function createAdmin(email: string, displayName: string, password: string) {
  const result = db.prepare(`
    INSERT INTO admin_users (email, display_name, password_hash, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(email.toLowerCase().trim(), displayName.trim(), hashPassword(password));
  return Number(result.lastInsertRowid);
}

export function requireAuth(request: FastifyRequest, reply: FastifyReply): SessionUser | null {
  const user = request.session.user;
  if (!user) {
    reply.code(401).send({ error: 'Authentication required' });
    return null;
  }
  return user;
}
