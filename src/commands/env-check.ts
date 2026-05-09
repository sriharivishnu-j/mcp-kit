import chalk from 'chalk';
import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson } from '../core/writer.js';
import { getMcpById } from '../core/registry.js';
import { isEnvVarSet, printEnvProfileInstructions } from '../core/credentials.js';
import { log, printTable } from '../utils/logger.js';

//
// mcp-kit env check
//

interface EnvCheckOptions {
  json?: boolean;
}

interface EnvVarResult {
  mcp: string;
  key: string;
  required: boolean;
  set: boolean;
  secret: boolean;
}

export async function runEnvCheck(options: EnvCheckOptions = {}): Promise<void> {
  try {
    const vscodePaths = await detectVsCodePath();
    const config = await readMcpJson(vscodePaths.mcpJsonPath);
    const serverIds = Object.keys(config.servers);

    if (serverIds.length === 0) {
      log.warn('No MCP servers configured. Run "mcp-kit init dev" first.');
      return;
    }

    const results: EnvVarResult[] = [];

    for (const id of serverIds) {
      const def = getMcpById(id);
      if (!def || def.envVars.length === 0) continue;
      for (const envVar of def.envVars) {
        results.push({
          mcp: id,
          key: envVar.key,
          required: envVar.required,
          set: isEnvVarSet(envVar.key),
          secret: envVar.secret,
        });
      }
    }

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    if (results.length === 0) {
      log.success('All configured MCPs require no environment variables.');
      return;
    }

    log.header('Environment Variable Check');

    const missing = results.filter(r => !r.set && r.required);
    const optional = results.filter(r => !r.set && !r.required);
    const present = results.filter(r => r.set);

    const rows = results.map(r => [
      r.mcp,
      r.key,
      r.required ? chalk.red('required') : chalk.gray('optional'),
      r.set
        ? chalk.green('✅ set')
        : r.required
        ? chalk.red('❌ missing')
        : chalk.yellow('⚠ not set'),
    ]);

    printTable(['MCP', 'Variable', 'Required', 'Status'], rows);

    log.blank();
    log.muted(`${present.length} set  ${optional.length} optional not set`);

    if (missing.length > 0) {
      log.blank();
      log.warn(`${missing.length} required variable(s) are not set:\n`);
      for (const r of missing) {
        printEnvProfileInstructions(r.key);
      }
      log.blank();
      process.exit(1);
    }

    log.blank();
    log.success('All required environment variables are set.');

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`env check failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}