import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { config } from './config.js';

export function checkAndExecuteKioskCommand(): boolean {
  if (config.role !== 'edge') return false;

  const commandFile = path.join(config.dataDir, 'kiosk-exit-command');
  
  try {
    if (fs.existsSync(commandFile)) {
      const content = fs.readFileSync(commandFile, 'utf-8');
      const command = JSON.parse(content);
      
      if (command.command === 'exit') {
        // Execute the kiosk exit
        try {
          execSync('pkill -f "chromium.*--kiosk"', { stdio: 'ignore' });
          // Delete the command file after execution
          fs.unlinkSync(commandFile);
          return true;
        } catch (error) {
          // Process might not exist, but that's ok
          fs.unlinkSync(commandFile);
          return true;
        }
      }
    }
  } catch (error) {
    // Silently fail if file doesn't exist or can't be parsed
  }

  return false;
}
