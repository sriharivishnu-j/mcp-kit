import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { buildEnvRefValue, ensureGitignore, getCredential, storeCredential } from "../src/core/credentials";

describe("credentials", () => {
  const tmpDir = path.join(os.tmpdir(), `mcp-kit-credentials-${Date.now()}`);
  const envFile = path.join(tmpDir, ".env");

  beforeAll(async () => {
    await fs.mkdirp(tmpDir);
  });

  afterAll(async () => {
    await fs.remove(tmpDir);
  });

  test("storeCredential/getCredential roundtrip for dotenv", async () => {
    await storeCredential("TEST_SECRET", "abc123", "dotenv", envFile);
    const value = await getCredential("TEST_SECRET", "dotenv", envFile);
    expect(value).toBe("abc123");
  });

  test("buildEnvRefValue returns env ref for keychain/dotenv", () => {
    expect(buildEnvRefValue("FOO", "keychain")).toBe("${env:FOO}");
    expect(buildEnvRefValue("BAR", "dotenv")).toBe("${env:BAR}");
  });

  test("buildEnvRefValue returns inline value for inline", () => {
    expect(buildEnvRefValue("FOO", "inline", "value")).toBe("value");
  });

  test("ensureGitignore adds .env if missing", async () => {
    const project = path.join(tmpDir, "project");
    await fs.mkdirp(project);
    await ensureGitignore(project);
    const content = await fs.readFile(path.join(project, ".gitignore"), "utf8");
    expect(content.includes(".env")).toBe(true);
  });
});
