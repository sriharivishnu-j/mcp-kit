import fs from "fs-extra";
import { MCP_KIT_META_PATH } from "../constants";
import { detectVsCodePath } from "../core/detector";
import { getLatestVersion, getMcpById } from "../core/registry";
import { readMcpJson } from "../core/writer";
import { CredentialStorage } from "../types";
import { log, printTable } from "../utils/logger";

interface StatusOptions {
  json?: boolean;
}

function extractCurrentVersion(args: string[]): string {
  const match = /@([\w.-]+)$/.exec(args.join(" "));
  return match?.[1] || "latest";
}

export async function runStatus(options: StatusOptions = {}): Promise<void> {
  try {
    const detected = await detectVsCodePath();
    const config = await readMcpJson(detected.mcpJsonPath);
    const meta = (await fs.pathExists(MCP_KIT_META_PATH))
      ? await fs.readJSON(MCP_KIT_META_PATH)
      : { credentialStorage: "keychain", lastUpdated: "never" };

    const entries = Object.entries(config.servers);
    const latestVersions = await Promise.all(
      entries.map(async ([id]) => {
        const mcp = getMcpById(id);
        if (!mcp) {
          return "unknown";
        }
        return getLatestVersion(mcp.npmPackage);
      }),
    );

    const rows = entries.map(([id, server], index) => {
      const mcp = getMcpById(id);
      const current = extractCurrentVersion(server.args);
      const latest = latestVersions[index];
      const upToDate = current === "latest" || current === latest;
      return [
        mcp?.name || id,
        mcp?.category || "unknown",
        mcp?.npmPackage || "unknown",
        current,
        latest,
        upToDate ? "Yes" : "No",
        (meta.credentialStorage as CredentialStorage) || "keychain",
      ];
    });

    if (options.json) {
      const output = entries.map(([id, server], index) => {
        const mcp = getMcpById(id);
        return {
          id,
          name: mcp?.name ?? id,
          category: mcp?.category ?? "unknown",
          package: mcp?.npmPackage ?? "unknown",
          command: server.command,
          args: server.args,
          version: extractCurrentVersion(server.args),
          latest: latestVersions[index],
          disabled: Boolean(server.disabled),
          credentialStorage:
            (meta.credentialStorage as CredentialStorage) || "keychain",
        };
      });
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    printTable(
      [
        "ID",
        "Name",
        "MCP Name",
        "Category",
        "Package",
        "Version",
        "Latest",
        "Up-to-date",
        "Credential Storage",
      ],
      rows,
    );

    log.info(`Config path: ${detected.mcpJsonPath}`);
    log.info(`Last updated: ${meta.lastUpdated || "unknown"}`);
    log.info("Run `mcp-kit doctor` to diagnose any issues");
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error(`Status failed: ${message}`);
    log.muted("Suggestion: ensure mcp.json is valid and readable.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
