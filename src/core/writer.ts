import { safeReadJSON, safeWriteJSON } from '../utils/fs.js';
import { log } from '../utils/logger.js';
import type { McpJsonConfig, McpServerEntry } from '../types.js';

//
// mcp.json reader / writer
//

/**
 * Read mcp.json from disk. Returns { servers: {} } if the file does not
 * exist. Throws if the file exists but cannot be parsed.
 */
export async function readMcpJson(mcpJsonPath: string): Promise<McpJsonConfig> {
  const data = await safeReadJSON<McpJsonConfig>(mcpJsonPath);
  if (!data) {
    return { servers: {} };
  }
  if (typeof data !== 'object' || !('servers' in data)) {
    throw new Error(
      `mcp.json at ${mcpJsonPath} is malformed - missing "servers" key`
    );
  }
  return data;
}

/**
 * Write mcp.json to disk atomically (write to .tmp then rename).
 * Logs the path on success.
 */
export async function writeMcpJson(
  mcpJsonPath: string,
  config: McpJsonConfig
): Promise<void> {
  await safeWriteJSON(mcpJsonPath, config);
  log.success(`Written: ${mcpJsonPath}`);
}

/**
 * Add or overwrite a single MCP server entry in mcp.json.
 */
export async function addServerToMcpJson(
  mcpJsonPath: string,
  serverId: string,
  entry: McpServerEntry
): Promise<void> {
  const config = await readMcpJson(mcpJsonPath);
  config.servers[serverId] = entry;
  await writeMcpJson(mcpJsonPath, config);
}

/**
 * Remove a single MCP server entry from mcp.json.
 */
export async function removeServerFromMcpJson(
  mcpJsonPath: string,
  serverId: string
): Promise<void> {
  const config = await readMcpJson(mcpJsonPath);
  delete config.servers[serverId];
  await writeMcpJson(mcpJsonPath, config);
}

/**
 * Merge an incoming McpJsonConfig into the existing one.
 * Incoming servers win on key conflict.
 */
export async function mergeMcpJson(
  mcpJsonPath: string,
  incoming: McpJsonConfig
): Promise<void> {
  const existing = await readMcpJson(mcpJsonPath);
  existing.servers = { ...existing.servers, ...incoming.servers };
  if (incoming.inputs) {
    existing.inputs = [...(existing.inputs ?? []), ...incoming.inputs];
  }
  await writeMcpJson(mcpJsonPath, existing);
}