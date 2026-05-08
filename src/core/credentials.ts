import dotenv from "dotenv";
import fs from "fs-extra";
import path from "node:path";
import { CredentialStorage } from "../types";
import { log } from "../utils/logger";

const SERVICE_NAME = "mcp-kit";

async function loadKeytar(): Promise<{
  setPassword: (service: string, account: string, password: string) => Promise<void>;
  getPassword: (service: string, account: string) => Promise<string | null>;
  deletePassword: (service: string, account: string) => Promise<boolean>;
} | null> {
  try {
    const mod = await import("keytar");
    return mod.default as {
      setPassword: (service: string, account: string, password: string) => Promise<void>;
      getPassword: (service: string, account: string) => Promise<string | null>;
      deletePassword: (service: string, account: string) => Promise<boolean>;
    };
  } catch {
    return null;
  }
}

function upsertEnvLine(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const suffix = content.endsWith("\n") || content.length === 0 ? "" : "\n";
  return `${content}${suffix}${line}\n`;
}

export async function storeCredential(
  key: string,
  value: string,
  storage: CredentialStorage,
  envFilePath?: string
): Promise<void> {
  if (storage === "keychain") {
    const keytar = await loadKeytar();
    if (keytar) {
      await keytar.setPassword(SERVICE_NAME, key, value);
      return;
    }

    log.warn("Keychain unavailable. Falling back to .env storage.");
    await storeCredential(key, value, "dotenv", envFilePath);
    return;
  }

  if (storage === "dotenv") {
    const targetPath = envFilePath || path.join(process.cwd(), ".env");
    const existing = (await fs.pathExists(targetPath)) ? await fs.readFile(targetPath, "utf8") : "";
    const updated = upsertEnvLine(existing, key, value);
    await fs.writeFile(targetPath, updated, "utf8");
    await ensureGitignore(path.dirname(targetPath));
    return;
  }

  log.warn("⚠️ Credentials stored inline. Avoid committing mcp.json.");
}

export async function getCredential(
  key: string,
  storage: CredentialStorage,
  envFilePath?: string
): Promise<string | null> {
  if (storage === "keychain") {
    const keytar = await loadKeytar();
    if (!keytar) {
      return null;
    }
    return keytar.getPassword(SERVICE_NAME, key);
  }

  if (storage === "dotenv") {
    const targetPath = envFilePath || path.join(process.cwd(), ".env");
    if (!(await fs.pathExists(targetPath))) {
      return null;
    }
    const parsed = dotenv.parse(await fs.readFile(targetPath, "utf8"));
    return parsed[key] ?? null;
  }

  return null;
}

export async function deleteCredential(
  key: string,
  storage: CredentialStorage,
  envFilePath?: string
): Promise<void> {
  if (storage === "keychain") {
    const keytar = await loadKeytar();
    if (keytar) {
      await keytar.deletePassword(SERVICE_NAME, key);
    }
    return;
  }

  if (storage === "dotenv") {
    const targetPath = envFilePath || path.join(process.cwd(), ".env");
    if (!(await fs.pathExists(targetPath))) {
      return;
    }

    const lines = (await fs.readFile(targetPath, "utf8"))
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0 && !line.startsWith(`${key}=`));

    await fs.writeFile(targetPath, `${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`, "utf8");
  }
}

export function buildEnvRefValue(key: string, storage: CredentialStorage, inlineValue?: string): string {
  if (storage === "inline") {
    return inlineValue || "";
  }

  return `\${env:${key}}`;
}

export async function ensureGitignore(projectDir: string): Promise<void> {
  const gitignorePath = path.join(projectDir, ".gitignore");
  const existing = (await fs.pathExists(gitignorePath)) ? await fs.readFile(gitignorePath, "utf8") : "";
  const lines = new Set(existing.split(/\r?\n/).filter((line) => line.trim().length > 0));

  if (!lines.has(".env")) {
    lines.add(".env");
  }

  if (!lines.has("mcp.json")) {
    lines.add("mcp.json");
  }

  const output = `${Array.from(lines).join("\n")}\n`;
  await fs.writeFile(gitignorePath, output, "utf8");
}
