import fs from "fs-extra";
import path from "node:path";
import { MCP_REGISTRY } from "../constants";
import { detectVsCodePath } from "../core/detector";
import { readMcpJson } from "../core/writer";
import { log, printTable } from "../utils/logger";

interface EnvCheckOptions {
  json?: boolean;
}

export async function runEnvCheck(options: EnvCheckOptions = {}): Promise<void> {
  try {
    const detected = await detectVsCodePath();
    const config = await readMcpJson(detected.mcpJsonPath);
    const envPath = path.join(process.cwd(), ".env");
    const envContent = (await fs.pathExists(envPath)) ? await fs.readFile(envPath, "utf8") : "";

    const rows: string[][] = [];
    for (const [id, server] of Object.entries(config.servers)) {
      const mcp = MCP_REGISTRY.find((item) => item.id === id);
      if (!mcp) {
        continue;
      }

      for (const envVar of mcp.envVars) {
        const configured = server.env?.[envVar.key] || "";
        const isRef = configured.startsWith("${env:");
        const hasEnv = envContent.includes(`${envVar.key}=`);
        const status = configured.length === 0
          ? (envVar.required ? "Missing" : "Optional")
          : isRef
            ? (hasEnv ? "OK (.env)" : "Ref missing")
            : "Inline";

        rows.push([id, envVar.key, envVar.required ? "Yes" : "No", status]);
      }
    }

    if (options.json) {
      console.log(JSON.stringify(rows, null, 2));
      return;
    }

    printTable(["MCP", "Env Key", "Required", "Status"], rows);
    process.exit(0);
  } catch (err) {
    log.error(`env-check failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    log.muted("Suggestion: run `mcp-kit init --dev` to repair env mappings.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
