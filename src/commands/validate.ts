import { detectVsCodePath } from "../core/detector";
import { validateMcpJson } from "../core/validator";
import { readJsonSafe } from "../utils/fs";
import { log, printTable } from "../utils/logger";
import chalk from "chalk";

interface ValidateOptions {
  json?: boolean;
}

export async function runValidate(options: ValidateOptions = {}): Promise<void> {
  try {
    const vscodePaths = await detectVsCodePath();

    const raw = await readJsonSafe<unknown | null>(vscodePaths.mcpJsonPath, null);
    if (raw === null) {
      if (options.json) {
        console.log(JSON.stringify({ valid: false, path: vscodePaths.mcpJsonPath, error: "File is empty or missing" }));
      } else {
        log.error("Cannot read mcp.json: file is empty or missing.");
        log.info("Run `mcp-kit init --dev` to create a valid config.");
      }
      process.exit(1);
    }

    let validated;
    let errors: string[] = [];
    try {
      validated = validateMcpJson(raw);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors = message.split("\n");
    }

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            valid: errors.length === 0,
            errors,
            path: vscodePaths.mcpJsonPath,
            serverCount: validated ? Object.keys(validated.servers).length : 0
          },
          null,
          2
        )
      );
      if (errors.length > 0) process.exit(1);
      return;
    }

    log.header("🔎 mcp.json validation");
    log.muted(`Path: ${vscodePaths.mcpJsonPath}`);
    log.blank();

    if (errors.length > 0) {
      log.error("mcp.json is INVALID:");
      for (const e of errors) log.error(`  ${e}`);
      log.blank();
      log.info("Run `mcp-kit init --dev` to regenerate a valid config.");
      process.exit(1);
    }

    const serverIds = Object.keys(validated!.servers);
    log.success(`mcp.json is valid — ${serverIds.length} server(s) configured.`);

    if (serverIds.length > 0) {
      const rows = serverIds.map((id) => {
        const entry = validated!.servers[id];
        const envCount = Object.keys(entry.env ?? {}).length;
        return [id, entry.command, entry.args.length.toString(), envCount.toString(), chalk.green("✔ valid")];
      });
      log.blank();
      printTable(["Server", "Command", "Args", "Env Vars", "Status"], rows);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`validate failed: ${message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}
