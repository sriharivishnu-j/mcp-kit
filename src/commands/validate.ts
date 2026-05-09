import { detectVsCodePath } from '../core/detector.js';
import { validateMcpJson } from '../core/validator.js';
import { safeReadJSON } from '../utils/fs.js';
import { log, printTable } from '../utils/logger.js';
import chalk from 'chalk';

//
// mcp-kit validate
//

interface ValidateOptions {
  json?: boolean;
}

export async function runValidate(options: ValidateOptions = {}): Promise<void> {
  try {
    const vscodePaths = await detectVsCodePath();

    let raw: unknown;
    try {
      raw = await safeReadJSON<unknown>(vscodePaths.mcpJsonPath);
      if (!raw) throw new Error('File is empty or does not exist.');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (options.json) {
        console.log(JSON.stringify({ valid: false, path: vscodePaths.mcpJsonPath, error: message }));
      } else {
        log.error(`Cannot read mcp.json: ${message}`);
        log.info('Run "mcp-kit init --dev" to create a valid config.');
      }
      process.exit(1);
    }

    let validated: ReturnType<typeof validateMcpJson> | undefined;
    let errors: string[] = [];

    try {
      validated = validateMcpJson(raw);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors = message.split('\n');
    }

    if (options.json) {
      console.log(JSON.stringify({
        valid: errors.length === 0,
        path: vscodePaths.mcpJsonPath,
        serverCount: validated ? Object.keys(validated.servers).length : 0,
        errors,
      }, null, 2));
      if (errors.length > 0) process.exit(1);
      return;
    }

    log.header('mcp.json Validation');
    log.muted(`Path: ${vscodePaths.mcpJsonPath}`);
    log.blank();

    if (errors.length > 0) {
      log.error('mcp.json is INVALID:\n');
      for (const e of errors) log.error(`  ${e}`);
      log.blank();
      log.info('Run "mcp-kit init --dev" to regenerate a valid config.');
      process.exit(1);
    }

    const serverIds = Object.keys(validated!.servers);
    log.success(`mcp.json is valid - ${serverIds.length} server(s) configured`);

    if (serverIds.length > 0) {
      const rows = serverIds.map(id => {
        const entry = validated!.servers[id];
        const envCount = Object.keys(entry?.env ?? {}).length;
        return [
          id,
          entry?.command ?? '',
          (entry?.args ?? []).length.toString(),
          envCount.toString(),
          chalk.green('✓ valid'),
        ];
      });

      log.blank();
      printTable(['Server', 'Command', 'Args', 'Env Vars', 'Status'], rows);
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Validate failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}