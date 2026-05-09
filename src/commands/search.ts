import chalk from 'chalk';
import { getMcpById } from '../core/registry.js';
import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson } from '../core/writer.js';
import { log, printTable } from '../utils/logger.js';
import { MCP_REGISTRY } from '../constants.js';

//
// mcp-kit search <query>
//

interface SearchOptions {
  json?: boolean;
}

export async function runSearch(query: string, options: SearchOptions = {}): Promise<void> {
  try {
    if (!query || query.trim().length === 0) {
      log.error('Please provide a search query: mcp-kit search <query>');
      process.exit(1);
    }

    const q = query.toLowerCase();

    const matches = MCP_REGISTRY.filter(m =>
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.npmPackage.toLowerCase().includes(q) ||
      m.envVars.some(ev =>
        ev.key.toLowerCase().includes(q) ||
        ev.label.toLowerCase().includes(q)
      )
    );

    // Check which are currently configured
    let configuredIds: string[] = [];
    try {
      const vscodePaths = await detectVsCodePath();
      const config = await readMcpJson(vscodePaths.mcpJsonPath);
      configuredIds = Object.keys(config.servers);
    } catch { /* no config yet */ }

    if (options.json) {
      console.log(JSON.stringify(matches.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        category: m.category,
        npmPackage: m.npmPackage,
        devOnly: m.devOnly,
        configured: configuredIds.includes(m.id),
      })), null, 2));
      return;
    }

    if (matches.length === 0) {
      log.warn(`No MCPs found matching "${query}".`);
      log.info('Run "mcp-kit list --available" to see all MCPs.');
      return;
    }

    log.header(`Search results for "${query}" (${matches.length} match${matches.length === 1 ? '' : 'es'})`);

    const rows = matches.map(m => [
      chalk.cyan(m.id),
      m.name,
      m.category,
      configuredIds.includes(m.id) ? chalk.green('✓') : chalk.gray('-'),
      m.description,
    ]);

    printTable(['ID', 'Name', 'Category', 'Configured', 'Description'], rows);
    log.blank();
    log.info('Add one: "mcp-kit add <id>" | Details: "mcp-kit info <id>"');

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`search failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}