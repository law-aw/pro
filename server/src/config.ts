import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import type { Role } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(rootDir, '.env') });

export const config = {
  role: (process.env.ROLE ?? 'edge') as Role,
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-secret-change-in-production',
  dataDir: path.resolve(rootDir, process.env.DATA_DIR ?? './data'),
  mediaDir: path.resolve(rootDir, process.env.DATA_DIR ?? './data', 'media'),
  dbPath: path.resolve(rootDir, process.env.DATA_DIR ?? './data', 'noticeboard.db'),
  syncHubUrl: process.env.SYNC_HUB_URL?.replace(/\/$/, '') ?? '',
  syncApiKey: process.env.SYNC_API_KEY ?? '',
  syncIntervalMs: Number(process.env.SYNC_INTERVAL_MS ?? 120_000),
  webDist: path.resolve(rootDir, 'web/dist'),
};
