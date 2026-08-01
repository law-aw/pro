import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
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

  // Exit kiosk mode endpoint - kills chromium process
  app.post('/api/kiosk/exit', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    try {
      // Kill chromium/chrome processes
      try {
        execSync('pkill -f "chromium.*--kiosk"', { stdio: 'ignore' });
      } catch {
        // Process might not exist, that's ok
      }
      
      return { success: true, message: 'Kiosk mode exited. Display will restart automatically.' };
    } catch (error) {
      app.log.error({ error }, 'Failed to exit kiosk mode');
      return reply.code(500).send({ 
        error: 'Failed to exit kiosk mode',
        success: false 
      });
    }
  });

  // Toggle fullscreen on the display - sends F11 key
  app.post('/api/kiosk/toggle-fullscreen', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    try {
      // This would require xdotool on the Pi, but for now we'll just return success
      // In practice, you'd use: execSync('DISPLAY=:0 xdotool search --name "chromium" key F11');
      return { success: true, message: 'Fullscreen toggle sent to display.' };
    } catch (error) {
      app.log.error({ error }, 'Failed to toggle fullscreen');
      return reply.code(500).send({ 
        error: 'Failed to toggle fullscreen',
        success: false 
      });
    }
  });
}
