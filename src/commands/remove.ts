import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson, removeServerFromMcpJson } from '../core/writer.js';
import { getMcpById } from '../core/registry.js';
import { deleteCredential, getEnvFilePath } from '../core/credentials.js';
import { askConfirm } from '../prompts/shared-prompts.js';
import { log } from '../utils/logger.js';
import { safeReadJSON, safeWriteJSON, ensureDir } from '../utils/fs.js';
import { MCP_KIT_META_PATH, MCP_KIT_DIR } from '../constants.js';
import type { McpKitMeta, CredentialStorage } from '../types.js';
import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);
const pkg = _require('../../package.json') as { version: string };

//
// mcp-kit remove <mcp-id>
//

export async function runRemove(mcpId: string): Promise<void> {
  try {
    if (!mcpId) {
      log.error('Please specify an MCP ID: mcp-kit remove <mcp-id>');
      process.exit(1);
    }

    const vscodePaths = await detectVsCodePath();
    const config = await readMcpJson(vscodePaths.mcpJsonPath);

    if (!(mcpId in config.servers)) {
      log.error(`MCP "${mcpId}" is not currently configured.`);
      log.info('Run "mcp-kit list" to see configured MCPs.');
      process.exit(1);
    }

    const mcp = getMcpById(mcpId);
    const displayName = mcp?.name ?? mcpId;

    const confirmed = await askConfirm(`Remove ${displayName} from mcp.json?`);
    if (!confirmed) {
      log.info('Aborted. No changes were made.');
      return;
    }

    await removeServerFromMcpJson(vscodePaths.mcpJsonPath, mcpId);

    // Optionally purge credentials
    const meta = await safeReadJSON<McpKitMeta>(MCP_KIT_META_PATH);
    const credStorage: CredentialStorage = meta?.credentialStorage ?? 'keychain';
    const envFilePath = getEnvFilePath(vscodePaths.vscodeFolderPath);

    if (mcp && (credStorage === 'keychain' || credStorage === 'dotenv')) {
      const deleteCreds = await askConfirm(
        `Also delete stored credentials for ${displayName} from ${credStorage}?`
      );
      if (deleteCreds) {
        for (const envVar of mcp.envVars) {
          if (envVar.secret) {
            await deleteCredential(envVar.key, credStorage, envFilePath);
          }
        }
        log.success(`Credentials deleted from ${credStorage}.`);
      }
    }

    // Update meta
    if (meta) {
      const updated: McpKitMeta = {
        ...meta,
        lastUpdated: new Date().toISOString(),
        installedMcps: meta.installedMcps.filter(id => id !== mcpId),
        mcpKitVersion: pkg.version,
      };
      await ensureDir(MCP_KIT_DIR);
      await safeWriteJSON(MCP_KIT_META_PATH, updated);
    }

    log.blank();
    log.success(`Removed ${displayName} from your MCP configuration.`);
    log.info('Reload VS Code to apply: Cmd/Ctrl+Shift+P → "Reload Window"');

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Remove failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}