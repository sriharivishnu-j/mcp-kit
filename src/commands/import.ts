import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'node:path';
import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson, addServerToMcpJson } from '../core/writer.js';
import { getMcpById } from '../core/registry.js';
import { storeCredential, buildEnvRefValue, getEnvFilePath } from '../core/credentials.js';
import { askCredentialStorage, askConfirm } from '../prompts/shared-prompts.js';
import { log } from '../utils/logger.js';
import { safeReadJSON, safeWriteJSON, ensureDir } from '../utils/fs.js';
import { validateMcpJson } from '../core/validator.js';
import { MCP_KIT_META_PATH, MCP_KIT_DIR } from '../constants.js';
import type { McpKitMeta, McpKitExport, McpServerEntry } from '../types.js';
import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);
const pkg = _require('../../package.json') as { version: string };

//
// mcp-kit import <file>
//

export async function runImport(file: string): Promise<void> {
  try {
    if (!file) {
      log.error('Please specify a file: mcp-kit import <file>');
      process.exit(1);
    }

    const filePath = path.resolve(file);
    const raw = await safeReadJSON<McpKitExport>(filePath);

    if (!raw) {
      log.error(`Could not read file: ${filePath}`);
      log.step('Make sure the file exists and is valid JSON.');
      process.exit(1);
    }

    if (!raw.servers || typeof raw.servers !== 'object') {
      log.error('Invalid export file - missing "servers" key.');
      process.exit(1);
    }

    // Validate the servers structure
    try {
      validateMcpJson({ servers: raw.servers });
    } catch (err) {
      log.error(`Import file validation failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }

    log.header('mcp-kit - Import Configuration\n');
    log.info(`Contains ${Object.keys(raw.servers).length} MCP server(s)`);

    if (raw.exportedAt) {
      log.muted(`Exported: ${raw.exportedAt}`);
      log.muted(`From: ${path.basename(filePath)}`);
    }

    const vscodePaths = await detectVsCodePath();
    const existing = await readMcpJson(vscodePaths.mcpJsonPath);
    const existingIds = Object.keys(existing.servers);
    const incomingIds = Object.keys(raw.servers);
    const conflicts = incomingIds.filter(id => existingIds.includes(id));

    if (conflicts.length > 0) {
      log.warn(`Conflicts detected for: ${conflicts.join(', ')}`);
      const overwrite = await askConfirm(`Overwrite existing config for: ${conflicts.join(', ')}?`);
      if (!overwrite) {
        log.info('Aborted. No changes were made.');
        return;
      }
    }

    const storage = await askCredentialStorage();
    const envFilePath = getEnvFilePath(vscodePaths.vscodeFolderPath);
    let importedCount = 0;

    for (const [serverId, entry] of Object.entries(raw.servers)) {
      const def = getMcpById(serverId);

      // Build the final entry, prompting for REDACTED values
      const finalEntry: McpServerEntry = {
        ...entry,
        env: { ...(entry.env ?? {}) },
      };

      for (const [envKey, envVal] of Object.entries(entry.env ?? {})) {
        if (envVal !== 'REDACTED') continue;

        const def2 = def?.envVars.find(e => e.key === envKey);
        const label = def2?.label ?? envKey;
        const isSecret = def2?.secret ?? true;

        console.log('');
        if (def2?.hint) console.log(chalk.gray(`  i ${def2.hint}`));

        const answers = await inquirer.prompt<{ value: string }>([
          {
            type: isSecret ? 'password' : 'input',
            name: 'value',
            message: `Enter value for ${label}:`,
            validate: (v: string) =>
              def2?.required ? (v.trim().length > 0 || 'This field is required') : true,
          },
        ]);

        const value = answers.value;
        if (value && storage !== 'inline') {
          await storeCredential(envKey, value, storage, envFilePath);
        }
        finalEntry.env![envKey] = buildEnvRefValue(envKey, storage, value);
      }

      if (finalEntry.env && Object.keys(finalEntry.env).length === 0) {
        delete finalEntry.env;
      }

      await addServerToMcpJson(vscodePaths.mcpJsonPath, serverId, finalEntry);
      importedCount++;
    }

    // Update meta
    await ensureDir(MCP_KIT_DIR);
    const existingMeta = await safeReadJSON<McpKitMeta>(MCP_KIT_META_PATH) ?? {};
    const currentInstalled = (existingMeta as McpKitMeta).installedMcps ?? [];
    const meta: Partial<McpKitMeta> = {
      ...(existingMeta as McpKitMeta),
      lastUpdated: new Date().toISOString(),
      installedMcps: [...new Set([...currentInstalled, ...incomingIds])],
      mcpKitVersion: pkg.version,
    };

    await safeWriteJSON(MCP_KIT_META_PATH, meta);

    log.blank();
    log.success(`Imported ${importedCount} MCP(s) from ${path.basename(filePath)}`);
    log.info('Reload VS Code to activate: Cmd/Ctrl+Shift+P → "Reload Window"');

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Import failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}