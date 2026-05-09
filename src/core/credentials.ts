import path from 'node:path';
import os from 'node:os';

import {
  readText,
  writeText,
  fileExists,
} from '../utils/fs.js';

import { log } from '../utils/logger.js';
import { detectOS } from './detector.js';

import type {
  CredentialStorage,
} from '../types.js';

//
// Constants
//

const SERVICE_NAME = 'mcp-kit';

//
// Shell profile helpers (env-profile storage strategy)
//

export function getShellProfileFiles(): string[] {
  const currentOS = detectOS();
  const home = os.homedir();

  switch (currentOS) {
    case 'windows':
      return [
        'System Environment Variables (setx)',
      ];

    case 'mac': {
      const zshrc = path.join(home, '.zshrc');
      const bashProfile = path.join(
        home,
        '.bash_profile'
      );
      return [zshrc, bashProfile];
    }

    default: {
      const bashrc = path.join(home, '.bashrc');
      const bashProfile = path.join(
        home,
        '.bash_profile'
      );
      return [bashrc, bashProfile];
    }
  }
}

//
// Env helpers
//

export function isEnvVarSet(key: string): boolean {
  return (
    key in process.env &&
    (process.env[key] ?? '').length > 0
  );
}

/**
 * Print instructions for user to set env variable
 */
export function printEnvProfileInstructions(
  key: string,
  value?: string
): void {
  const currentOS = detectOS();
  const placeholder = value ?? 'YOUR_VALUE_HERE';

  if (currentOS === 'windows') {
    log.warn(
      `${key} is not set. Add it to Windows Environment Variables:`
    );

    log.info(
      `setx ${key} "${placeholder}"`
    );

    log.info(
      'Or: System Properties → Environment Variables'
    );

    return;
  }

  const profiles = getShellProfileFiles();
  const primary = profiles[0];

  log.warn(
    `${key} is not set. Add this to your shell profile:`
  );

  log.info(
    `export ${key}="${placeholder}" >> ${primary}`
  );

  log.info(`source ${primary}`);
}

/**
 * Check and report env var status
 */
export function checkAndReportEnvVar(
  key: string,
  secret = false
): boolean {
  if (isEnvVarSet(key)) {
    const display = secret
      ? '***'
      : process.env[key];

    log.success(
      `${key} is already set (${display})`
    );

    return true;
  }

  printEnvProfileInstructions(key);
  return false;
}

//
// Keychain loader (optional dependency)
//

let keytarLoaded = false;
let keytar:
  | {
      setPassword: Function;
      getPassword: Function;
      deletePassword: Function;
    }
  | null = null;

async function loadKeytar() {
  if (keytarLoaded) return keytar;

  keytarLoaded = true;

  try {
    const mod = await import('keytar');
    keytar = mod;
  } catch {
    keytar = null;
  }

  return keytar;
}

//
// Dotenv helpers
//

function parseEnvFile(
  content: string
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    const val = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');

    result[key] = val;
  }

  return result;
}

function serializeEnvFile(
  vars: Record<string, string>
): string {
  return (
    Object.entries(vars)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') + '\n'
  );
}

async function upsertDotenv(
  key: string,
  value: string,
  filePath: string
): Promise<void> {
  const existing =
    (await readText(filePath)) ?? '';

  const vars = parseEnvFile(existing);
  vars[key] = value;

  await writeText(
    filePath,
    serializeEnvFile(vars)
  );
}

async function readDotenv(
  key: string,
  filePath: string
): Promise<string | null> {
  const content = await readText(filePath);
  if (!content) return null;

  const vars = parseEnvFile(content);
  return vars[key] ?? null;
}

async function deleteDotenv(
  key: string,
  filePath: string
): Promise<void> {
  const content = await readText(filePath);
  if (!content) return;

  const vars = parseEnvFile(content);
  delete vars[key];

  await writeText(
    filePath,
    serializeEnvFile(vars)
  );
}

//
// Public API
//

export async function storeCredential(
  key: string,
  value: string,
  storage: CredentialStorage,
  envFilePath?: string
): Promise<void> {
  switch (storage) {
    case 'env-profile': {
      checkAndReportEnvVar(key);
      return;
    }

    case 'keychain': {
      const kt = await loadKeytar();

      if (kt) {
        await kt.setPassword(
          SERVICE_NAME,
          key,
          value
        );
        return;
      }

      log.warn(
        `Keychain unavailable, falling back to .env for ${key}`
      );

      await upsertDotenv(
        key,
        value,
        envFilePath ?? '.env'
      );
      return;
    }

    case 'dotenv': {
      await upsertDotenv(
        key,
        value,
        envFilePath ?? '.env'
      );
      return;
    }

    case 'inline': {
      log.warn(
        'Credential stored inline in mcp.json (not recommended)'
      );
      return;
    }
  }
}

export async function getCredential(
  key: string,
  storage: CredentialStorage,
  envFilePath?: string
): Promise<string | null> {
  switch (storage) {
    case 'env-profile':
      return process.env[key] ?? null;

    case 'keychain': {
      const kt = await loadKeytar();
      if (!kt) return null;
      return null;
    }

    case 'dotenv':
      return readDotenv(
        key,
        envFilePath ?? '.env'
      );

    case 'inline':
      return null;
  }
}

export async function deleteCredential(
  key: string,
  storage: CredentialStorage,
  envFilePath?: string
): Promise<void> {
  switch (storage) {
    case 'env-profile':
      log.warn(
        `${key} is stored in shell profile. Remove manually.`
      );
      return;

    case 'keychain': {
      const kt = await loadKeytar();
      if (kt) {
        await kt.deletePassword(
          SERVICE_NAME,
          key
        );
      }
      return;
    }

    case 'dotenv':
      await deleteDotenv(
        key,
        envFilePath ?? '.env'
      );
      return;

    case 'inline':
      return;
  }
}

export function buildEnvRefValue(
  key: string,
  storage: CredentialStorage,
  inlineValue?: string
): string {
  if (storage === 'inline') {
    return inlineValue ?? '';
  }

  return `\${env:${key}}`;
}

export async function ensureGitignored(
  projectDir: string,
  includeMcpJson = false
): Promise<void> {
  const gitignorePath = path.join(
    projectDir,
    '.gitignore'
  );

  const existing =
    (await readText(gitignorePath)) ?? '';

  const lines = existing.split('\n');
  const additions: string[] = [];

  if (!lines.includes('.env')) {
    additions.push('.env');
  }

  if (
    includeMcpJson &&
    !lines.includes('mcp.json')
  ) {
    additions.push('mcp.json');
  }

  if (additions.length === 0) return;

  const newContent =
    existing +
    '\n' +
    additions.join('\n') +
    '\n';

  await writeText(
    gitignorePath,
    newContent
  );

  log.success(
    `gitignore updated: ${additions.join(', ')}`
  );
}

export function getEnvFilePath(
  vscodeFolderPath: string
): string {
  return path.join(
    path.dirname(vscodeFolderPath),
    '.env'
  );
}

export {
  parseEnvFile,
};