import fs from "fs-extra";
import { MCP_KIT_META_PATH } from "../constants";
import { deleteCredential } from "../core/credentials";
import { detectVsCodePath } from "../core/detector";
import { getMcpById } from "../core/registry";
import { readMcpJson, removeServerFromMcpJson } from "../core/writer";
import { askConfirm } from "../prompts/shared-prompts";
import { CredentialStorage } from "../types";
import { log } from "../utils/logger";

export async function runRemove(mcpId: string): Promise<void> {
  try {
    const mcp = getMcpById(mcpId);
    const detected = await detectVsCodePath();
    const config = await readMcpJson(detected.mcpJsonPath);

    if (!config.servers[mcpId]) {
      log.error(`MCP ${mcpId} is not configured`);
      process.exit(1);
    }

    const confirmed = await askConfirm(`Remove ${mcp?.name || mcpId} from mcp.json?`);
    if (!confirmed) {
      log.info("Aborted");
      process.exit(0);
    }

    await removeServerFromMcpJson(detected.mcpJsonPath, mcpId);

    const deleteStored = await askConfirm("Also delete stored credentials from keychain/.env?");
    if (deleteStored && mcp) {
      const meta = (await fs.pathExists(MCP_KIT_META_PATH)) ? await fs.readJSON(MCP_KIT_META_PATH) : null;
      const storage = (meta?.credentialStorage || "keychain") as CredentialStorage;
      for (const envVar of mcp.envVars) {
        await deleteCredential(envVar.key, storage);
      }
    }

    if (await fs.pathExists(MCP_KIT_META_PATH)) {
      const meta = await fs.readJSON(MCP_KIT_META_PATH);
      meta.lastUpdated = new Date().toISOString();
      meta.installedMcps = (meta.installedMcps || []).filter((id: string) => id !== mcpId);
      await fs.writeJSON(MCP_KIT_META_PATH, meta, { spaces: 2 });
    }

    log.success(`Removed ${mcp?.name || mcpId}`);
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error(`Remove failed: ${message}`);
    log.muted("Suggestion: verify mcp.json permissions and try again.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
