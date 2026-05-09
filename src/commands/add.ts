import inquirer from 'inquirer';
import chalk from 'chalk';
import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson, addServerToMcpJson } from '../core/writer.js';
import { getMcpById } from '../core/registry.js';
import { storeCredential, buildEnvRefValue, getEnvFilePath } from '../core/credentials.js';
import { askCredentialStorage } from '../prompts/shared-prompts.js';
import { log } from '../utils/logger.js';
import { safeReadJSON, safeWriteJSON, ensureDir } from '../utils/fs.js';
import { MCP_REGISTRY, MCP_KIT_META_PATH, MCP_KIT_DIR } from '../constants.js';
import type { McpDefinition, McpServerEntry, CredentialStorage, McpKitMeta } from '../types.js';
import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);
const pkg = _require('../../package.json') as { version: string };

//
// mcp-kit add <mcp-id>
//

function buildArgs(mcp: McpDefinition, answers: Record<string, string>): string[] {
  return mcp.args.map(arg =>
    arg.replace(/\$\{([^}]+)\}/g, (_, key: string) => answers[key] ?? '')
  );
}

function buildCommand(mcp: McpDefinition, answers: Record<string, string>): string {
  return mcp.command.replace(/\$\{([^}]+)\}/g, (_, key: string) => answers[key] ?? mcp.command);
}

function getArgEmbeddedKeys(mcp: McpDefinition): Set<string> {
  const keys = new Set<string>();
  const allText = [...mcp.args, mcp.command].join('');
  const matches = allText.matchAll(/\$\{([^}]+)\}/g);
  for (const match of matches) {
    keys.add(match[1]);
  }
  return keys;
}

function buildEnvRecord(
  mcp: McpDefinition,
  answers: Record<string, string>,
  storage: CredentialStorage
): Record<string, string> {
  const argEmbedded = getArgEmbeddedKeys(mcp);
  const env: Record<string, string> = {};
  for (const envVar of mcp.envVars) {
    if (argEmbedded.has(envVar.key)) continue;
    const value = answers[envVar.key] ?? '';
    if (!value && !envVar.required) continue;
    env[envVar.key] = buildEnvRefValue(envVar.key, storage, value);
  }
  return env;
}

export async function runAdd(mcpId: string): Promise<void> {
  try {
    if (!mcpId) {
      log.error('Please specify an MCP ID: mcp-kit add <mcp-id>');
      log.info('Run "mcp-kit list" to see all available MCPs.');
      process.exit(1);
    }

    const mcp = getMcpById(mcpId);
    if (!mcp) {
      log.error(`Unknown MCP: "${mcpId}"`);
      log.blank();
      log.info('Available MCP IDs:');
      MCP_REGISTRY.forEach(m => log.muted(`  ${m.id.padEnd(16)} ${m.name}`));
      process.exit(1);
    }

    const vscodePaths = await detectVsCodePath();
    const config = await readMcpJson(vscodePaths.mcpJsonPath);

    if (config.servers[mcpId]) {
      log.warn(`${mcp.name} is already configured. Continuing will overwrite it.`);
    }

    const storage = await askCredentialStorage();
    const envFilePath = getEnvFilePath(vscodePaths.vscodeFolderPath);

    // Collect answers for this MCP
    const answers: Record<string, string> = {};

    if (mcp.envVars.length > 0) {
      console.log('');
      console.log(chalk.bold.cyan(`Setting up: ${mcp.name}`));
      console.log(chalk.gray(`${mcp.description}`));

      const questions = mcp.envVars.map(envVar => {
        if (envVar.hint) console.log(chalk.gray(`${envVar.hint}`));
        return {
          type: envVar.secret ? 'password' : 'input',
          name: envVar.key,
          message: `${envVar.label}${envVar.required ? ' *' : ' (optional)'}`,
          default: envVar.defaultValue ?? '',
          validate: (input: string): boolean | string => {
            if (!envVar.required) return true;
            if (input.trim().length === 0) return 'This field is required';
            return true;
          },
        };
      });

      const raw = await inquirer.prompt<Record<string, string>>(questions);
      Object.assign(answers, raw);
    }

    const argEmbedded = getArgEmbeddedKeys(mcp);

    // Store secrets
    for (const envVar of mcp.envVars) {
      if (argEmbedded.has(envVar.key)) continue;
      const value = answers[envVar.key];
      if (value && envVar.secret && storage !== 'inline') {
        await storeCredential(envVar.key, value, storage, envFilePath);
      }
    }

    const entry: McpServerEntry = {
      type: 'stdio',
      command: buildCommand(mcp, answers),
      args: buildArgs(mcp, answers),
      env: buildEnvRecord(mcp, answers, storage),
    };

    if (entry.env && Object.keys(entry.env).length === 0) {
      delete entry.env;
    }

    await addServerToMcpJson(vscodePaths.mcpJsonPath, mcp.id, entry);

    // Update meta
    await ensureDir(MCP_KIT_DIR);
    const existingMeta = await safeReadJSON<McpKitMeta>(MCP_KIT_META_PATH) ?? {};
    const currentInstalled = (existingMeta as McpKitMeta).installedMcps ?? [];
    const meta: Partial<McpKitMeta> = {
      ...(existingMeta as McpKitMeta),
      lastUpdated: new Date().toISOString(),
      installedMcps: [...new Set([...currentInstalled, mcpId])],
      mcpKitVersion: pkg.version,
    };

    await safeWriteJSON(MCP_KIT_META_PATH, meta);
    log.success(`Added ${mcp.name} to ${vscodePaths.mcpJsonPath}`);
    log.info('Reload VS Code to activate: Cmd/Ctrl+Shift+P → "Reload Window"');

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Add failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}