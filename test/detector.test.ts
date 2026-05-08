import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { detectOS, detectVsCodePath } from "../src/core/detector";

describe("detector", () => {
  const originalCwd = process.cwd();
  const tmpRoot = path.join(os.tmpdir(), `mcp-kit-detector-${Date.now()}`);

  beforeAll(async () => {
    await fs.mkdirp(tmpRoot);
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    await fs.remove(tmpRoot);
  });

  test("detectOS returns supported value", () => {
    const value = detectOS();
    expect(["windows", "mac", "linux"]).toContain(value);
  });

  test("detectVsCodePath finds project .vscode", async () => {
    const project = path.join(tmpRoot, "project-a");
    await fs.mkdirp(path.join(project, ".vscode"));
    process.chdir(project);

    const detected = await detectVsCodePath();
    expect(detected.source).toBe("project");
    expect(path.basename(detected.vscodeFolderPath)).toBe(".vscode");
  });

  test("detectVsCodePath falls back to global path when project missing", async () => {
    const project = path.join(tmpRoot, "project-b");
    await fs.mkdirp(project);
    process.chdir(project);

    const detected = await detectVsCodePath();
    expect(["global", "created"]).toContain(detected.source);
  });

  test("detectVsCodePath creates project .vscode when global is unavailable", async () => {
    const project = path.join(tmpRoot, "project-c");
    await fs.mkdirp(project);
    process.chdir(project);

    const detected = await detectVsCodePath();
    if (detected.source === "created") {
      expect(await fs.pathExists(path.join(project, ".vscode"))).toBe(true);
    } else {
      expect(detected.source).toBe("global");
    }
  });
});
