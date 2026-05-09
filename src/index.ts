#!/usr/bin/env node
import { createRequire } from 'node:module';
import { Command } from 'commander';
import chalk from 'chalk';

import { log } from './utils/logger.js';

import { runInstall } from './commands/install.js';
import { runInit } from './commands/init.js';
import { runStatus } from './commands/status.js';
import { runAdd } from './commands/add.js';
import { runRemove } from './commands/remove.js';
import { runUpdate } from './commands/update.js';
import { runDoctor } from './commands/doctor.js';
import { runList } from './commands/list.js';
import { runReset } from './commands/reset.js';
import { runExport } from './commands/export.js';
import { runImport } from './commands/import.js';
import { runEnvCheck } from './commands/env-check.js';
import { runValidate } from './commands/validate.js';
import { runEnable, runDisable } from './commands/toggle.js';
import { runInfo } from './commands/info.js';
import { runOpen } from './commands/open.js';
import { runBackup } from './commands/backup.js';
import { runSearch } from './commands/search.js';
import { runCompletion } from './commands/completion.js';

//
// Bootstrap
//

const require = createRequire(import.meta.url);

const pkg = require('../package.json') as {
  name: string;
  version: string;
  description: string;
};

//
// Check for updates in the background (non-blocking)
//

try {
  const { default: updateNotifier } = await import('update-notifier');

  updateNotifier({ pkg }).notify();
} catch {
  // update-notifier is optional - ignore failures in CI / offline
}

//
// Global signal handlers
//

process.on('SIGINT', () => {
  console.log(
    '\n' +
      chalk.yellow('Interrupted. No changes were saved.')
  );

  process.exit(0);
});

process.on('uncaughtException', (err: Error) => {
  log.error(`Unexpected error: ${err.message}`);

  log.muted(
    'Run with DEBUG=1 for the full stack trace.'
  );

  if (process.env.DEBUG) {
    console.error(err.stack);
  }

  process.exit(1);
});

process.on(
  'unhandledRejection',
  (reason: unknown) => {
    const message =
      reason instanceof Error
        ? reason.message
        : String(reason);

    log.error(
      `Unhandled promise rejection: ${message}`
    );

    if (process.env.DEBUG) {
      console.error(reason);
    }

    process.exit(1);
  }
);

//
// CLI program
//

const program = new Command();

program
  .name('mcp-kit')
  .description(pkg.description)
  .version(pkg.version);

//
// install
//

program
  .command('install')
  .description(
    'Pre-download all package/tool cache'
  )
  .action(runInstall);

//
// init
//

program
  .command('init')
  .description(
    'Interactive wizard to configure MCP servers for Code'
  )
  .option(
    '--dev',
    'Configure the full developer MCP set'
  )
  .option(
    '--non-dev',
    'Configure the non-developer MCP set'
  )
  .option(
    '--dry-run',
    'Preview what would be written without making changes'
  )
  .action((opts) =>
    runInit({
      dev: opts.dev,
      nonDev: opts.nonDev,
      dryRun: opts.dryRun,
    })
  );

//
// status
//

program
  .command('status')
  .description(
    'Show all configured MCPs, versions and credential storage'
  )
  .option('--json', 'Output as JSON')
  .action((opts) =>
    runStatus({ json: opts.json })
  );

//
// add
//

program
  .command('add <mcp-id>')
  .description(
    'Add a single MCP to your configuration interactively'
  )
  .action(runAdd);

//
// remove
//

program
  .command('remove <mcp-id>')
  .description(
    'Remove an MCP from your configuration'
  )
  .action(runRemove);

//
// update
//

program
  .command('update')
  .description(
    'Check for newer versions of all configured MCPs and update'
  )
  .action(runUpdate);

//
// doctor
//

program
  .command('doctor')
  .description(
    'Diagnose configuration issues across all configured MCPs'
  )
  .option('--json', 'Output results as JSON')
  .action((opts) =>
    runDoctor({ json: opts.json })
  );

//
// list
//

program
  .command('list')
  .description(
    'List configured MCPs (or use --available to see the full registry)'
  )
  .option(
    '--available',
    'Show all MCPs available in the registry'
  )
  .option(
    '--dev',
    'Filter to developer MCPs only'
  )
  .option(
    '--non-dev',
    'Filter to non-developer MCPs only'
  )
  .action(runList);

//
// reset
//

program
  .command('reset')
  .description(
    'Remove all MCP configuration and optionally purge credentials'
  )
  .action(runReset);

//
// export
//

program
  .command('export')
  .description(
    'Export current config as a shareable JSON file for teammates'
  )
  .option(
    '--output <file>',
    'Output file path',
    'mcp-kit-export.json'
  )
  .option(
    '--no-redact',
    'Include real credential values (default: redacted)'
  )
  .action(runExport);

//
// import
//

program
  .command('import <file>')
  .description(
    'Import an MCP config exported by mcp-kit export'
  )
  .action(runImport);

//
// validate
//

program
  .command('validate')
  .description(
    'Validate mcp.json against the expected schema'
  )
  .option('--json', 'Output results as JSON')
  .action((opts) =>
    runValidate({ json: opts.json })
  );

//
// env
//

const envCmd = program
  .command('env')
  .description(
    'Environment variable utilities'
  );

envCmd
  .command('check')
  .description(
    'Scan configured MCPs for missing required environment variables'
  )
  .option('--json', 'Output as JSON')
  .action((opts) =>
    runEnvCheck({ json: opts.json })
  );

//
// enable
//

program
  .command('enable <mcp-id>')
  .description(
    'Re-enable a previously disabled MCP server'
  )
  .action(runEnable);

//
// disable
//

program
  .command('disable <mcp-id>')
  .description(
    'Disable an MCP without removing it from mcp.json'
  )
  .action(runDisable);

//
// info
//

program
  .command('info <mcp-id>')
  .description(
    'Show detailed information about an MCP from the registry'
  )
  .option('--json', 'Output as JSON')
  .action((mcpId, opts) =>
    runInfo(mcpId, {
      json: opts.json,
    })
  );

//
// open
//

program
  .command('open')
  .description('Open mcp.json in VS Code')
  .action(runOpen);

//
// backup
//

program
  .command('backup')
  .description(
    'Create a timestamped backup of mcp.json'
  )
  .option(
    '--output <file>',
    'Custom output path for the backup file'
  )
  .action((opts) =>
    runBackup({
      output: opts.output,
    })
  );

//
// search
//

program
  .command('search <query>')
  .description(
    'Search for MCPs in the registry by name, category or keyword'
  )
  .option('--json', 'Output as JSON')
  .action((query, opts) =>
    runSearch(query, {
      json: opts.json,
    })
  );

//
// completion
//

program
  .command('completion [shell]')
  .description(
    'Print shell completion script (zsh or bash)'
  )
  .addHelpText(
    'after',
    `
Usage:

  eval "$(mcp-kit completion zsh)"   # add to ~/.zshrc
  eval "$(mcp-kit completion bash)"  # add to ~/.bashrc
`
  )
  .action((shell) =>
    runCompletion(shell ?? 'zsh')
  );

//
// Parse
//

program.parse(process.argv);