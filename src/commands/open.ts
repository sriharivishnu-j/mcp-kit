import { execSync } from 'node:child_process';
import { detectVsCodePath, detectOS } from '../core/detector.js';
import { log } from '../utils/logger.js';

//
// mcp-kit open
//

export async function runOpen(): Promise<void> {
  try {
    const vscodePaths = await detectVsCodePath();
    const mcpJsonPath = vscodePaths.mcpJsonPath;

    log.step(`Opening ${mcpJsonPath} in VS Code...`);

    try {
      execSync(`code "${mcpJsonPath}"`, { stdio: 'ignore' });
      log.success('Opened in VS Code.');
    } catch {
      // code CLI not in PATH - fall back to OS default opener
      const currentOS = detectOS();
      const opener =
        currentOS === 'windows' ? 'start' :
        currentOS === 'mac' ? 'open' :
        'xdg-open';

      try {
        execSync(`${opener} "${mcpJsonPath}"`, { stdio: 'ignore' });
        log.success('Opened with system editor.');
      } catch {
        log.warn('Could not open the file automatically.');
        log.info(`File path: ${mcpJsonPath}`);
      }
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`open failed: ${message}`);
    if (process.env['DEBUG']) console.error(err);
    process.exit(1);
  }
}