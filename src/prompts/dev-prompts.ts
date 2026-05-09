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

/**
 * Collect all env var answers for the given set of MCPs in developer mode.
 *
 * Returns:
 *   Map<mcpId, Record<envKey, value>>
 *
 * MCPs with no env vars are still included with an empty record.
 */
export async function collectDevAnswers(
  mcps: McpDefinition[],
  storage: CredentialStorage
): Promise<
  Map<string, Record<string, string>>
> {
  const results = new Map<
    string,
    Record<string, string>
  >();

  for (const mcp of mcps) {
    console.log('');
    console.log(
      chalk.bold.cyan(
        `🔧 Setting up: ${mcp.name}`
      )
    );

    console.log(chalk.gray(mcp.description));

    console.log(
      chalk.gray(`Docs: ${mcp.docsUrl}`)
    );

    //
    // No env vars
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

      for (const envVar of mcp.envVars) {
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

        // store runtime env value or empty string
        record[envVar.key] =
          process.env[envVar.key] ?? '';
      }

      if (!allSet) {
        console.log(
          chalk.yellow(
            '\n⚠ Set missing environment variables and re-run mcp-kit init\n'
          )
        );
      }

      results.set(mcp.id, record);
      continue;
    }

    //
    // interactive mode
    //
    const questions =
      mcp.envVars.map((envVar) => {
        if (envVar.hint) {
          console.log(
            chalk.gray(`  ${envVar.hint}`)
          );
        }

        return {
          type: envVar.secret
            ? 'password'
            : 'input',

          name: envVar.key,

          message: `${envVar.label}${
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

            if (envVar.validationRegex) {
              try {
                const regex = new RegExp(
                  envVar.validationRegex
                );

                if (!regex.test(input)) {
                  return 'Value does not match expected format';
                }
              } catch {
                // ignore invalid regex
              }
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