import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson, writeMcpJson } from '../core/writer.js';
import { getMcpById, getLatestVersion } from '../core/registry.js';
import { askConfirm } from '../prompts/shared-prompts.js';
import { log, printTable } from '../utils/logger.js';
import { startSpinner, succeedSpinner, failSpinner } from '../utils/spinner.js';
import { safeWriteJSON, ensureDir, safeReadJSON } from '../utils/fs.js';
import { MCP_KIT_META_PATH, MCP_KIT_DIR } from '../constants.js';
import type { McpKitMeta } from '../types.js';
import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);
const pkg = _require('../../package.json') as { version: string };

//
// mcp-kit update
//

/** Extract a pinned version from an arg like "@azure/mcp@1.2.0" */
function extractVersionFromArg(arg: string): string | null {
  const match = arg.match(/@(\d+\.\d+\.\d+(?:-[\w.]+)?)$/);
  return match ? match[1] : null;
}

interface UpdateResult {
  id: string;
  def?: { name: string; npmPackage: string; args: string[] };
  current: string;
  latest: string;
  needsUpdate: boolean;
}

export async function runUpdate(): Promise<void> {
  try {
    const vscodePaths = await detectVsCodePath();
    const config = await readMcpJson(vscodePaths.mcpJsonPath);
    const serverIds = Object.keys(config.servers);

    if (serverIds.length === 0) {
      log.warn('No MCP servers are configured. Nothing to update.');
      return;
    }

    log.header('mcp-kit - Check for Updates');

    // Check latest versions in parallel
    const results: UpdateResult[] = await Promise.all(
      serverIds.map(async id => {
        const def = getMcpById(id);
        if (!def) return { id, current: 'unknown', latest: 'n/a', needsUpdate: false };

        const latest = await getLatestVersion(def.npmPackage);
        const entry = config.servers[id];
        const pinned = entry?.args?.map(extractVersionFromArg).find(Boolean);
        const current = pinned ?? 'latest';
        const needsUpdate =
          current !== 'latest' &&
          latest !== 'unknown' &&
          latest !== 'n/a' &&
          current !== latest;

        return { id, def, current, latest, needsUpdate };
      })
    );

    const rows = results.map(r => [
      r.id,
      r.def?.name ?? r.id,
      r.current,
      r.latest,
      r.needsUpdate ? '↑ Update available' : '✓ Up to date',
    ]);

    printTable(['ID', 'Name', 'Current', 'Latest', 'Action'], rows);

    const outdated = results.filter(r => r.needsUpdate);

    if (outdated.length === 0) {
      log.success('All configured MCPs are up to date!');
      return;
    }

    const doUpdate = await askConfirm(`Update ${outdated.length} outdated MCP(s) to @latest?`);
    if (!doUpdate) {
      log.info('No changes made.');
      return;
    }

    for (const item of outdated) {
      if (!item.def) continue;
      const spinner = startSpinner(`Updating ${item.def.name}...`);
      try {
        const entry = config.servers[item.id];
        if (entry) {
          // Replace pinned version tags in args with @latest
          entry.args = entry.args.map(arg =>
            arg.replace(/@\d+\.\d+\.\d+(?:-[\w.]+)?$/, '@latest')
          );
          config.servers[item.id] = entry;
        }
        succeedSpinner(spinner, `Updated ${item.def.name} to @latest`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failSpinner(spinner, `Failed to update ${item.def.name}: ${message}`);
      }
    }

    await writeMcpJson(vscodePaths.mcpJsonPath, config);

    // Update meta
    await ensureDir(MCP_KIT_DIR);
    const meta = await safeReadJSON<McpKitMeta>(MCP_KIT_META_PATH);
    if (meta) {
      await safeWriteJSON(MCP_KIT_META_PATH, {
        ...meta,
        lastUpdated: new Date().toISOString(),
        mcpKitVersion: pkg.version,
      });
    }

    log.blank();
    log.success(`Updated ${outdated.length} MCP(s). Reload VS Code to apply.`);
    log.info('Cmd/Ctrl+Shift+P → "Reload Window"');

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Update failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}