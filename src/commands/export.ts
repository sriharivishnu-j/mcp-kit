import fs from "fs-extra";
import { MCP_KIT_META_PATH } from "../constants";
import { detectVsCodePath } from "../core/detector";
import { readMcpJson } from "../core/writer";
import { log } from "../utils/logger";

export async function runExport(options: { output: string; redact: boolean }): Promise<void> {
  try {
    const detected = await detectVsCodePath();
    const config = await readMcpJson(detected.mcpJsonPath);
    const meta = (await fs.pathExists(MCP_KIT_META_PATH)) ? await fs.readJSON(MCP_KIT_META_PATH) : {};

    const servers = JSON.parse(JSON.stringify(config.servers)) as typeof config.servers;

    if (options.redact) {
      for (const server of Object.values(servers)) {
        if (server.env) {
          for (const key of Object.keys(server.env)) {
            if (!server.env[key].startsWith("${env:")) {
              server.env[key] = "REDACTED";
            }
          }
        }
      }
    }

    const exportObject = {
      exportedAt: new Date().toISOString(),
      mcpKitVersion: meta.mcpKitVersion || require("../../package.json").version,
      profileMode: meta.profileMode || "dev",
      servers,
      mcpIds: Object.keys(config.servers),
      instructions: "Run `mcp-kit import <this-file>` to apply"
    };

    await fs.writeJSON(options.output || "mcp-kit-export.json", exportObject, { spaces: 2 });

    log.success(`Exported to ${options.output || "mcp-kit-export.json"}`);
    log.info("Share this file with teammates who need the same MCP setup");

    if (!options.redact) {
      log.warn("⚠️ Contains real credentials — do not commit");
    }

    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error(`Export failed: ${message}`);
    log.muted("Suggestion: verify output path is writable.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
