import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { appendText, ensureDir, safeWriteJSON } from '../utils/fs.js';
import { log } from '../utils/logger.js';
import { startSpinner, succeedSpinner, failSpinner } from '../utils/spinner.js';
import { isNodeVersionCompatible } from '../core/detector.js';
import { MCP_REGISTRY, MCP_KIT_META_PATH, MCP_KIT_DIR, MCP_KIT_INSTALL_LOG } from '../constants.js';

const _require = createRequire(import.meta.url);
const pkg = _require('../../package.json') as { version: string };

//
// mcp-kit install
//

export async function runInstall(): Promise<void> {
  try {
    log.header('mcp-kit - Pre-install MCP Packages');

    // Node version check
    if (!isNodeVersionCompatible()) {
      log.error(`Node.js >= 18.0.0 is required. Current: ${process.version}`);
      log.step('Download the latest Node.js from: https://nodejs.org');
      process.exit(1);
    }

    await ensureDir(MCP_KIT_DIR);

    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const mcp of MCP_REGISTRY) {
      // SonarQube uses a JAR file, not an npm package - skip global install
      if (mcp.command === 'java') {
        log.muted(`  Skipping ${mcp.name} (JAR-based, not an npm package)`);
        succeeded.push(mcp.name);
        continue;
      }

      // Python-based servers (e.g. AWS MCP) run via uv - skip npm install
      if (mcp.command === 'uvx') {
        log.muted(`  Skipping ${mcp.name} (Python/uvx-based - install uv via: brew install uv)`);
        succeeded.push(mcp.name);
        continue;
      }

      const spinner = startSpinner(`Installing ${mcp.name} (${mcp.npmPackage})...`);
      try {
        execSync(`npm install -g ${mcp.npmPackage}`, { stdio: 'ignore' });
        succeedSpinner(spinner, `Installed ${mcp.name}`);
        succeeded.push(mcp.name);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failSpinner(spinner, `Failed: ${mcp.name}`);
        failed.push(mcp.name);
        await appendText(
          MCP_KIT_INSTALL_LOG,
          `[${new Date().toISOString()}] ${mcp.name} (${mcp.npmPackage}): ${message}\n`
        );
      }
    }

    // Write meta.json
    const meta = {
      installedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      mcpKitVersion: pkg.version,
    };

    await safeWriteJSON(MCP_KIT_META_PATH, meta);

    log.blank();
    log.success(`Packages installed: ${succeeded.length}`);

    if (failed.length > 0) {
      log.warn(`Failed packages (${failed.length}): ${failed.join(', ')}`);
      log.muted(`See install log: ${MCP_KIT_INSTALL_LOG}`);
    }

    log.blank();
    log.info('Next step - configure your MCP servers:');
    log.code('mcp-kit init --dev      # for developers');
    log.code('mcp-kit init --non-dev  # for non-developers');

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Install failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}