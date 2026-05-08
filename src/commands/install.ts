import fs from "fs-extra";
import path from "node:path";
import { execSync } from "node:child_process";
import { MCP_KIT_META_PATH, MCP_REGISTRY } from "../constants";
import { isNodeVersionCompatible } from "../core/detector";
import { startSpinner, succeedSpinner, failSpinner } from "../utils/spinner";
import { log } from "../utils/logger";

const packageJson = require("../../package.json") as { version: string };

export async function runInstall(): Promise<void> {
  try {
    log.header("📦 Pre-installing MCP packages...");

    if (!isNodeVersionCompatible()) {
      log.error("Node >= 18.0.0 is required.");
      log.muted("Please upgrade Node and re-run `mcp-kit install`.");
      process.exit(1);
    }

    const failed: Array<{ id: string; error: string }> = [];
    let succeeded = 0;

    for (const mcp of MCP_REGISTRY) {
      const spinner = startSpinner(`Installing ${mcp.name}`);
      try {
        execSync(`npm install -g ${mcp.npmPackage}`, { stdio: "ignore" });
        succeedSpinner(spinner, `Installed ${mcp.name}`);
        succeeded += 1;
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        failSpinner(spinner, `Failed: ${mcp.name} — ${error}`);
        failed.push({ id: mcp.id, error });
      }
    }

    await fs.mkdirp(path.dirname(MCP_KIT_META_PATH));
    const meta = {
      installedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      profileMode: "dev",
      vscodePath: "",
      credentialStorage: "keychain",
      installedMcps: MCP_REGISTRY.map((m) => m.id),
      mcpKitVersion: packageJson.version
    };
    await fs.writeJSON(MCP_KIT_META_PATH, meta, { spaces: 2 });

    if (failed.length > 0) {
      const errorLogPath = path.join(path.dirname(MCP_KIT_META_PATH), "install-errors.log");
      const lines = failed.map((entry) => `${new Date().toISOString()} ${entry.id}: ${entry.error}`).join("\n");
      await fs.appendFile(errorLogPath, `${lines}\n`, "utf8");
    }

    log.success(`Succeeded: ${succeeded} packages`);
    log.warn(`Failed: ${failed.length} packages${failed.length ? ` (${failed.map((f) => f.id).join(", ")})` : ""}`);
    log.info("Run `mcp-kit init --dev` or `mcp-kit init --non-dev` to configure.");
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error(`Install failed: ${message}`);
    log.muted("Try again with stable network access or verify npm permissions.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
