import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import semver from "semver";
import { VSCODE_SEARCH_DEPTH } from "../constants";
import { readMcpJson } from "./writer";
import { SupportedOS, VsCodePaths } from "../types";

export function detectOS(): SupportedOS {
  if (process.platform === "win32") {
    return "windows";
  }

  if (process.platform === "darwin") {
    return "mac";
  }

  return "linux";
}

export function getGlobalVsCodeConfigPath(currentOs: SupportedOS): string {
  if (currentOs === "windows") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "Code", "User");
  }

  if (currentOs === "mac") {
    return path.join(os.homedir(), "Library", "Application Support", "Code", "User");
  }

  return path.join(os.homedir(), ".config", "Code", "User");
}

export async function detectVsCodePath(): Promise<VsCodePaths> {
  let current = process.cwd();

  for (let i = 0; i <= VSCODE_SEARCH_DEPTH; i += 1) {
    const candidate = path.join(current, ".vscode");
    if (await fs.pathExists(candidate)) {
      return {
        vscodeFolderPath: candidate,
        mcpJsonPath: path.join(candidate, "mcp.json"),
        source: "project"
      };
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  const globalPath = getGlobalVsCodeConfigPath(detectOS());
  if (await fs.pathExists(globalPath)) {
    return {
      vscodeFolderPath: globalPath,
      mcpJsonPath: path.join(globalPath, "mcp.json"),
      source: "global"
    };
  }

  const created = path.join(process.cwd(), ".vscode");
  fs.mkdirSync(created, { recursive: true });
  return {
    vscodeFolderPath: created,
    mcpJsonPath: path.join(created, "mcp.json"),
    source: "created"
  };
}

export function detectNodeVersion(): string {
  return process.version;
}

export function isNodeVersionCompatible(): boolean {
  return semver.gte(process.version, "18.0.0");
}

export async function detectExistingMcps(mcpJsonPath: string): Promise<string[]> {
  if (!(await fs.pathExists(mcpJsonPath))) {
    return [];
  }
  const config = await readMcpJson(mcpJsonPath);
  return Object.keys(config.servers);
}
