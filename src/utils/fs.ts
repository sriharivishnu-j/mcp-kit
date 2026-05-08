import fs from "fs-extra";
import path from "node:path";

export async function ensureDirForFile(filePath: string): Promise<void> {
  await fs.mkdirp(path.dirname(filePath));
}

export async function pathExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

export async function readJsonSafe<T>(filePath: string, fallback: T): Promise<T> {
  if (!(await fs.pathExists(filePath))) {
    return fallback;
  }
  return fs.readJSON(filePath) as Promise<T>;
}

export async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  await ensureDirForFile(filePath);
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmpPath, filePath);
}
