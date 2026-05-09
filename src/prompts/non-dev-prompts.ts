import inquirer from 'inquirer';
import chalk from 'chalk';

import type {
  McpDefinition,
  CredentialStorage,
} from '../types.js';

import {
  checkAndReportEnvVar,
  printEnvProfileInstructions,
} from '../core/credentials.js';

//
// Non-developer interactive prompts
//

/**
 * Collect all env var answers for the given set of MCPs in non-developer mode.
 *
 * Uses simpler, friendlier labels and reminds non-technical users
 * to ask their IT/DevOps team for values they don't know.
 *
 * Returns:
 *   Map<mcpId, Record<envKey, value>>
 */

export async function collectNonDevAnswers(
  mcps: McpDefinition[],
  storage: CredentialStorage
): Promise<
  Map<string, Record<string, string>>
> {
  console.log('');

  console.log(
    chalk.yellow(
      'ℹ Ask your IT/DevOps team for these values if you are unsure.\n' +
        'They will know what to provide for each field.\n'
    )
  );

  const results = new Map<
    string,
    Record<string, string>
  >();

  for (const mcp of mcps) {
    //
    // Skip dev-only MCPs in non-dev mode
    //
    if (mcp.devOnly) continue;

    console.log('');
    console.log(
      chalk.bold.cyan(
        `🔧 Setting up: ${mcp.name}`
      )
    );

    console.log(chalk.gray(mcp.description));

    //
    // No configuration needed
    //
    if (mcp.envVars.length === 0) {
      console.log(
        chalk.green(
          '✓ No configuration needed'
        )
      );

      results.set(mcp.id, {});
      continue;
    }

    //
    // env-profile mode
    //
    if (storage === 'env-profile') {
      const record: Record<
        string,
        string
      > = {};

      let allSet = true;

      for (const envVar of mcp.envVars.filter(
        (ev) => !ev.devOnly
      )) {
        const alreadySet =
          checkAndReportEnvVar(
            envVar.key,
            envVar.secret
          );

        if (!alreadySet) {
          allSet = false;

          if (envVar.required) {
            printEnvProfileInstructions(
              envVar.key
            );
          }
        }

        record[envVar.key] =
          process.env[envVar.key] ?? '';
      }

      if (!allSet) {
        console.log(
          chalk.yellow(
            '\n⚠ Ask your IT/DevOps team to set the missing variables above, then re-run.\n'
          )
        );
      }

      results.set(mcp.id, record);
      continue;
    }

    //
    // Interactive mode
    //
    const questions = mcp.envVars
      .filter((ev) => !ev.devOnly)
      .map((envVar) => {
        if (envVar.hint) {
          console.log(
            chalk.gray(`  ${envVar.hint}`)
          );
        }

        const label = `${envVar.label} (ask your IT admin if unsure)`;

        return {
          type: envVar.secret
            ? 'password'
            : 'input',

          name: envVar.key,

          message: `${label}${
            envVar.required
              ? ' *'
              : ' (optional)'
          }`,

          default:
            envVar.defaultValue ?? '',

          validate: (
            input: string
          ): boolean | string => {
            if (
              !envVar.required &&
              input.trim().length === 0
            ) {
              return true;
            }

            if (
              envVar.required &&
              input.trim().length === 0
            ) {
              return 'This field is required';
            }

            return true;
          },
        };
      });

    const answers =
      await inquirer.prompt<
        Record<string, string>
      >(questions);

    results.set(mcp.id, answers);
  }

  return results;
}

//
// Type augmentation (optional dev flag support)
//

declare module '../types.js' {
  interface McpEnvVar {
    devOnly?: boolean;
  }
}