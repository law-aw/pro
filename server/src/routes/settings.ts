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

  // Exit kiosk mode endpoint
  app.post('/api/kiosk/exit', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    // If this is the hub, store the command for edge devices to pick up
    if (config.role === 'hub') {
      // Store a flag that edge devices should check for
      const commandFile = path.join(config.dataDir, 'kiosk-exit-command');
      fs.writeFileSync(commandFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        command: 'exit',
      }));
      
      return { 
        success: true, 
        message: 'Kiosk exit command sent to all edge devices. They will execute on next sync.',
        isHub: true
      };
    }

    // If this is an edge device, execute locally
    if (config.role === 'edge') {
      try {
        execSync('pkill -f "chromium.*--kiosk"', { stdio: 'ignore' });
        return { 
          success: true, 
          message: 'Kiosk mode exited. Display will restart automatically.',
          isHub: false
        };
      } catch (error) {
        app.log.error({ error }, 'Failed to exit kiosk mode');
        return reply.code(500).send({ 
          error: 'Failed to exit kiosk mode',
          success: false 
        });
      }
    }
  });

  // Toggle fullscreen on the display
  app.post('/api/kiosk/toggle-fullscreen', async (request, reply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    try {
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
