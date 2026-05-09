import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson } from '../core/writer.js';
import { getMcpById } from '../core/registry.js';
import { log, printTable } from '../utils/logger.js';
import { MCP_REGISTRY, DEV_MCP_IDS, NON_DEV_MCP_IDS } from '../constants.js';

//
// mcp-kit list
//

interface ListOptions {
  available?: boolean;
  dev?: boolean;
  nonDev?: boolean;
  json?: boolean;
}

export async function runList(options: ListOptions): Promise<void> {
  try {
    if (options.available) {
      await listAvailable(options);
      return;
    }

    // Default: list configured MCPs in mcp.json
    const vscodePaths = await detectVsCodePath();
    const config = await readMcpJson(vscodePaths.mcpJsonPath);
    const serverIds = Object.keys(config.servers);

    if (serverIds.length === 0) {
      if (options.json) {
        console.log(JSON.stringify([]));
        return;
      }
      log.warn('No MCP servers are currently configured.');
      log.info('Run "mcp-kit init --dev" or "mcp-kit init --non-dev" to get started.');
      log.info('Run "mcp-kit list --available" to see all available MCPs.');
      return;
    }

    if (options.json) {
      const output = serverIds.map(id => {
        const def = getMcpById(id);
        const entry = config.servers[id];
        return {
          id,
          name: def?.name ?? id,
          category: def?.category ?? 'unknown',
          package: def?.npmPackage ?? '',
          command: entry?.command ?? '',
          args: entry?.args ?? [],
          disabled: entry?.disabled ?? false,
        };
      });
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    log.header('Configured MCPs');

    const rows = serverIds.map(id => {
      const def = getMcpById(id);
      const entry = config.servers[id];
      return [
        id,
        def?.name ?? id,
        def?.category ?? 'unknown',
        def?.npmPackage ?? entry?.command ?? '',
        entry?.command ?? '',
        entry?.args?.join(' ') ?? '',
      ];
    });

    printTable(['ID', 'Name', 'Category', 'Package', 'Command', 'Args'], rows);
    log.muted(`Config: ${vscodePaths.mcpJsonPath}`);
    log.blank();
    log.info('Run "mcp-kit list --available" to see all MCPs in the registry.');

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`List failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}

async function listAvailable(options: ListOptions): Promise<void> {
  let mcps = MCP_REGISTRY;

  if (options.dev && !options.nonDev) {
    mcps = MCP_REGISTRY.filter(m => DEV_MCP_IDS.includes(m.id));
  } else if (options.nonDev && !options.dev) {
    mcps = MCP_REGISTRY.filter(m => NON_DEV_MCP_IDS.includes(m.id));
  }

  // Detect configured to mark them
  let configuredIds: string[] = [];
  try {
    const vscodePaths = await detectVsCodePath();
    const config = await readMcpJson(vscodePaths.mcpJsonPath);
    configuredIds = Object.keys(config.servers);
  } catch {
    // no mcp.json yet - that's fine
  }

  const filterLabel = options.dev
    ? ' (developer profile)'
    : options.nonDev
    ? ' (non-developer profile)'
    : '';

  log.header(`Available MCPs${filterLabel}`);

  const rows = mcps.map(mcp => {
    const isConfigured = configuredIds.includes(mcp.id);
    const forWho = mcp.devOnly
      ? 'Dev only'
      : mcp.nonDevOnly
      ? 'Non-dev only'
      : 'ALL';
    return [
      isConfigured ? `✓ ${mcp.id}` : mcp.id,
      mcp.name,
      mcp.category,
      forWho,
      mcp.description,
    ];
  });

  printTable(['ID', 'Name', 'Category', 'For', 'Description'], rows);
  log.muted(`Total: ${mcps.length} MCPs`);
  log.blank();
  log.info('Run "mcp-kit add <id>" to add any MCP to your configuration.');
}