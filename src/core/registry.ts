import { MCP_REGISTRY, DEV_MCP_IDS, NON_DEV_MCP_IDS } from '../constants.js';
import { getNpmPackageVersion } from '../utils/network.js';
import type { McpDefinition, McpCategory, ProfileMode } from '../types.js';

//
// MCP catalog manager
//

/**
 * Look up an MCP definition by its slug ID.
 */
export function getMcpById(id: string): McpDefinition | undefined {
  return MCP_REGISTRY.find(mcp => mcp.id === id);
}

/**
 * Return all MCPs appropriate for the given profile mode.
 * - dev:     all MCPs where nonDevOnly === false
 * - non-dev: all MCPs where devOnly === false
 */
export function getMcpsForProfile(mode: ProfileMode): McpDefinition[] {
  if (mode === 'dev') {
    return MCP_REGISTRY.filter(mcp => !mcp.nonDevOnly);
  }
  return MCP_REGISTRY.filter(mcp => !mcp.devOnly);
}

/**
 * Return all MCPs in the given category.
 */
export function getMcpsByCategory(category: McpCategory): McpDefinition[] {
  return MCP_REGISTRY.filter(mcp => mcp.category === category);
}

/**
 * Return only the default MCPs for a profile (the pre-selected defaults
 * listed in DEV_MCP_IDS / NON_DEV_MCP_IDS).
 */
export function getDefaultMcpIds(mode: ProfileMode): string[] {
  return mode === 'dev' ? DEV_MCP_IDS : NON_DEV_MCP_IDS;
}

/**
 * Fetch the latest published version of an npm package from the npm registry.
 * Returns "unknown" on any network error.
 */
export async function getLatestVersion(npmPackage: string): Promise<string> {
  const version = await getNpmPackageVersion(npmPackage);
  return version ?? 'unknown';
}

/**
 * Enrich a list of McpDefinition objects with their latest npm versions.
 * All version lookups run in parallel.
 */
export async function enrichWithVersions(
  mcps: McpDefinition[]
): Promise<McpDefinition[]> {
  const versions = await Promise.all(
    mcps.map(mcp => getLatestVersion(mcp.npmPackage))
  );
  return mcps.map((mcp, i) => ({ ...mcp, version: versions[i] }));
}