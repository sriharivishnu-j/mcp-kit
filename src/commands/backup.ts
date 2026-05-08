import fs from "fs-extra";
import path from "node:path";
import { detectVsCodePath } from "../core/detector";
import { log } from "../utils/logger";

interface BackupOptions {
  output?: string;
}

export async function runBackup(options: BackupOptions = {}): Promise<void> {
  try {
    const detected = await detectVsCodePath();
    if (!(await fs.pathExists(detected.mcpJsonPath))) {
      log.warn("No mcp.json file found to backup.");
      process.exit(0);
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = options.output
      ? path.resolve(options.output)
      : path.join(path.dirname(detected.mcpJsonPath), `mcp-backup-${stamp}.json`);
    await fs.mkdirp(path.dirname(backupPath));

    await fs.copyFile(detected.mcpJsonPath, backupPath);
    log.success(`Backup created at ${backupPath}`);
    process.exit(0);
  } catch (err) {
    log.error(`backup failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
