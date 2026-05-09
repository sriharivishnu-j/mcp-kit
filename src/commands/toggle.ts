import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson, writeMcpJson } from '../core/writer.js';
import { getMcpById } from '../core/registry.js';
import { log } from '../utils/logger.js';

//
// mcp-kit enable <id> / mcp-kit disable <id>
//

export async function runEnable(mcpId: string): Promise<void> {
  await setDisabled(mcpId, false);
}

export async function runDisable(mcpId: string): Promise<void> {
  await setDisabled(mcpId, true);
}

async function setDisabled(mcpId: string, disabled: boolean): Promise<void> {
  const action = disabled ? 'disable' : 'enable';
  try {
    const vscodePaths = await detectVsCodePath();
    const config = await readMcpJson(vscodePaths.mcpJsonPath);

    if (!config.servers[mcpId]) {
      log.error(`"${mcpId}" is not configured. Run "mcp-kit list" to see configured MCPs.`);
      process.exit(1);
    }

    const entry = config.servers[mcpId]!;

    if (disabled && entry.disabled === true) {
      log.warn(`${mcpId} is already disabled.`);
      return;
    }

    if (!disabled && !entry.disabled) {
      log.warn(`${mcpId} is already enabled.`);
      return;
    }

    if (disabled) {
      entry.disabled = true;
    } else {
      delete entry.disabled;
    }

    config.servers[mcpId] = entry;
    await writeMcpJson(vscodePaths.mcpJsonPath, config);

    const def = getMcpById(mcpId);
    const label = def?.name ?? mcpId;

    if (disabled) {
      log.success(`${label} disabled - VS Code will ignore it until re-enabled.`);
    } else {
      log.success(`${label} enabled - reload VS Code to activate (Cmd/Ctrl+Shift+P → Reload Window).`);
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Failed to ${action} ${mcpId}: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}