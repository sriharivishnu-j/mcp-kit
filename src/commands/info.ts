import chalk from 'chalk';
import boxen from 'boxen';
import { getMcpById } from '../core/registry.js';
import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson } from '../core/writer.js';
import { log, printTable } from '../utils/logger.js';
import { MCP_REGISTRY } from '../constants.js';

//
// mcp-kit info <id>
//

interface InfoOptions {
  json?: boolean;
}

export async function runInfo(mcpId: string, options: InfoOptions = {}): Promise<void> {
  try {
    const def = getMcpById(mcpId);

    if (!def) {
      log.error(`Unknown MCP: "${mcpId}"`);
      log.blank();
      log.info('Available IDs:');
      MCP_REGISTRY.forEach(m => log.muted(`  ${m.id.padEnd(16)} ${m.name}`));
      process.exit(1);
    }

    // Check if it's currently configured
    let isConfigured = false;
    let entry;
    try {
      const vscodePaths = await detectVsCodePath();
      const config = await readMcpJson(vscodePaths.mcpJsonPath);
      isConfigured = mcpId in config.servers;
      entry = config.servers[mcpId];
    } catch {/* not configured */}

    if (options.json) {
      console.log(JSON.stringify({
        ...def,
        configured: isConfigured,
        entry: entry ?? null,
      }, null, 2));
      return;
    }

    // Header
    console.log('\n' + boxen(
      chalk.bold.cyanBright(def.name) + '\n' + chalk.gray(def.description),
      {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        margin: { top: 0, bottom: 0, left: 1, right: 0 },
        borderColor: 'cyan',
        borderStyle: 'round',
      }
    ));

    console.log('');

    // Details table
    printTable(['Property', 'Value'], [
      ['ID',           def.id],
      ['Category',     def.category],
      ['npm Package',  def.npmPackage],
      ['Command',      def.command],
      ['Args',         def.args.join(' ')],
      ['Dev only',     def.devOnly ? chalk.yellow('yes') : 'no'],
      ['Non-dev only', def.nonDevOnly ? chalk.yellow('yes') : 'no'],
      ['Configured',   isConfigured ? chalk.green('✓ yes') : chalk.gray('no')],
      ['Docs',         chalk.underline.blue(def.docsUrl)],
    ]);

    // Env vars
    if (def.envVars.length > 0) {
      log.blank();
      log.step('Required environment variables:');
      log.blank();
      printTable(
        ['Key', 'Label', 'Required', 'Secret', 'Hint'],
        def.envVars.map(ev => [
          chalk.cyan(ev.key),
          ev.label,
          ev.required ? chalk.red('yes') : 'no',
          ev.secret ? chalk.yellow('yes') : 'no',
          ev.hint ?? '',
        ])
      );
    } else {
      log.blank();
      log.success('No environment variables required.');
    }

    // Current config
    if (isConfigured && entry) {
      log.blank();
      log.step('Current mcp.json entry:');
      console.log(chalk.gray(JSON.stringify(entry, null, 2)));
    }

    log.blank();
    if (isConfigured) {
      log.info(`Manage: mcp-kit disable ${mcpId} | mcp-kit remove ${mcpId}`);
    } else {
      log.info(`Add it: mcp-kit add ${mcpId}`);
    }
    log.blank();

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`info failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}