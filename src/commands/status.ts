import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson } from '../core/writer.js';
import { getMcpById, getLatestVersion } from '../core/registry.js';
import { log, printTable } from '../utils/logger.js';
import { safeReadJSON } from '../utils/fs.js';
import { MCP_KIT_META_PATH } from '../constants.js';
import type { McpKitMeta } from '../types.js';
import chalk from 'chalk';

//
// mcp-kit status
//

interface StatusOptions {
  json?: boolean;
}

export async function runStatus(options: StatusOptions = {}): Promise<void> {
  try {
    const vscodePaths = await detectVsCodePath();
    const config = await readMcpJson(vscodePaths.mcpJsonPath);
    const meta = await safeReadJSON<McpKitMeta>(MCP_KIT_META_PATH);
    const serverIds = Object.keys(config.servers);

    if (serverIds.length === 0) {
      if (options.json) {
        console.log(JSON.stringify({
          configured: [],
          source: vscodePaths.source,
          mcpJsonPath: vscodePaths.mcpJsonPath,
        }));
        return;
      }
      log.warn('No MCP servers currently configured.');
      log.info('Run "mcp-kit init --dev" or "mcp-kit init --non-dev" to get started.');
      return;
    }

    // Fetch latest versions in parallel
    const latestVersions = await Promise.all(
      serverIds.map(id => {
        const def = getMcpById(id);
        return def ? getLatestVersion(def.npmPackage) : Promise.resolve('n/a');
      })
    );

    if (options.json) {
      const output = serverIds.map((id, i) => {
        const def = getMcpById(id);
        const entry = config.servers[id];
        const latest = latestVersions[i] ?? 'n/a';
        const versionInArgs = entry?.args
          ?.map(a => {
            const match = a.match(/@([^\s@]+)$/);
            return match ? match[1] : null;
          })
          .find(Boolean) ?? 'latest';
        const upToDate =
          versionInArgs === 'latest' || versionInArgs === latest || latest === 'n/a';
        return {
          id,
          name: def?.name ?? id,
          category: def?.category ?? 'unknown',
          package: def?.npmPackage ?? '',
          version: versionInArgs,
          latest,
          upToDate,
          credentialStorage: meta?.credentialStorage ?? 'unknown',
          disabled: entry?.disabled ?? false,
        };
      });

      console.log(JSON.stringify({
        source: vscodePaths.source,
        mcpJsonPath: vscodePaths.mcpJsonPath,
        configured: output,
      }, null, 2));
      return;
    }

    const sourceLabel =
      vscodePaths.source === 'project' ? 'project .vscode' :
      vscodePaths.source === 'global' ? 'VS Code global config' :
      'created .vscode';

    log.header('MCP Status');

    const rows = serverIds.map((id, i) => {
      const def = getMcpById(id);
      const entry = config.servers[id];
      const latest = latestVersions[i] ?? 'n/a';

      // Try to extract version from args (e.g. "@azure/mcp@1.2.0")
      const versionInArgs = entry?.args
        ?.map(a => {
          const match = a.match(/@([^\s@]+)$/);
          return match ? match[1] : null;
        })
        .find(Boolean) ?? 'latest';

      const upToDate =
        versionInArgs === 'latest' || versionInArgs === latest || latest === 'n/a';
      const disabled = entry?.disabled === true;

      return [
        disabled ? chalk.gray(id) : id,
        def?.name ?? id,
        def?.category ?? 'unknown',
        def?.npmPackage ?? entry?.command ?? '',
        versionInArgs,
        latest,
        disabled
          ? chalk.gray('⏸ disabled')
          : upToDate
          ? chalk.green('✓')
          : chalk.yellow('↑ update available'),
        meta?.credentialStorage ?? 'unknown',
      ];
    });

    printTable(
      ['ID', 'Name', 'Category', 'Package', 'Version', 'Latest', 'Status', 'Cred Storage'],
      rows
    );

    log.blank();
    log.muted(`Config path: ${vscodePaths.mcpJsonPath} (${sourceLabel})`);
    log.muted(`Last updated: ${meta?.lastUpdated ?? 'unknown'}`);
    log.blank();
    log.info('Run "mcp-kit doctor" to diagnose any issues.');

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Status check failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}