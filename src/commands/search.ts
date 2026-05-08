import { MCP_REGISTRY } from "../constants";
import { log, printTable } from "../utils/logger";

interface SearchOptions {
  json?: boolean;
}

export async function runSearch(query: string, options: SearchOptions = {}): Promise<void> {
  try {
    const term = query.trim().toLowerCase();
    if (!term) {
      log.error("Please provide a search query.");
      process.exit(1);
    }

    const results = MCP_REGISTRY.filter((mcp) =>
      [mcp.id, mcp.name, mcp.description, mcp.category, mcp.npmPackage].join(" ").toLowerCase().includes(term)
    );

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    if (results.length === 0) {
      log.warn(`No MCPs matched "${query}"`);
      process.exit(0);
    }

    printTable(
      ["ID", "Name", "Category", "Package", "Description"],
      results.map((mcp) => [mcp.id, mcp.name, mcp.category, mcp.npmPackage, mcp.description])
    );

    process.exit(0);
  } catch (err) {
    log.error(`search failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
