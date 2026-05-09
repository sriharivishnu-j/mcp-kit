import inquirer from 'inquirer';

import type {
  CredentialStorage,
  McpDefinition,
} from '../types.js';

//
// Shared interactive prompts
//

/**
 * Ask the user how they want credentials stored.
 */

export async function askCredentialStorage(): Promise<CredentialStorage> {
  const { storage } = await inquirer.prompt<{
    storage: CredentialStorage;
  }>([
    {
      type: 'list',
      name: 'storage',
      message:
        'How should credentials be stored?',
      choices: [
        {
          name:
            'Environment variable (~/.zshrc / ~/.bash_profile / Windows System Env) - recommended',
          value: 'env-profile',
        },
        {
          name:
            'System keychain (Mac Keychain / Windows Credential Store)',
          value: 'keychain',
        },
        {
          name:
            'dotenv file in project root (auto-added to .gitignore)',
          value: 'dotenv',
        },
        {
          name:
            'Inline in mcp.json (not recommended for shared repos)',
          value: 'inline',
        },
      ],
    },
  ]);

  return storage;
}

/**
 * Ask the user to select which MCPs to configure.
 */

export async function askMcpSelection(
  mcps: McpDefinition[],
  alreadyInstalled: string[]
): Promise<string[]> {
  const ALL_VALUE = '__ALL__';

  const allIds = mcps.map((m) => m.id);

  const allPreChecked =
    allIds.every((id) =>
      alreadyInstalled.includes(id)
    );

  const { selected } = await inquirer.prompt<{
    selected: string[];
  }>([
    {
      type: 'checkbox',
      name: 'selected',
      message:
        'Select MCPs to configure (space to select, a to toggle all, enter to confirm):',

      choices: [
        {
          name: 'Select ALL →',
          value: ALL_VALUE,
          checked: allPreChecked,
        },

        new inquirer.Separator(),

        ...mcps.map((mcp) => ({
          name: `${mcp.name} - ${mcp.description}`,
          value: mcp.id,
          checked: alreadyInstalled.includes(
            mcp.id
          ),
        })),
      ],
    },
  ]);

  if (selected.includes(ALL_VALUE)) {
    return allIds;
  }

  return selected.filter(
    (v) => v !== ALL_VALUE
  );
}

/**
 * Ask a yes/no confirmation question.
 */

export async function askConfirm(
  message: string
): Promise<boolean> {
  const { confirmed } =
    await inquirer.prompt<{
      confirmed: boolean;
    }>([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: false,
      },
    ]);

  return confirmed;
}