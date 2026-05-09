import fs from 'node:fs/promises';
import { detectVsCodePath } from '../core/detector.js';
import { readMcpJson } from '../core/writer.js';
import { getMcpById } from '../core/registry.js';
import { getCredential, getEnvFilePath } from '../core/credentials.js';
import { checkNetworkReachability, checkNpmPackageExists } from '../core/validator.js';
import { log } from '../utils/logger.js';
import { safeReadJSON } from '../utils/fs.js';
import { MCP_KIT_META_PATH } from '../constants.js';
import type { McpKitMeta, DoctorResult, CredentialStorage } from '../types.js';

//
// mcp-kit doctor
//

interface DoctorOptions {
  json?: boolean;
}

export async function runDoctor(options: DoctorOptions = {}): Promise<void> {
  try {
    if (!options.json) log.header('mcp-kit - Diagnostics');

    const vscodePaths = await detectVsCodePath();

    if (vscodePaths.source === 'created') {
      log.warn('No .vscode folder found - created a new one at: ' + vscodePaths.vscodeFolderPath);
    }

    let config;
    try {
      config = await readMcpJson(vscodePaths.mcpJsonPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error('mcp.json is missing or malformed: ' + message);
      log.step('Run "mcp-kit init dev" or "mcp-kit init non-dev" to create it.');
      process.exit(1);
    }

    const serverIds = Object.keys(config.servers);

    if (serverIds.length === 0) {
      log.warn('mcp.json exists but has no configured servers.');
      log.info('Run "mcp-kit init" to configure MCPs.');
      return;
    }

    const meta = await safeReadJSON<McpKitMeta>(MCP_KIT_META_PATH);
    const credStorage: CredentialStorage = meta?.credentialStorage ?? 'keychain';
    const envFilePath = getEnvFilePath(vscodePaths.vscodeFolderPath);

    log.step(`Checking ${serverIds.length} configured MCP(s) in parallel...\n`);

    // Run all checks in parallel
    const doctorResults: DoctorResult[] = await Promise.all(
      serverIds.map(async (id): Promise<DoctorResult> => {
        const def = getMcpById(id);
        const entry = config.servers[id];
        const issues: string[] = [];
        const suggestions: string[] = [];

        // Check 1 - Credentials
        let credentialsPresent = true;
        if (def) {
          for (const envVar of def.envVars) {
            if (!envVar.secret) continue;
            // Check if it's embedded in args (inline)
            const inArgs = def.args.some(a => a.includes(`\${${envVar.key}}`));
            if (inArgs) continue;
            let found = false;
            if (credStorage === 'keychain' || credStorage === 'dotenv') {
              const val = await getCredential(envVar.key, credStorage, envFilePath);
              found = !!val;
            } else if (credStorage === 'inline') {
              const envVal = entry?.env?.[envVar.key];
              found = !!envVal && envVal !== '' && !envVal.startsWith('$(env:');
            }
            if (!found && envVar.required) {
              credentialsPresent = false;
              issues.push(`Missing credential: ${envVar.label} (${envVar.key})`);
              suggestions.push(`Run "mcp-kit add ${id}" to reconfigure credentials`);
            }
          }
        }

        // Check 2 - Network reachability
        let networkReachable: boolean | undefined;
        if (def?.requiresNetwork && def.healthCheckUrl) {
          networkReachable = await checkNetworkReachability(def.healthCheckUrl);
          if (!networkReachable) {
            issues.push(`Cannot reach ${def.healthCheckUrl}`);
            suggestions.push('Check your VPN / firewall settings and network connection');
          }
        }

        // Check 3 - npm package installable
        let packageInstallable = true;
        if (def?.npmPackage) {
          packageInstallable = await checkNpmPackageExists(def.npmPackage);
          if (!packageInstallable) {
            issues.push(`Package ${def.npmPackage} not found on npm registry`);
            suggestions.push('Check npm registry availability or use offline cache via "mcp-kit install"');
          }
        }

        // Check 4 - mcp.json writable
        try {
          await fs.access(vscodePaths.mcpJsonPath, fs.constants.W_OK);
        } catch {
          issues.push(`mcp.json is not writable: ${vscodePaths.mcpJsonPath}`);
          suggestions.push(`Fix file permissions: chmod 644 ${vscodePaths.mcpJsonPath}`);
        }

        // Check 5 - Args validity
        if (def && entry) {
          const firstPackageArg = entry.args.find(
            a => a.startsWith('@') || (a.includes('/') && !a.startsWith('-'))
          );
          if (firstPackageArg && !firstPackageArg.includes('@latest')) {
            issues.push('Command args may be stale or mismatched');
            suggestions.push('Run "mcp-kit update" to refresh to @latest');
          }
        }

        // Determine overall status
        const hasErrors = issues.some(
          i =>
            i.includes('Missing credential') ||
            i.includes('not found on npm') ||
            i.includes('not writable')
        );

        const status = issues.length === 0 ? 'healthy' : hasErrors ? 'error' : 'warning';

        return {
          mcpId: id,
          mcpName: def?.name ?? id,
          configured: !!entry,
          credentialsPresent,
          networkReachable,
          packageInstallable,
          issues,
          suggestions,
          status,
        };
      })
    );

    // Print results
    log.blank();
    let healthyCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    if (options.json) {
      console.log(JSON.stringify(doctorResults, null, 2));
      const hasErrors = doctorResults.some(r => r.status === 'error');
      if (hasErrors) process.exit(1);
      return;
    }

    for (const result of doctorResults) {
      if (result.status === 'healthy') {
        log.success(`${result.mcpName} - Healthy`);
        healthyCount++;
      } else if (result.status === 'warning') {
        log.warn(`${result.mcpName} - Warning`);
        result.issues.forEach(issue => log.muted(`  • ${issue}`));
        result.suggestions.forEach(sug => log.muted(`  → ${sug}`));
        warningCount++;
      } else {
        log.error(`${result.mcpName} - Error`);
        result.issues.forEach(issue => log.muted(`  • ${issue}`));
        result.suggestions.forEach(sug => log.muted(`  → ${sug}`));
        errorCount++;
      }
    }

    // Summary
    log.blank();
    log.info(
      `Summary - Healthy: ${healthyCount}  Warnings: ${warningCount}  Errors: ${errorCount}`
    );

    if (errorCount > 0 || warningCount > 0) {
      log.blank();
      log.step('Run "mcp-kit add <id>" to fix individual MCPs');
      log.step('Run "mcp-kit reset" to start fresh');
    }

    // Exit 1 if any errors
    if (errorCount > 0) {
      process.exit(1);
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Doctor check failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}