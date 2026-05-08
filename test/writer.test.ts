import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { addServerToMcpJson, readMcpJson, removeServerFromMcpJson, writeMcpJson } from "../src/core/writer";

describe("writer", () => {
  const tmpDir = path.join(os.tmpdir(), `mcp-kit-writer-${Date.now()}`);
  const mcpJsonPath = path.join(tmpDir, "mcp.json");

  beforeAll(async () => {
    await fs.mkdirp(tmpDir);
  });

  afterAll(async () => {
    await fs.remove(tmpDir);
  });

  test("readMcpJson returns empty config if file missing", async () => {
    const value = await readMcpJson(path.join(tmpDir, "missing.json"));
    expect(value).toEqual({ servers: {} });
  });

  test("writeMcpJson writes valid JSON", async () => {
    await writeMcpJson(mcpJsonPath, { servers: { azure: { command: "npx", args: ["-y", "@azure/mcp"] } } });
    const raw = await fs.readJSON(mcpJsonPath);
    expect(raw.servers.azure.command).toBe("npx");
  });

  test("addServerToMcpJson merges without losing existing entries", async () => {
    await writeMcpJson(mcpJsonPath, { servers: { azure: { command: "npx", args: ["-y", "@azure/mcp"] } } });
    await addServerToMcpJson(mcpJsonPath, "git", { command: "npx", args: ["-y", "@modelcontextprotocol/server-git"] });
    const config = await readMcpJson(mcpJsonPath);
    expect(Object.keys(config.servers)).toEqual(expect.arrayContaining(["azure", "git"]));
  });

  test("removeServerFromMcpJson removes only target key", async () => {
    await removeServerFromMcpJson(mcpJsonPath, "azure");
    const config = await readMcpJson(mcpJsonPath);
    expect(config.servers.azure).toBeUndefined();
    expect(config.servers.git).toBeDefined();
  });
});
