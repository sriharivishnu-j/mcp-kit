#!/usr/bin/env node

import chalk from "chalk";
import updateNotifier from "update-notifier";
import { Command } from "commander";
import { log } from "./utils/logger";
import { runInstall } from "./commands/install";
import { runInit } from "./commands/init";
import { runStatus } from "./commands/status";
import { runAdd } from "./commands/add";
import { runRemove } from "./commands/remove";
import { runUpdate } from "./commands/update";
import { runDoctor } from "./commands/doctor";
import { runList } from "./commands/list";
import { runReset } from "./commands/reset";
import { runExport } from "./commands/export";
import { runImport } from "./commands/import";
import { runValidate } from "./commands/validate";
import { runEnvCheck } from "./commands/env-check";
import { runInfo } from "./commands/info";
import { runOpen } from "./commands/open";
import { runSearch } from "./commands/search";
import { runEnable, runDisable } from "./commands/toggle";
import { runBackup } from "./commands/backup";
import { runCompletion } from "./commands/completion";

const packageJson = require("../package.json");

try {
  updateNotifier({ pkg: packageJson }).notify();
} catch {
  // update-notifier is optional; ignore failures in offline/CI.
}

const program = new Command();

program.name("mcp-kit").description("Universal MCP Configuration CLI").version(packageJson.version);

program
  .command("install")
  .description("Pre-download all MCP packages to local npm cache")
  .action(runInstall);

program
  .command("init")
  .description("Interactive wizard to configure MCP servers")
  .option("--dev", "Configure developer MCP set")
  .option("--non-dev", "Configure non-developer MCP set")
  .option("--dry-run", "Preview what would be written without making any changes")
  .action((opts) => runInit({ dev: opts.dev, nonDev: opts.nonDev }));

program
  .command("status")
  .description("Show all configured MCPs, versions and credential storage")
  .option("--json", "Output as JSON")
  .action((opts) => runStatus({ json: opts.json }));

program.command("add <mcp-id>").description("Add a single MCP to your configuration").action(runAdd);

program.command("remove <mcp-id>").description("Remove an MCP from your configuration").action(runRemove);

program.command("update").description("Update configured MCPs to latest versions").action(runUpdate);

program.command("doctor").description("Diagnose configuration issues across all MCPs").action(runDoctor);

program
  .command("list")
  .description("List configured or available MCPs")
  .option("--available", "Show all available MCPs in registry")
  .option("--dev", "Filter to developer MCPs")
  .option("--non-dev", "Filter to non-developer MCPs")
  .option("--json", "Output as JSON")
  .action((opts) => runList(opts));

program.command("reset").description("Remove all MCP configuration and credentials").action(runReset);

program
  .command("export")
  .description("Export current config as shareable JSON")
  .option("--output <file>", "Output file path", "mcp-kit-export.json")
  .option("--no-redact", "Include real credential values")
  .action((opts) => runExport({ output: opts.output, redact: opts.redact }));

program.command("import <file>").description("Import MCP config from exported JSON file").action(runImport);
program
  .command("validate")
  .description("Validate mcp.json against expected schema")
  .option("--json", "Output result as JSON")
  .action((opts) => runValidate({ json: opts.json }));

const envCmd = program.command("env").description("Environment variable utilities");
envCmd
  .command("check")
  .description("Scan configured MCPs for missing required environment variables")
  .option("--json", "Output as JSON")
  .action((opts) => runEnvCheck({ json: opts.json }));

program.command("env-check").description("Alias for env check").option("--json").action((opts) => runEnvCheck({ json: opts.json }));

program
  .command("enable <mcp-id>")
  .description("Re-enable a previously disabled MCP server")
  .action(runEnable);
program
  .command("disable <mcp-id>")
  .description("Disable an MCP without removing it from mcp.json")
  .action(runDisable);

program
  .command("info <mcp-id>")
  .description("Show detailed information about an MCP from the registry")
  .option("--json", "Output as JSON")
  .action((mcpId, opts) => runInfo(mcpId, { json: opts.json }));

program.command("open").description("Open detected mcp.json in default editor").action(runOpen);
program
  .command("backup")
  .description("Create a timestamped backup of mcp.json")
  .option("--output <file>", "Custom output path for the backup file")
  .action((opts) => runBackup({ output: opts.output }));
program
  .command("search <query>")
  .description("Search for MCPs in the registry by name, category or keyword")
  .option("--json", "Output as JSON")
  .action((query, opts) => runSearch(query, { json: opts.json }));

program
  .command("completion [shell]")
  .description("Print shell completion script (bash/zsh)")
  .addHelpText("after", "\nUsage:\n  eval \"$(mcp-kit completion zsh)\"")
  .action((shell) => runCompletion(shell ?? "zsh"));

process.on("uncaughtException", (err) => {
  log.error(`Unexpected error: ${err.message}`);
  log.muted("Run with DEBUG=1 for full stack trace");
  if (process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log(`\n${chalk.yellow("⚠️ Interrupted. No changes were saved.")}`);
  process.exit(0);
});

process.on("unhandledRejection", (reason: unknown) => {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : JSON.stringify(reason);
  log.error(`Unhandled promise rejection: ${message}`);
  if (process.env.DEBUG) {
    console.error(reason);
  }
  process.exit(1);
});

program.parse(process.argv);
