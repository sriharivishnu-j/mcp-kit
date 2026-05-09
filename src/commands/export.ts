import path from 'node:path';
import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson } from '../core/writer.js';
import { log } from '../utils/logger.js';
import { safeReadJSON, safeWriteJSON } from '../utils/fs.js';
import { MCP_KIT_META_PATH } from '../constants.js';
import type { McpKitMeta, McpKitExport, McpServerEntry } from '../types.js';
import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);
const pkg = _require('../../package.json') as { version: string };

//
// mcp-kit export
//

interface ExportOptions {
  output?: string;
  redact?: boolean; // true = redact secrets (default); false = include real values
}

export async function runExport(options: ExportOptions): Promise<void> {
  try {
    const outputFile = options.output ?? 'mcp-kit-export.json';
    const shouldRedact = options.redact !== false; // default true

    const vscodePaths = await detectVsCodePath();
    const config = await readMcpJson(vscodePaths.mcpJsonPath);
    const meta = await safeReadJSON<McpKitMeta>(MCP_KIT_META_PATH);

    if (Object.keys(config.servers).length === 0) {
      log.warn('No MCP servers configured. Nothing to export.');
      return;
    }

    // Build sanitised server entries
    const servers: Record<string, McpServerEntry> = {};

    for (const [id, entry] of Object.entries(config.servers)) {
      if (shouldRedact) {
        const redactedEnv: Record<string, string> = {};
        for (const [k, v] of Object.entries(entry.env ?? {})) {
          // Redact if value looks like a real secret (not a ${env:KEY} ref)
          redactedEnv[k] = v.startsWith('${env:') ? v : 'REDACTED';
        }
        servers[id] = {
          ...entry,
          env: Object.keys(redactedEnv).length ? redactedEnv : undefined,
        };
      } else {
        servers[id] = { ...entry };
      }
    }

    const exportData: McpKitExport = {
      exportedAt: new Date().toISOString(),
      mcpKitVersion: pkg.version,
      profileMode: meta?.profileMode ?? 'dev',
      servers,
      mcpIds: Object.keys(servers),
      instructions: 'Run "mcp-kit import <this-file>" to apply this configuration',
    };

    const outputPath = path.resolve(outputFile);
    await safeWriteJSON(outputPath, exportData);

    log.blank();
    log.success(`Exported to: ${outputPath}`);
    log.info('Share this file with teammates who need the same MCP setup.');
    log.info(`They can apply it with: mcp-kit import ${path.basename(outputPath)}`);

    if (!shouldRedact) {
      log.blank();
      log.warn('⚠ This export contains real credential values - do NOT commit to source control!');
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Export failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}