import fs from "fs-extra";
import { MCP_KIT_META_PATH } from "../constants";
import { getCredential } from "../core/credentials";
import { detectVsCodePath } from "../core/detector";
import { getMcpById } from "../core/registry";
import { readMcpJson } from "../core/writer";
import { checkNetworkReachability, checkNpmPackageExists } from "../core/validator";
import { CredentialStorage, DoctorResult } from "../types";
import { log } from "../utils/logger";

export async function runDoctor(): Promise<void> {
  try {
    log.header("🩺 Running diagnostics...");
    const detected = await detectVsCodePath();

    if (!(await fs.pathExists(detected.vscodeFolderPath))) {
      log.warn("No .vscode folder found");
    }

    let config;
    try {
      config = await readMcpJson(detected.mcpJsonPath);
    } catch {
      log.error("mcp.json is missing or malformed");
      process.exit(1);
      return;
    }

    if (Object.keys(config.servers).length === 0) {
      log.error("mcp.json is missing or malformed");
      process.exit(1);
    }

    const meta = (await fs.pathExists(MCP_KIT_META_PATH)) ? await fs.readJSON(MCP_KIT_META_PATH) : {};
    const storage = (meta.credentialStorage || "keychain") as CredentialStorage;

    const results = await Promise.all(
      Object.keys(config.servers).map(async (id): Promise<DoctorResult> => {
        const mcp = getMcpById(id);
        const issues: string[] = [];
        const suggestions: string[] = [];
        let credentialsPresent = true;
        let packageInstallable = true;
        let networkReachable: boolean | undefined;

        if (!mcp) {
          issues.push("MCP not found in registry");
          suggestions.push("Run `mcp-kit list --available` and re-add this MCP");
          return {
            mcpId: id,
            mcpName: id,
            configured: true,
            credentialsPresent: false,
            packageInstallable: false,
            issues,
            suggestions,
            status: "error"
          };
        }

        for (const envVar of mcp.envVars.filter((envItem) => envItem.secret)) {
          const value = await getCredential(envVar.key, storage);
          if (!value) {
            credentialsPresent = false;
            issues.push(`Missing credential: ${envVar.label}`);
            suggestions.push(`Run \`mcp-kit add ${id}\` to reconfigure`);
          }
        }

        if (mcp.requiresNetwork && mcp.healthCheckUrl) {
          networkReachable = await checkNetworkReachability(mcp.healthCheckUrl);
          if (!networkReachable) {
            issues.push(`Cannot reach ${mcp.healthCheckUrl}`);
            suggestions.push("Check your VPN / firewall settings");
          }
        }

        packageInstallable = await checkNpmPackageExists(mcp.npmPackage);
        if (!packageInstallable) {
          issues.push(`Package ${mcp.npmPackage} not found on npm registry`);
          suggestions.push("Check npm registry or use offline cache");
        }

        try {
          await fs.access(detected.mcpJsonPath, fs.constants.W_OK);
        } catch {
          issues.push("mcp.json is not writable");
          suggestions.push(`Check file permissions: chmod 644 ${detected.mcpJsonPath}`);
        }

        const configured = config.servers[id];
        if (configured.command !== mcp.command || !configured.args.some((arg) => arg.includes(mcp.npmPackage))) {
          issues.push("Args may be stale — run `mcp-kit update`");
          suggestions.push("Run `mcp-kit update` to refresh command arguments");
        }

        const status: DoctorResult["status"] = issues.length === 0
          ? "healthy"
          : issues.some((issue) => issue.startsWith("Missing credential") || issue.includes("not writable") || issue.includes("not found"))
            ? "error"
            : "warning";

        return {
          mcpId: id,
          mcpName: mcp.name,
          configured: true,
          credentialsPresent,
          networkReachable,
          packageInstallable,
          issues,
          suggestions,
          status
        };
      })
    );

    let healthy = 0;
    let warnings = 0;
    let errors = 0;

    for (const result of results) {
      if (result.status === "healthy") {
        healthy += 1;
        console.log(`✅ ${result.mcpName} — Healthy`);
      } else if (result.status === "warning") {
        warnings += 1;
        console.log(`⚠️ ${result.mcpName} — Warning: ${result.issues[0]}`);
      } else {
        errors += 1;
        console.log(`❌ ${result.mcpName} — Error: ${result.issues[0]}`);
      }

      if (result.suggestions[0]) {
        console.log(`Fix: ${result.suggestions[0]}`);
      }
    }

    console.log("\nSummary:");
    console.log(`Healthy: ${healthy}`);
    console.log(`Warnings: ${warnings}`);
    console.log(`Errors: ${errors}`);

    if (errors > 0) {
      log.info("Run `mcp-kit add <id>` to fix individual MCPs");
      log.info("Run `mcp-kit reset` to start fresh");
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error(`Doctor failed: ${message}`);
    log.muted("Suggestion: validate your network and local file permissions.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
