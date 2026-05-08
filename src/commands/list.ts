import { MCP_REGISTRY } from "../constants";
import { detectVsCodePath } from "../core/detector";
import { getMcpsForProfile } from "../core/registry";
import { readMcpJson } from "../core/writer";
import { log, printTable } from "../utils/logger";

export async function runList(options: { available?: boolean; dev?: boolean; nonDev?: boolean }): Promise<void> {
  try {
    const detected = await detectVsCodePath();
    const config = await readMcpJson(detected.mcpJsonPath);
    const configured = new Set(Object.keys(config.servers));

    if (!options.available) {
      const rows = Object.keys(config.servers).map((id) => {
        const mcp = MCP_REGISTRY.find((item) => item.id === id);
        return [
          id,
          mcp?.name || id,
          mcp?.category || "unknown",
          mcp?.npmPackage || "unknown",
          config.servers[id].command
        ];
      });
      printTable(["ID", "Name", "Category", "Package", "Command"], rows);
      process.exit(0);
    }

    let source = MCP_REGISTRY;
    if (options.dev && !options.nonDev) {
      source = getMcpsForProfile("dev");
    }
    if (options.nonDev && !options.dev) {
      source = getMcpsForProfile("non-dev");
    }

    const rows = source.map((mcp) => [
      `${configured.has(mcp.id) ? "✅ " : ""}${mcp.id}`,
      mcp.name,
      mcp.category,
      mcp.devOnly ? "dev" : mcp.nonDevOnly ? "non-dev" : "all",
      mcp.description
    ]);

    printTable(["ID", "Name", "Category", "For", "Description"], rows);
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error(`List failed: ${message}`);
    log.muted("Suggestion: run `mcp-kit init --dev` to bootstrap config.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
