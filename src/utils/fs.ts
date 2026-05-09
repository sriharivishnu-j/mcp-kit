import fs from 'node:fs/promises';
import path from 'node:path';
import fsExtra from 'fs-extra';

//--------------------------------------------------------------
// Safe file system helpers 
//--------------------------------------------------------------

/**
 * Read and parse a JSON file. Returns null if the file doesn't exist or is invalid.
 */

export async function safeReadJSON<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Write an object to a JSON file, creating directories as needed.
 */
export async function safeWriteJSON(filePath: string, data: any): Promise<void> {
  await fsExtra.outputJSON(filePath, data, { encoding: 'utf-8', spaces: 2 });
  const tmpPath = filePath + '.tmp';
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpPath, filePath);
}

/**
 * Check if a file exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check whether path is writable.
 */
export async function isWritable(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a directory exists, creating it if necessary.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fsExtra.ensureDir(dirPath);
}

/**
 * Read a text file, returning null if it doesn't exist.
 */
export async function readText(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Write text to a file, creating directories as needed.
 */
export async function writeText(filePath: string, content: string): Promise<void> {
  await fsExtra.ensureDir(path.dirname(filePath));
  await fsExtra.outputFile(filePath, content, 'utf-8');
}

/**
 * Append text to a file, creating it if it doesn't exist.
 */
export async function appendText(filePath: string, content: string): Promise<void> {
  await fsExtra.ensureDir(path.dirname(filePath));
  await fsExtra.appendFile(filePath, content, 'utf-8');
} 

/**
 * Delete a file if it exists.
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore errors if the file doesn't exist
  }
}