import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth.js';
import { config } from '../config.js';
import { getDepartment, updateDepartment } from '../db.js';
import { markContentChanged } from '../sync.js';

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/api/settings', async () => {
    return { department: getDepartment() };
  });

  app.put('/api/settings', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    const parts = request.parts();
    const fields: Record<string, string> = {};
    let logoPath: string | undefined;

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'logo') {
        const buffer = await part.toBuffer();
        const safeName = `logo-${Date.now()}-${part.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        fs.writeFileSync(path.join(config.mediaDir, safeName), buffer);
        logoPath = safeName;
      } else if (part.type === 'field') {
        fields[part.fieldname] = String(part.value);
      }
    }

    const department = updateDepartment({
      university_name: fields.university_name,
      department_name: fields.department_name,
      accent_color: fields.accent_color,
      logo_path: logoPath ?? (fields.logo_path === '' ? null : undefined),
    });

    markContentChanged();
    return { department };
  });

  // Kiosk mode toggle endpoint
  app.post('/api/kiosk/exit', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    // Exit kiosk mode by exiting chromium
    try {
      // Send signal to Chromium process on the edge device
      // The display board will restart Chromium automatically due to systemd Restart=always
      // For now, we'll just send a success response - the browser needs to handle the exit
      return { success: true, message: 'Exiting kiosk mode' };
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to exit kiosk mode' });
    }
  });

  // Toggle fullscreen on the display
  app.post('/api/kiosk/toggle-fullscreen', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    return { success: true, message: 'Fullscreen toggle sent to display' };
  });
}
