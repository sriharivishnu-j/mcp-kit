import chalk from 'chalk';
import boxen from 'boxen';
import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson } from '../core/writer.js';
import { getMcpById } from '../core/registry.js';
import { deleteCredential, getEnvFilePath } from '../core/credentials.js';
import { askConfirm } from '../prompts/shared-prompts.js';
import { log } from '../utils/logger.js';
import { safeReadJSON, deleteFile, fileExists } from '../utils/fs.js';
import { MCP_KIT_META_PATH } from '../constants.js';
import type { McpKitMeta, CredentialStorage } from '../types.js';

//
// mcp-kit reset
//

export async function runReset(): Promise<void> {
  try {
    // Warning box
    console.log(
      boxen(
        chalk.red.bold('⚠ RESET WARNING\n') +
          chalk.white(
            'This will delete mcp.json and all stored credentials.\n' +
              'This action CANNOT be undone.'
          ),
        { padding: 1, borderColor: 'red', borderStyle: 'round' }
      )
    );

    const confirmed = await askConfirm(
      'Are you absolutely sure you want to reset everything?'
    );
    if (!confirmed) {
      log.info('Aborted. Nothing was changed.');
      return;
    }

    const deleteCreds = await askConfirm(
      'Also remove stored credentials from keychain / env?'
    );

    const vscodePaths = await detectVsCodePath();
    const meta = await safeReadJSON<McpKitMeta>(MCP_KIT_META_PATH);
    const credStorage: CredentialStorage = meta?.credentialStorage ?? 'keychain';
    const envFilePath = getEnvFilePath(vscodePaths.vscodeFolderPath);

    // Delete credentials if requested
    if (deleteCreds && meta?.installedMcps) {
      for (const mcpId of meta.installedMcps) {
        const def = getMcpById(mcpId);
        if (!def) continue;
        for (const envVar of def.envVars) {
          if (envVar.secret) {
            await deleteCredential(envVar.key, credStorage, envFilePath);
          }
        }
      }
      log.success('Stored credentials have been deleted.');
    }

    // Delete mcp.json
    if (await fileExists(vscodePaths.mcpJsonPath)) {
      await deleteFile(vscodePaths.mcpJsonPath);
      log.success(`Deleted: ${vscodePaths.mcpJsonPath}`);
    }

    // Delete meta.json
    if (await fileExists(MCP_KIT_META_PATH)) {
      await deleteFile(MCP_KIT_META_PATH);
      log.success('Deleted: ~/.mcp-kit/meta.json');
    }

    log.blank();
    log.success('Reset complete.');
    log.info('Run "mcp-kit init --dev" to start fresh.');

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Reset failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}