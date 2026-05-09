import { z } from 'zod';
import axios from 'axios';
import { checkNpmPackageExists } from '../utils/network.js';
import type { McpJsonConfig } from '../types.js';

//
// Zod schema for mcp.json validation
//

const McpServerEntrySchema = z.object({
  type: z.string().optional(),
  command: z.string().min(1, 'command must be a non-empty string'),
  args: z.array(z.string()),
  env: z.record(z.string()).optional(),
});

const McpJsonConfigSchema = z.object({
  inputs: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        description: z.string(),
        password: z.boolean().optional(),
      })
    )
    .optional(),
  servers: z.record(McpServerEntrySchema),
});

//
// Public API
//

/**
 * Validate an unknown value against the mcp.json schema.
 * Throws a descriptive ZodError if the input is invalid.
 */
export function validateMcpJson(config: unknown): McpJsonConfig {
  const result = McpJsonConfigSchema.safeParse(config);
  if (!result.success) {
    const messages = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid mcp.json structure:\n${messages}`);
  }
  return result.data as McpJsonConfig;
}

/**
 * Check whether a URL is reachable. Returns true on a 2xx response.
 */
export async function checkNetworkReachability(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}

/**
 * Check whether an npm package exists in the public registry.
 */
export { checkNpmPackageExists };

/**
 * Validate a single env var value.
 * - If no regex is provided: passes when the trimmed value is non-empty.
 * - If a regex is provided: passes when the value matches the regex.
 */
export function validateEnvVar(value: string, regex?: string): boolean {
  if (!regex) {
    return value.trim().length > 0;
  }
  try {
    return new RegExp(regex).test(value);
  } catch {
    return value.trim().length > 0;
  }
}