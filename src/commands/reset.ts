import chalk from "chalk";
import fs from "fs-extra";
import boxen from "boxen";
import { MCP_KIT_META_PATH } from "../constants";
import { deleteCredential } from "../core/credentials";
import { detectVsCodePath } from "../core/detector";
import { getMcpById } from "../core/registry";
import { askConfirm } from "../prompts/shared-prompts";
import { CredentialStorage } from "../types";
import { log } from "../utils/logger";

export async function runReset(): Promise<void> {
  try {
    console.log(
      boxen(chalk.red("⚠️ RESET: This will delete mcp.json and all stored credentials"), {
        padding: 1,
        borderColor: "red"
      })
    );

    const sure = await askConfirm("Are you absolutely sure? This cannot be undone.");
    if (!sure) {
      log.info("Aborted. Nothing was changed.");
      process.exit(0);
    }

    const deleteCreds = await askConfirm("Also remove credentials from keychain/.env?");
    const detected = await detectVsCodePath();

    if (await fs.pathExists(detected.mcpJsonPath)) {
      await fs.remove(detected.mcpJsonPath);
    }

    if (deleteCreds && (await fs.pathExists(MCP_KIT_META_PATH))) {
      const meta = await fs.readJSON(MCP_KIT_META_PATH);
      const storage = (meta.credentialStorage || "keychain") as CredentialStorage;
      for (const id of meta.installedMcps || []) {
        const mcp = getMcpById(id);
        if (!mcp) {
          continue;
        }
        for (const envVar of mcp.envVars) {
          await deleteCredential(envVar.key, storage);
        }
      }
    }

    if (await fs.pathExists(MCP_KIT_META_PATH)) {
      await fs.remove(MCP_KIT_META_PATH);
    }

    log.success("Reset complete. Run `mcp-kit init --dev` to start fresh.");
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error(`Reset failed: ${message}`);
    log.muted("Suggestion: check file permissions and retry.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
