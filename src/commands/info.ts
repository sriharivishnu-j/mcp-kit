import chalk from "chalk";
import boxen from "boxen";
import { detectVsCodePath } from "../core/detector";
import { getMcpById } from "../core/registry";
import { readMcpJson } from "../core/writer";
import { MCP_REGISTRY } from "../constants";
import { log, printTable } from "../utils/logger";

interface InfoOptions {
  json?: boolean;
}

export async function runInfo(mcpId: string, options: InfoOptions = {}): Promise<void> {
  try {
    const def = getMcpById(mcpId);
    if (!def) {
      log.error(`Unknown MCP: '${mcpId}'`);
      log.blank();
      log.info("Available IDs:");
      MCP_REGISTRY.forEach((m) => log.muted(`  ${m.id.padEnd(16)} ${m.name}`));
      process.exit(1);
    }

    let isConfigured = false;
    let entry: unknown;
    try {
      const vscodePaths = await detectVsCodePath();
      const config = await readMcpJson(vscodePaths.mcpJsonPath);
      isConfigured = mcpId in config.servers;
      entry = config.servers[mcpId];
    } catch {
      // not configured yet
    }

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            ...def,
            configured: isConfigured,
            entry: entry ?? null
          },
          null,
          2
        )
      );
      return;
    }

    console.log(
      boxen(`${chalk.bold.cyan(def.name)}\n${chalk.gray(def.description)}`, {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        margin: 0,
        borderColor: "cyan",
        borderStyle: "round"
      })
    );

    log.blank();
    printTable(
      ["Property", "Value"],
      [
        ["ID", def.id],
        ["Category", def.category],
        ["Npm Package", def.npmPackage],
        ["Command", def.command],
        ["Args", def.args.join(" ")],
        ["Dev only", def.devOnly ? chalk.yellow("yes") : "no"],
        ["Non-dev only", def.nonDevOnly ? chalk.yellow("yes") : "no"],
        ["Configured", isConfigured ? chalk.green("✔ yes") : chalk.gray("no")],
        ["Docs", chalk.underline.blue(def.docsUrl)]
      ]
    );

    if (def.envVars.length > 0) {
      log.blank();
      log.step("Required environment variables:");
      log.blank();
      printTable(
        ["Key", "Label", "Required", "Secret", "Hint"],
        def.envVars.map((ev) => [
          chalk.cyan(ev.key),
          ev.label,
          ev.required ? chalk.red("yes") : "no",
          ev.secret ? chalk.yellow("yes") : "no",
          ev.hint ?? ""
        ])
      );
    } else {
      log.blank();
      log.success("No environment variables required.");
    }

    if (isConfigured && entry) {
      log.blank();
      log.step("Current mcp.json entry:");
      console.log(chalk.gray(JSON.stringify(entry, null, 2)));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`info failed: ${message}`);
    if (process.env.DEBUG) {
      console.error(err);
    }
    process.exit(1);
  }
}
