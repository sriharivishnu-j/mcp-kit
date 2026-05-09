import axios from "axios";

//------------------------------------------------------------
// Connectivity & npm registry helpers
//------------------------------------------------------------

/**
 * Ping a URL to check if it's reachable. Returns true if the request succeeds, false otherwise.
 */
export async function checkConnectivity(url: string, timeoutMs = 8000): Promise<boolean> {
  try {
    const response = await axios.head(url, { timeout: timeoutMs });
  return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}

/**
 * Fetch the latest published version of a package from the npm registry. Returns 'unknown' if the package doesn't exist or there's an error.
  */

export async function getNpmPackageVersion(packageName: string): Promise<string | null> {
  try { 
  const pkgPath=packageName.replace(/\//g, '%2f');
  const url = `https://registry.npmjs.org/${pkgPath}/latest`;
  const response = await axios.get<{ version: string }>(url, { timeout: 8000 });
  return response.data?.version ?? 'unknown';
}
 catch {
    return 'unknown';
  }
}

/**
 * check whether an npm package exists. Returns true if the package exists, false otherwise.
 */
export async function checkNpmPackageExists(packageName: string): Promise<boolean> {
  try {
    const pkgPath=packageName.replace(/\//g, '%2f');
    const url = `https://registry.npmjs.org/${pkgPath}`;
    await axios.head(url, { timeout: 8000 });
    return true;
  } catch {
    return false;
  }
}