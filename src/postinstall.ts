#!/usr/bin/env node

/**
 * postinstall.ts
 *
 * Runs automatically after `npm install -g @global-packages/mcp-kit`.
 * Prints the MCP-KIT welcome banner with a quick-start command table.
 */

import chalk from "chalk";
import boxen from "boxen";
import { table } from "table";

const ASCII = `
███╗   ███╗ ██████╗██████╗       ██╗  ██╗██╗████████╗
████╗ ████║██╔════╝██╔══██╗      ██║ ██╔╝██║╚══██╔══╝
██╔████╔██║██║     ██████╔╝█████╗█████╔╝ ██║   ██║
██║╚██╔╝██║██║     ██╔═══╝ ╚════╝██╔═██╗ ██║   ██║
██║ ╚═╝ ██║╚██████╗██║           ██║  ██╗██║   ██║
╚═╝     ╚═╝ ╚═════╝╚═╝           ╚═╝  ╚═╝╚═╝   ╚═╝
`;

const COMMANDS: [string, string][] = [
  ["mcp-kit init --dev", "Interactive setup for development MCPs (filesystem, git, playwright...)"],
  ["mcp-kit init --non-dev", "Interactive setup for shared/team MCPs (azure, confluence, slack...)"],
  ["mcp-kit install", "Pre-download MCP packages (recommended in restricted networks)"],
  ["mcp-kit list", "Show configured MCPs and availability"],
  ["mcp-kit status", "Show MCP versions and config health summary"],
  ["mcp-kit add <id>", "Add one MCP server by ID (e.g. mcp-kit add azure)"],
  ["mcp-kit remove <id>", "Remove a configured MCP server"],
  ["mcp-kit update", "Refresh command args to latest package tags"],
  ["mcp-kit doctor", "Diagnose env/version/path/credential issues"],
  ["mcp-kit export", "Export current setup as shareable JSON"],
  ["mcp-kit import <file>", "Import shared setup (prompts for redacted secrets)"],
  ["mcp-kit reset", "Remove all configured MCPs and start fresh"]
];

function render(): void {
  if (process.env.CI || process.env.MCP_KIT_POSTINSTALL_SILENT === "1") {
    console.log("✅ @global-packages/mcp-kit installed. Run: mcp-kit init --dev");
    return;
  }

  console.log(`\n${chalk.bold.magentaBright(ASCII)}`);

  const topLine = boxen(
    `${chalk.bold.whiteBright("Universal MCP Configuration CLI")}\n${chalk.gray(
      "Auto-detect | Configure | Manage MCP servers - Windows | macOS | Linux"
    )}`,
    {
      padding: { top: 0, bottom: 0, left: 2, right: 2 },
      margin: { top: 0, bottom: 1, left: 2, right: 0 },
      borderColor: "magenta",
      borderStyle: "round",
      textAlignment: "center"
    }
  );

  console.log(topLine);
  console.log(chalk.bold.yellowBright("  Quickstart commands\n"));

  const tableData = [
    [chalk.bold.cyanBright("Command"), chalk.bold.cyanBright("Description")],
    ...COMMANDS.map(([cmd, desc]) => [chalk.cyan(cmd), chalk.white(desc)])
  ];

  const output = table(tableData, {
    border: {
      topBody: chalk.gray("─"),
      topJoin: chalk.gray("┬"),
      topLeft: chalk.gray("┌"),
      topRight: chalk.gray("┐"),
      bottomBody: chalk.gray("─"),
      bottomJoin: chalk.gray("┴"),
      bottomLeft: chalk.gray("└"),
      bottomRight: chalk.gray("┘"),
      bodyLeft: chalk.gray("│"),
      bodyRight: chalk.gray("│"),
      bodyJoin: chalk.gray("│"),
      joinBody: chalk.gray("─"),
      joinLeft: chalk.gray("├"),
      joinRight: chalk.gray("┤"),
      joinJoin: chalk.gray("┼")
    },
    columns: {
      0: { width: 32, paddingLeft: 1, paddingRight: 1 },
      1: { width: 58, paddingLeft: 1, paddingRight: 1, wrapWord: true }
    },
    drawHorizontalLine: (lineIndex: number, rowCount: number): boolean =>
      lineIndex === 0 || lineIndex === 1 || lineIndex === rowCount
  });

  const indented = output
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  console.log(indented);

  console.log(
    boxen(
      `${chalk.bold.greenBright("✅ Get started:")} ${chalk.whiteBright("mcp-kit init --dev")}\n${chalk.gray(
        "or"
      )} ${chalk.whiteBright("mcp-kit install")}\n${chalk.underline.blue(
        "https://github.com/global-packages/mcp-kit"
      )}`,
      {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        margin: { top: 0, bottom: 1, left: 2, right: 0 },
        borderColor: "green",
        borderStyle: "double",
        textAlignment: "center"
      }
    )
  );
}

try {
  render();
} catch {
  // Never fail npm install because of postinstall formatting.
}
