import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import semver from 'semver';
import { VSCODE_SEARCH_DEPTH } from '../constants.js';
import { fileExists } from '../utils/fs.js';
import type { SupportedOS, VsCodePaths } from '../types.js';

// OS + VS Code path detector

/**
 * Detect the current operating system.
 */
export function detectOS(): SupportedOS {
  switch (process.platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'mac';
    default:
      return 'linux';
  }
}

/**
 * Return the OS-specific VS Code global user config directory.
 */
export function getGlobalVsCodeConfigPath(currentOS: SupportedOS): string {
  switch (currentOS) {
    case 'windows': {
      const appData = process.env['APPDATA'];
      if (!appData) {
        throw new Error('APPDATA environment variable is not set');
      }
      return path.join(appData, 'Code', 'User');
    }
    case 'mac':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User');
    case 'linux':
    default:
      return path.join(os.homedir(), '.config', 'Code', 'User');
  }
}

/**
 * Detect the best .vscode folder to use, in priority order:
 * 1. Walk up from cwd looking for a .vscode folder (project-local),
 *    but SKIP ~/.vscode - that's VS Code's extension storage, not a project config.
 * 2. Check the OS-level VS Code user config directory (global):
 *    - mac:     ~/Library/Application Support/Code/User/mcp.json
 *    - windows: %APPDATA%\Code\User\mcp.json
 *    - linux:   ~/.config/Code/User/mcp.json
 * 3. Create a .vscode folder in cwd (fallback).
 */
export async function detectVsCodePath(): Promise<VsCodePaths> {
  const homeDir = os.homedir();

  // Step 1 - walk up from cwd, but skip the bare ~/.vscode directory.
  // ~/.vscode is where VS Code stores extensions; it is NOT a project config.
  let current = process.cwd();
  for (let depth = 0; depth < VSCODE_SEARCH_DEPTH; depth++) {
    const candidate = path.join(current, '.vscode');
    const isHomeDotVscode =
      path.resolve(candidate) === path.resolve(path.join(homeDir, '.vscode'));

    if (!isHomeDotVscode && (await fileExists(candidate))) {
      return {
        vscodeFolderPath: candidate,
        mcpJsonPath: path.join(candidate, 'mcp.json'),
        source: 'project',
      };
    }

    const parent = path.dirname(current);
    if (parent === current) break; // filesystem root
    current = parent;
  }

  // Step 2 - check OS global VS Code config path
  try {
    const globalPath = getGlobalVsCodeConfigPath(detectOS());
    if (await fileExists(globalPath)) {
      return {
        vscodeFolderPath: globalPath,
        mcpJsonPath: path.join(globalPath, 'mcp.json'),
        source: 'global',
      };
    }
  } catch {
    // APPDATA not set or path check failed - fall through to Step 3
  }

  // Step 3 - create .vscode in cwd
  const newVscodePath = path.join(process.cwd(), '.vscode');
  fs.mkdirSync(newVscodePath, { recursive: true });
  return {
    vscodeFolderPath: newVscodePath,
    mcpJsonPath: path.join(newVscodePath, 'mcp.json'),
    source: 'created',
  };
}

/**
 * Return the running Node.js version string (e.g. "v20.11.0").
 */
export function detectNodeVersion(): string {
  return process.version;
}

/**
 * Return true if the current Node.js version satisfies >= 18.0.0.
 */
export function isNodeVersionCompatible(): boolean {
  const version = process.version.replace(/^v/, '');
  return semver.gte(version, '18.0.0');
}

/**
 * Return the list of MCP server IDs currently present in an mcp.json file.
 * Returns an empty array if the file does not exist or cannot be parsed.
 */
export async function detectExistingMcps(mcpJsonPath: string): Promise<string[]> {
  try {
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(mcpJsonPath, 'utf-8').catch(() => null);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { servers?: Record<string, unknown> };
    return Object.keys(parsed.servers ?? {});
  } catch {
    return [];
  }
}