#!/usr/bin/env node

/**
 * postinstall.ts
 *
 * Runs automatically after `npm install -g @global-packages/mcp-kit`.
 * Prints the MCP-KIT welcome banner with a quick-start command table.
 */

import chalk from "chalk";
import boxen from "boxen";
import { printBanner } from "./utils/banner.js";

function render(): void {
  if (process.env.CI || process.env.MCP_KIT_POSTINSTALL_SILENT === "1") {
    console.log("✅ @global-packages/mcp-kit installed. Run: mcp-kit init --dev");
    return;
  }

  printBanner();

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
