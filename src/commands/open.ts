import { execSync } from "node:child_process";
import { detectOS, detectVsCodePath } from "../core/detector";
import { log } from "../utils/logger";

export async function runOpen(): Promise<void> {
  try {
    const detected = await detectVsCodePath();
    const osName = detectOS();

    if (osName === "windows") {
      execSync(`start "" "${detected.mcpJsonPath}"`, { stdio: "ignore", shell: "cmd.exe" });
    } else if (osName === "mac") {
      execSync(`open "${detected.mcpJsonPath}"`, { stdio: "ignore" });
    } else {
      execSync(`xdg-open "${detected.mcpJsonPath}"`, { stdio: "ignore" });
    }

    log.success(`Opened ${detected.mcpJsonPath}`);
    process.exit(0);
  } catch (err) {
    log.error(`open failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    log.muted("Suggestion: open the mcp.json path manually from `mcp-kit status` output.");
    if (process.env.DEBUG && err instanceof Error) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
