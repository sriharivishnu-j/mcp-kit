import fs from "fs-extra";
import path from "node:path";
import { log } from "../utils/logger";
import { validateMcpJson } from "./validator";
import { McpJsonConfig, McpServerEntry } from "../types";

export async function readMcpJson(mcpJsonPath: string): Promise<McpJsonConfig> {
  if (!(await fs.pathExists(mcpJsonPath))) {
    return { servers: {} };
  }

  const raw = await fs.readFile(mcpJsonPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return validateMcpJson(parsed);
}

export async function writeMcpJson(mcpJsonPath: string, config: McpJsonConfig): Promise<void> {
  await fs.mkdirp(path.dirname(mcpJsonPath));
  const tmpPath = `${mcpJsonPath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(config, null, 2), "utf8");
  await fs.rename(tmpPath, mcpJsonPath);
  log.success(`Written: ${mcpJsonPath}`);
}

export async function addServerToMcpJson(
  mcpJsonPath: string,
  serverId: string,
  entry: McpServerEntry
): Promise<void> {
  const config = await readMcpJson(mcpJsonPath);
  config.servers[serverId] = entry;
  await writeMcpJson(mcpJsonPath, config);
}

export async function removeServerFromMcpJson(mcpJsonPath: string, serverId: string): Promise<void> {
  const config = await readMcpJson(mcpJsonPath);
  delete config.servers[serverId];
  await writeMcpJson(mcpJsonPath, config);
}

export async function mergeMcpJson(mcpJsonPath: string, incoming: McpJsonConfig): Promise<void> {
  const existing = await readMcpJson(mcpJsonPath);
  const merged: McpJsonConfig = {
    servers: {
      ...existing.servers,
      ...incoming.servers
    }
  };
  await writeMcpJson(mcpJsonPath, merged);
}
