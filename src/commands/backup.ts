import path from 'node:path';
import fs from 'node:fs/promises';
import { detectVsCodePath } from '../core/detector.js';
import { log } from '../utils/logger.js';
import { fileExists } from '../utils/fs.js';

//
// mcp-kit backup
//

interface BackupOptions {
  output?: string;
}

export async function runBackup(options: BackupOptions = {}): Promise<void> {
  try {
    const vscodePaths = await detectVsCodePath();
    const mcpJsonPath = vscodePaths.mcpJsonPath;

    if (!(await fileExists(mcpJsonPath))) {
      log.error('No mcp.json found. Nothing to back up.');
      log.info('Run "mcp-kit init dev" to create a config first.');
      process.exit(1);
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19); // YYYY-MM-DD_HH-MM-SS

    const destPath =
      options.output ??
      path.join(
        path.dirname(mcpJsonPath),
        `mcp.backup.${timestamp}.json`
      );

    const content = await fs.readFile(mcpJsonPath, 'utf-8');
    await fs.writeFile(destPath, content, 'utf-8');

    log.success(`Backup saved: ${destPath}`);
    log.muted(`Source: ${mcpJsonPath}`);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Backup failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}