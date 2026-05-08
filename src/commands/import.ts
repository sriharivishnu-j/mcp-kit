import fs from "fs-extra";
import inquirer from "inquirer";
import path from "node:path";
import { MCP_KIT_META_PATH } from "../constants";
import { buildEnvRefValue, storeCredential } from "../core/credentials";
import { detectVsCodePath } from "../core/detector";
import { getMcpById } from "../core/registry";
import { addServerToMcpJson, readMcpJson } from "../core/writer";
import { askConfirm, askCredentialStorage } from "../prompts/shared-prompts";
import { log } from "../utils/logger";

export async function runImport(file: string): Promise<void> {
  try {
    const input = await fs.readJSON(file);
    if (!input || typeof input !== "object" || !("servers" in input)) {
      throw new Error("Invalid import file. Missing 'servers' key.");
    }

    const detected = await detectVsCodePath();
    const existing = await readMcpJson(detected.mcpJsonPath);
    const incomingServers = input.servers as Record<string, { command: string; args: string[]; env?: Record<string, string> }>;

    const conflicts = Object.keys(incomingServers).filter((id) => Boolean(existing.servers[id]));
    if (conflicts.length > 0) {
      const overwrite = await askConfirm(`Overwrite existing ${conflicts.join(", ")}?`);
      if (!overwrite) {
        log.info("Import cancelled due to conflicts.");
        process.exit(0);
      }
    }

    const storage = await askCredentialStorage();

    for (const [id, server] of Object.entries(incomingServers)) {
      const mcp = getMcpById(id);
      const env = { ...(server.env || {}) };

      if (mcp) {
        for (const envVar of mcp.envVars) {
          const existingValue = env[envVar.key];
          if (existingValue === "REDACTED" || !existingValue) {
            const response = await inquirer.prompt<{ value: string }>([
              {
                type: envVar.secret ? "password" : "input",
                name: "value",
                message: `Enter value for ${envVar.label}`,
                mask: envVar.secret ? "*" : undefined,
                validate: (val: string) => !envVar.required || val.length > 0 || "This field is required"
              }
            ]);

            if (response.value) {
              if (envVar.secret) {
                await storeCredential(envVar.key, response.value, storage);
              }
              env[envVar.key] = buildEnvRefValue(envVar.key, storage, response.value);
            }
          }
        }
      }

      await addServerToMcpJson(detected.mcpJsonPath, id, {
        command: server.command,
        args: server.args,
        env
      });
    }

    await fs.mkdirp(path.dirname(MCP_KIT_META_PATH));
    await fs.writeJSON(
      MCP_KIT_META_PATH,
      {
        installedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        profileMode: input.profileMode || "dev",
        vscodePath: detected.vscodeFolderPath,
        credentialStorage: storage,
        installedMcps: Object.keys(incomingServers),
        mcpKitVersion: require("../../package.json").version
      },
      { spaces: 2 }
    );

    log.success(`Imported ${Object.keys(incomingServers).length} MCPs from ${file}`);
    log.info("Reload VS Code to activate");
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error(`Import failed: ${message}`);
    log.muted("Suggestion: verify import file format from `mcp-kit export`.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
