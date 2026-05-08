import chalk from "chalk";
import inquirer from "inquirer";
import { NON_DEV_MCP_IDS } from "../constants";
import { CredentialStorage, McpDefinition } from "../types";

export async function collectNonDevAnswers(
  mcps: McpDefinition[],
  _storage: CredentialStorage
): Promise<Map<string, Record<string, string>>> {
  console.log(chalk.yellow("ℹ Ask your IT/DevOps team for these values if unsure"));

  const allAnswers = new Map<string, Record<string, string>>();
  const allowed = new Set(NON_DEV_MCP_IDS);

  for (const mcp of mcps.filter((item) => allowed.has(item.id))) {
    console.log(chalk.bold.cyan(`\n⚙️ Setting up: ${mcp.name}`));
    console.log(chalk.gray(mcp.description));

    if (mcp.envVars.length === 0) {
      console.log(chalk.green("✅ No configuration needed"));
      allAnswers.set(mcp.id, {});
      continue;
    }

    const mcpAnswers: Record<string, string> = {};

    for (const envVar of mcp.envVars) {
      if (envVar.hint) {
        console.log(chalk.gray(` ℹ ${envVar.hint}`));
      }

      const response = await inquirer.prompt<{ value: string }>([
        {
          type: envVar.secret ? "password" : "input",
          name: "value",
          message: `${envVar.label} (ask your IT admin)` + (envVar.required ? " *" : " (optional)"),
          default: envVar.defaultValue || "",
          mask: envVar.secret ? "*" : undefined,
          validate: (input: string) => !envVar.required || input.length > 0 || "This field is required"
        }
      ]);

      mcpAnswers[envVar.key] = response.value;
    }

    allAnswers.set(mcp.id, mcpAnswers);
  }

  return allAnswers;
}
