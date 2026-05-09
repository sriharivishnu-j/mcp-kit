import chalk from 'chalk';
import { detectVsCodePath, detectOS, isNodeVersionCompatible, detectExistingMcps } from '../core/detector.js';
import { readMcpJson, addServerToMcpJson } from '../core/writer.js';
import { storeCredential, buildEnvRefValue, ensureGitignored, getEnvFilePath } from '../core/credentials.js';
import { getMcpsForProfile } from '../core/registry.js';
import { askCredentialStorage, askMcpSelection, askConfirm } from '../prompts/shared-prompts.js';
import { collectDevAnswers } from '../prompts/dev-prompts.js';
import { collectNonDevAnswers } from '../prompts/non-dev-prompts.js';
import { log, printTable } from '../utils/logger.js';
import { safeReadJSON, safeWriteJSON, ensureDir } from '../utils/fs.js';
import { MCP_KIT_META_PATH, MCP_KIT_DIR } from '../constants.js';
import type { McpDefinition, McpServerEntry, CredentialStorage, McpKitMeta, ProfileMode } from '../types.js';
import { createRequire } from 'node:module';
import path from 'node:path';
import os from 'node:os';

const _require = createRequire(import.meta.url);
const pkg = _require('../../package.json') as { version: string };

//
// Helpers
//

/**
 * Replace ${KEY} placeholders in an args array with actual values.
 */
function buildArgs(mcp: McpDefinition, answers: Record<string, string>): string[] {
  return mcp.args.map(arg =>
    arg.replace(/\$\{([^}]+)\}/g, (_, key: string) => answers[key] ?? '')
  );
}

/**
 * Build the resolved command for an MCP, handling any ${KEY} in command.
 */
function buildCommand(mcp: McpDefinition, answers: Record<string, string>): string {
  return mcp.command.replace(/\$\{([^}]+)\}/g, (_, key: string) => answers[key] ?? mcp.command);
}

/**
 * Determine which env var keys are embedded in args (via ${KEY} placeholders).
 */
function getArgEmbeddedKeys(mcp: McpDefinition): Set<string> {
  const keys = new Set<string>();
  const allText = [...mcp.args, mcp.command].join(' ');
  for (const match of allText.matchAll(/\$\{([^}]+)\}/g)) {
    keys.add(match[1]);
  }
  return keys;
}

/**
 * Build the env record for an MCP server entry.
 */
function buildEnvRecord(
  mcp: McpDefinition,
  answers: Record<string, string>,
  storage: CredentialStorage
): Record<string, string> {
  const argEmbedded = getArgEmbeddedKeys(mcp);
  const env: Record<string, string> = {};
  for (const envVar of mcp.envVars) {
    if (argEmbedded.has(envVar.key)) continue; // already in args
    const value = answers[envVar.key] ?? '';
    if (!value && !envVar.required) continue; // skip empty optional
    env[envVar.key] = buildEnvRefValue(envVar.key, storage, value);
  }
  return env;
}

//
// mcp-kit init
//

interface InitOptions {
  dev?: boolean;
  nonDev?: boolean;
  dryRun?: boolean;
}

