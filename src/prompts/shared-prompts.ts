import inquirer from "inquirer";
import { CredentialStorage, McpDefinition } from "../types";

export async function askCredentialStorage(): Promise<CredentialStorage> {
  const answer = await inquirer.prompt<{ storage: CredentialStorage }>([
    {
      type: "list",
      name: "storage",
      message: "How should credentials be stored?",
      choices: [
        {
          name: "System keychain (recommended — Mac Keychain / Windows Credential Store)",
          value: "keychain"
        },
        {
          name: ".env file in project root (auto-added to .gitignore)",
          value: "dotenv"
        },
        {
          name: "Inline in mcp.json (not recommended for shared/committed repos)",
          value: "inline"
        }
      ]
    }
  ]);

  return answer.storage;
}

export async function askMcpSelection(mcps: McpDefinition[], alreadyInstalled: string[]): Promise<string[]> {
  const answer = await inquirer.prompt<{ selected: string[] }>([
    {
      type: "checkbox",
      name: "selected",
      message: "Select MCPs to configure (space to select, enter to confirm)",
      choices: mcps.map((mcp) => ({
        name: `${mcp.name} — ${mcp.description}`,
        value: mcp.id,
        checked: alreadyInstalled.includes(mcp.id)
      }))
    }
  ]);

  return answer.selected;
}

export async function askConfirm(message: string): Promise<boolean> {
  const answer = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: "confirm",
      name: "confirmed",
      message
    }
  ]);

  return answer.confirmed;
}
