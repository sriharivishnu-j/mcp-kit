import axios from "axios";
import { z } from "zod";
import { McpJsonConfig } from "../types";

const mcpJsonSchema = z.object({
  servers: z.record(
    z.object({
      command: z.string(),
      args: z.array(z.string()),
      env: z.record(z.string()).optional()
    })
  )
});

export function validateMcpJson(config: unknown): McpJsonConfig {
  const result = mcpJsonSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid mcp.json format: ${result.error.issues.map((i) => i.message).join(", ")}`);
  }
  return result.data;
}

export async function checkNetworkReachability(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}

export async function checkNpmPackageExists(pkg: string): Promise<boolean> {
  try {
    const response = await axios.get(`https://registry.npmjs.org/${pkg}`, { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

export function validateEnvVar(value: string, regex?: string): boolean {
  if (!regex) {
    return value.trim().length > 0;
  }

  return new RegExp(regex).test(value);
}