export async function runInit(options: InitOptions): Promise<void> {
  try {
    // Validate flags
    if (!options.dev && !options.nonDev) {
      log.error('You must specify either --dev or --non-dev');
      log.muted('  Usage: mcp-kit init --dev');
      log.muted('         mcp-kit init --non-dev');
      process.exit(1);
    }

    if (options.dev && options.nonDev) {
      log.error('Use either --dev or --non-dev, not both');
      process.exit(1);
    }

    // Node version check
    if (!isNodeVersionCompatible()) {
      log.error(`Node.js >= 18.0.0 is required. Current: ${process.version}`);
      process.exit(1);
    }

    const profileMode: ProfileMode = options.dev ? 'dev' : 'non-dev';
    const modeLabel = profileMode === 'dev' ? 'Developer' : 'Non-Developer';

    log.header(`\n mcp-kit - MCP Configuration Wizard\n Mode: ${modeLabel}`);

    // Detect .vscode path
    const vscodePaths = await detectVsCodePath();
    const currentOS = detectOS();

    log.success(`Detected OS: ${currentOS}`);

    const sourceLabel =
      vscodePaths.source === 'project'
        ? 'project .vscode folder'
        : vscodePaths.source === 'global'
        ? 'VS Code global config'
        : 'created new .vscode folder';

    log.success(`Found ${sourceLabel} at: ${vscodePaths.vscodeFolderPath}`);

    // Check for existing config
    const existingMcps = await detectExistingMcps(vscodePaths.mcpJsonPath);
    if (existingMcps.length > 0) {
      log.warn(`Found existing MCP config: ${existingMcps.join(', ')}`);
    }

    // Ask credential storage mode
    const storage = await askCredentialStorage();

    // Get MCP list for this profile
    const profileMcps = getMcpsForProfile(profileMode);

    // Ask which MCPs to configure
    const selectedIds = await askMcpSelection(profileMcps, existingMcps);

    if (selectedIds.length === 0) {
      log.warn('No MCPs selected. Nothing to configure.');
      return;
    }

    const selectedMcps = profileMcps.filter(m => selectedIds.includes(m.id));

    // Collect answers
    const answers =
      profileMode === 'dev'
        ? await collectDevAnswers(selectedMcps, storage)
        : await collectNonDevAnswers(selectedMcps, storage);

    const envFilePath = getEnvFilePath(vscodePaths.vscodeFolderPath);

    log.blank();

    // DRY-RUN: preview only, do not write
    if (options.dryRun) {
      log.header('Dry-run preview - no files will be changed');

      const rows = selectedMcps.map(mcp => {
        const mcpAnswers = answers.get(mcp.id) ?? {};
        const entry: McpServerEntry = {
          type: 'stdio',
          command: buildCommand(mcp, mcpAnswers),
          args: buildArgs(mcp, mcpAnswers),
          env: buildEnvRecord(mcp, mcpAnswers, storage),
        };
        if (entry.env && Object.keys(entry.env).length === 0) delete entry.env;
        return [
          chalk.cyan(mcp.id),
          mcp.name,
          entry.command,
          (entry.args ?? []).join(' '),
          Object.keys(entry.env ?? {}).join(', ') || chalk.gray('-'),
        ];
      });

      printTable(['ID', 'Name', 'Command', 'Args', 'Env Vars'], rows);
      log.blank();
      log.muted(`Would write to: ${vscodePaths.mcpJsonPath}`);
      log.muted('Remove --dry-run to apply these changes.');
      return;
    }

    // LIVE: write to mcp.json
    log.step('Writing mcp.json entries...');

    const configured: string[] = [];
    const failed: string[] = [];

    for (const mcp of selectedMcps) {
      try {
        const mcpAnswers = answers.get(mcp.id) ?? {};
        const argEmbedded = getArgEmbeddedKeys(mcp);

        // Store secrets
        for (const envVar of mcp.envVars) {
          if (argEmbedded.has(envVar.key)) continue;
          const value = mcpAnswers[envVar.key];
          if (value && envVar.secret && storage !== 'inline') {
            await storeCredential(envVar.key, value, storage, envFilePath);
          }
        }

        // Build entry
        const entry: McpServerEntry = {
          type: 'stdio',
          command: buildCommand(mcp, mcpAnswers),
          args: buildArgs(mcp, mcpAnswers),
          env: buildEnvRecord(mcp, mcpAnswers, storage),
        };

        // Remove empty env block
        if (entry.env && Object.keys(entry.env).length === 0) {
          delete entry.env;
        }

        await addServerToMcpJson(vscodePaths.mcpJsonPath, mcp.id, entry);
        configured.push(mcp.name);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.error(`Failed to configure ${mcp.name}: ${message}`);
        failed.push(mcp.name);
      }
    }

    // Ensure .gitignore for dotenv mode
    if (storage === 'dotenv') {
      const projectDir = path.dirname(vscodePaths.vscodeFolderPath);
      await ensureGitignored(projectDir);
    }

    // Update meta.json
    await ensureDir(MCP_KIT_DIR);
    const existingMeta = await safeReadJSON<McpKitMeta>(MCP_KIT_META_PATH) ?? {};
    const currentInstalled = (existingMeta as McpKitMeta).installedMcps ?? [];
    const meta: Partial<McpKitMeta> = {
      ...(existingMeta as McpKitMeta),
      installedAt: (existingMeta as McpKitMeta).installedAt ?? new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      profileMode,
      vscodePath: vscodePaths.mcpJsonPath,
      credentialStorage: storage,
      installedMcps: [...new Set([...currentInstalled, ...selectedIds])],
      mcpKitVersion: pkg.version,
    };

    await safeWriteJSON(MCP_KIT_META_PATH, meta);

    // Print final summary
    log.blank();
    log.header('✓ mcp-kit setup complete!');
    log.blank();

    const summaryRows = [
      ...configured.map(n => [chalk.green('✓'), n, 'configured']),
      ...failed.map(n => [chalk.red('✗'), n, 'failed']),
    ];

    printTable(['', 'MCP', 'Result'], summaryRows);
    log.muted(`Written to: ${vscodePaths.mcpJsonPath}`);
    log.muted(`Credentials: ${storage}`);
    log.blank();
    log.step('Next step: Reload VS Code window');
    log.muted(
      currentOS === 'windows'
        ? 'Windows: Ctrl+Shift+P → "Reload Window"'
        : 'Mac/Linux: Cmd+Shift+P → "Reload Window"'
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Init failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}