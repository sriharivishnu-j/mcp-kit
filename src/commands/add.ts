import fs from "fs-extra";
import inquirer from "inquirer";
import { MCP_KIT_META_PATH } from "../constants";
import { detectVsCodePath } from "../core/detector";
import { buildEnvRefValue, storeCredential } from "../core/credentials";
import { getMcpById } from "../core/registry";
import { addServerToMcpJson, readMcpJson } from "../core/writer";
import { askCredentialStorage } from "../prompts/shared-prompts";
import { log } from "../utils/logger";

export async function runAdd(mcpId: string): Promise<void> {
  try {
    const mcp = getMcpById(mcpId);
    if (!mcp) {
      log.error(`Unknown MCP: ${mcpId}`);
      log.info("Run `mcp-kit list --available` to see valid MCP IDs.");
      process.exit(1);
    }

    const detected = await detectVsCodePath();
    const config = await readMcpJson(detected.mcpJsonPath);
    if (config.servers[mcpId]) {
      log.warn(`MCP ${mcpId} is already configured. Reconfiguring...`);
    }

    const storage = await askCredentialStorage();
    const answers: Record<string, string> = {};

    for (const envVar of mcp.envVars) {
      const response = await inquirer.prompt<{ value: string }>([
        {
          type: envVar.secret ? "password" : "input",
          name: "value",
          message: `${envVar.label}${envVar.required ? " *" : " (optional)"}`,
          mask: envVar.secret ? "*" : undefined,
          validate: (input: string) => !envVar.required || input.length > 0 || "This field is required"
        }
      ]);
      answers[envVar.key] = response.value;

      if (envVar.secret && response.value) {
        await storeCredential(envVar.key, response.value, storage);
      }
    }

    const args = mcp.id === "filesystem" && answers.FILESYSTEM_ALLOWED_PATH
      ? [...mcp.args, answers.FILESYSTEM_ALLOWED_PATH]
      : [...mcp.args];

    const env: Record<string, string> = {};
    for (const envVar of mcp.envVars) {
      const value = answers[envVar.key];
      if (!value && !envVar.required) {
        continue;
      }
      env[envVar.key] = buildEnvRefValue(envVar.key, storage, value);
    }

    await addServerToMcpJson(detected.mcpJsonPath, mcp.id, {
      command: mcp.command,
      args,
      env
    });

    const meta = (await fs.pathExists(MCP_KIT_META_PATH))
      ? await fs.readJSON(MCP_KIT_META_PATH)
      : {
          installedAt: new Date().toISOString(),
          mcpKitVersion: require("../../package.json").version,
          installedMcps: []
        };

    meta.lastUpdated = new Date().toISOString();
    meta.credentialStorage = storage;
    meta.vscodePath = detected.vscodeFolderPath;
    meta.installedMcps = Array.from(new Set([...(meta.installedMcps || []), mcp.id]));

    await fs.mkdirp(require("node:path").dirname(MCP_KIT_META_PATH));
    await fs.writeJSON(MCP_KIT_META_PATH, meta, { spaces: 2 });

    log.success(`Added ${mcp.name} to ${detected.mcpJsonPath}`);
    log.info("Reload VS Code to activate");
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error(`Add failed: ${message}`);
    log.muted("Suggestion: run `mcp-kit doctor` after fixing input values.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
