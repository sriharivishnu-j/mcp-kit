import { detectVsCodePath } from "../core/detector";
import { getLatestVersion, getMcpById } from "../core/registry";
import { readMcpJson, writeMcpJson } from "../core/writer";
import { askConfirm } from "../prompts/shared-prompts";
import { log, printTable } from "../utils/logger";
import { startSpinner, succeedSpinner, failSpinner } from "../utils/spinner";

function parseVersionFromArgs(args: string[], npmPackage: string): string {
  const joined = args.join(" ");
  const match = joined.match(new RegExp(`${npmPackage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}@([^\s]+)`));
  return match?.[1] || "latest";
}

export async function runUpdate(): Promise<void> {
  try {
    const detected = await detectVsCodePath();
    const config = await readMcpJson(detected.mcpJsonPath);

    const outdated: string[] = [];
    const rows: string[][] = [];

    for (const [id, server] of Object.entries(config.servers)) {
      const mcp = getMcpById(id);
      if (!mcp) {
        rows.push([id, "unknown", "unknown", "⚠ Not in registry"]);
        continue;
      }

      const current = parseVersionFromArgs(server.args, mcp.npmPackage);
      const latest = await getLatestVersion(mcp.npmPackage);
      const needsUpdate = current !== "latest" && latest !== "unknown" && current !== latest;

      rows.push([mcp.name, current, latest, needsUpdate ? "⬆ Update available" : "✅ Up to date"]);
      if (needsUpdate) {
        outdated.push(id);
      }
    }

    printTable(["MCP", "Current", "Latest", "Action"], rows);

    if (outdated.length === 0) {
      log.success("All configured MCPs are up to date.");
      process.exit(0);
    }

    const confirm = await askConfirm("Update all outdated MCPs?");
    if (!confirm) {
      log.info("No updates were applied.");
      process.exit(0);
    }

    let updated = 0;
    for (const id of outdated) {
      const mcp = getMcpById(id);
      if (!mcp) {
        continue;
      }

      const spinner = startSpinner(`Updating ${mcp.name}`);
      try {
        config.servers[id].args = mcp.args.map((arg) => {
          if (arg.includes(mcp.npmPackage)) {
            return `${mcp.npmPackage}@latest`;
          }
          return arg;
        });
        succeedSpinner(spinner, `Updated ${mcp.name}`);
        updated += 1;
      } catch (err) {
        failSpinner(spinner, `Failed ${mcp.name}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    await writeMcpJson(detected.mcpJsonPath, config);
    log.success(`Updated ${updated} MCPs. Reload VS Code to apply.`);
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error(`Update failed: ${message}`);
    log.muted("Suggestion: run `mcp-kit status` to inspect versions manually.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
