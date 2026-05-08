export type SupportedOS = "windows" | "mac" | "linux";

export type ProfileMode = "dev" | "non-dev";

export type CredentialStorage = "keychain" | "dotenv" | "inline";

export type McpCategory =
  | "database"
  | "devops"
  | "testing"
  | "documentation"
  | "cloud"
  | "filesystem"
  | "incident"
  | "versioncontrol"
  | "productivity";

export interface McpEnvVar {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  defaultValue?: string;
  hint?: string;
  validationRegex?: string;
}

export interface McpDefinition {
  id: string;
  name: string;
  description: string;
  category: McpCategory;
  npmPackage: string;
  command: string;
  args: string[];
  envVars: McpEnvVar[];
  devOnly: boolean;
  nonDevOnly: boolean;
  requiresNetwork: boolean;
  healthCheckUrl?: string;
  docsUrl: string;
  version?: string;
}

export interface McpServerEntry {
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

export interface McpJsonConfig {
  servers: Record<string, McpServerEntry>;
}

export interface VsCodePaths {
  mcpJsonPath: string;
  vscodeFolderPath: string;
  source: "project" | "global" | "created";
}

export interface DoctorResult {
  mcpId: string;
  mcpName: string;
  configured: boolean;
  credentialsPresent: boolean;
  networkReachable?: boolean;
  packageInstallable: boolean;
  issues: string[];
  suggestions: string[];
  status: "healthy" | "warning" | "error";
}

export interface McpStatus {
  id: string;
  name: string;
  category: McpCategory;
  version: string;
  latestVersion: string;
  upToDate: boolean;
  credentialStorage: CredentialStorage;
  configured: boolean;
}

export interface CredentialValue {
  key: string;
  value: string;
  storage: CredentialStorage;
}

export interface McpKitMeta {
  installedAt: string;
  lastUpdated: string;
  profileMode: ProfileMode;
  vscodePath: string;
  credentialStorage: CredentialStorage;
  installedMcps: string[];
  mcpKitVersion: string;
}
