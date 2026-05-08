import axios from "axios";
import { MCP_REGISTRY } from "../constants";
import { McpCategory, McpDefinition, ProfileMode } from "../types";

export function getMcpById(id: string): McpDefinition | undefined {
  return MCP_REGISTRY.find((mcp) => mcp.id === id);
}

export function getMcpsForProfile(mode: ProfileMode): McpDefinition[] {
  if (mode === "dev") {
    return MCP_REGISTRY.filter((mcp) => !mcp.nonDevOnly);
  }

  return MCP_REGISTRY.filter((mcp) => !mcp.devOnly);
}

export function getMcpsByCategory(category: McpCategory): McpDefinition[] {
  return MCP_REGISTRY.filter((mcp) => mcp.category === category);
}

export async function getLatestVersion(npmPackage: string): Promise<string> {
  try {
    const response = await axios.get<{ version?: string }>(`https://registry.npmjs.org/${npmPackage}/latest`, {
      timeout: 5000
    });
    return response.data.version || "unknown";
  } catch {
    return "unknown";
  }
}

export async function enrichWithVersions(mcps: McpDefinition[]): Promise<McpDefinition[]> {
  const versions = await Promise.all(mcps.map((mcp) => getLatestVersion(mcp.npmPackage)));
  return mcps.map((mcp, index) => ({ ...mcp, version: versions[index] }));
}
