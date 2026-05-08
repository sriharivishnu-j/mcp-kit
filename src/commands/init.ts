import fs from "fs-extra";
import { MCP_KIT_META_PATH } from "../constants";
import { detectExistingMcps, detectNodeVersion, detectOS, detectVsCodePath, isNodeVersionCompatible } from "../core/detector";
import { getMcpsForProfile } from "../core/registry";
import { addServerToMcpJson } from "../core/writer";
import { buildEnvRefValue, ensureGitignore, storeCredential } from "../core/credentials";
import { collectDevAnswers } from "../prompts/dev-prompts";
import { collectNonDevAnswers } from "../prompts/non-dev-prompts";
import { askCredentialStorage, askMcpSelection } from "../prompts/shared-prompts";
import { CredentialStorage, McpDefinition, ProfileMode } from "../types";
import { log } from "../utils/logger";

const packageJson = require("../../package.json") as { version: string };

function buildArgs(mcp: McpDefinition, answers: Record<string, string>): string[] {
  if (mcp.id === "filesystem" && answers.FILESYSTEM_ALLOWED_PATH) {
    return [...mcp.args, answers.FILESYSTEM_ALLOWED_PATH];
  }
  return [...mcp.args];
}

function buildEnvRecord(
  mcp: McpDefinition,
  answers: Record<string, string>,
  storage: CredentialStorage
): Record<string, string> {
  const env: Record<string, string> = {};
  for (const envVar of mcp.envVars) {
    const rawValue = answers[envVar.key];
    if (!rawValue && !envVar.required) {
      continue;
    }
    env[envVar.key] = buildEnvRefValue(envVar.key, storage, rawValue);
  }
  return env;
}

export async function runInit(options: { dev?: boolean; nonDev?: boolean }): Promise<void> {
  try {
    if (!options.dev && !options.nonDev) {
      log.error("Usage: mcp-kit init --dev OR mcp-kit init --non-dev");
      process.exit(1);
    }

    if (options.dev && options.nonDev) {
      log.error("Use either --dev or --non-dev, not both");
      process.exit(1);
    }

    if (!isNodeVersionCompatible()) {
      log.error(`Node ${detectNodeVersion()} detected. Node >= 18.0.0 is required.`);
      process.exit(1);
    }

    const mode: ProfileMode = options.dev ? "dev" : "non-dev";
    log.header(`🔧 mcp-kit — MCP Configuration Wizard\nMode: ${mode === "dev" ? "Developer" : "Non-Developer"}`);

    const detected = await detectVsCodePath();
    log.success(`Detected OS: ${detectOS()}`);
    log.success(`Found .vscode at: ${detected.vscodeFolderPath} (source: ${detected.source})`);

    const existing = await detectExistingMcps(detected.mcpJsonPath);
    if (existing.length > 0) {
      log.warn(`Found existing config: ${existing.join(", ")}`);
    }

    const storage = await askCredentialStorage();
    const available = getMcpsForProfile(mode);
    const selectedIds = await askMcpSelection(available, existing);
    const selected = available.filter((mcp) => selectedIds.includes(mcp.id));

    const answers =
      mode === "dev"
        ? await collectDevAnswers(selected, storage)
        : await collectNonDevAnswers(selected, storage);

    for (const mcp of selected) {
      const mcpAnswers = answers.get(mcp.id) || {};

      for (const envVar of mcp.envVars.filter((item) => item.secret)) {
        const value = mcpAnswers[envVar.key];
        if (value) {
          await storeCredential(envVar.key, value, storage);
        }
      }

      const entry = {
        command: mcp.command,
        args: buildArgs(mcp, mcpAnswers),
        env: buildEnvRecord(mcp, mcpAnswers, storage)
      };

      await addServerToMcpJson(detected.mcpJsonPath, mcp.id, entry);
    }

    if (storage === "dotenv") {
      await ensureGitignore(process.cwd());
    }

    await fs.mkdirp(require("node:path").dirname(MCP_KIT_META_PATH));
    await fs.writeJSON(
      MCP_KIT_META_PATH,
      {
        installedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        profileMode: mode,
        vscodePath: detected.vscodeFolderPath,
        credentialStorage: storage,
        installedMcps: selected.map((mcp) => mcp.id),
        mcpKitVersion: packageJson.version
      },
      { spaces: 2 }
    );

    console.log("─────────────────────────────────────");
    log.success("mcp-kit setup complete!");
    console.log("─────────────────────────────────────");
    console.log("Configured:");
    for (const mcp of selected) {
      log.success(mcp.name);
    }
    console.log(`\nWritten to: ${detected.mcpJsonPath}`);
    console.log(`Credentials: ${storage === "keychain" ? "System Keychain" : storage === "dotenv" ? ".env file" : "Inline"}`);
    console.log("\nNext step: Reload VS Code window");
    console.log('Mac/Linux: Cmd+Shift+P → "Reload Window"');
    console.log('Windows: Ctrl+Shift+P → "Reload Window"');
    console.log("─────────────────────────────────────");
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error(`Init failed: ${message}`);
    log.muted("Suggestion: run `mcp-kit doctor` or retry with `DEBUG=1` for details.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
