//
// Operating system enum
//

export type SupportedOS =
  | 'windows'
  | 'mac'
  | 'linux';

//
// Profile mode from CLI flag
//

export type ProfileMode =
  | 'dev'
  | 'non-dev';

//
// Credential storage strategy
//

export type CredentialStorage =
  | 'env-profile'
  | 'keychain'
  | 'dotenv'
  | 'inline';

//
// MCP category for grouping in registry
//

export type McpCategory =
  | 'database'
  | 'devops'
  | 'testing'
  | 'documentation'
  | 'cloud'
  | 'filesystem'
  | 'incident'
  | 'versioncontrol'
  | 'productivity'
  | 'codeanalysis'
  | 'design';

//
// A single env var that an MCP needs
//

export interface McpEnvVar {
  key: string;
  // e.g. "AZURE_SUBSCRIPTION_ID"

  label: string;
  // human readable e.g. "Azure Subscription ID"

  secret: boolean;
  // true = mask input, store securely

  required: boolean;

  defaultValue?: string;

  hint?: string;
  // shown below prompt
  // e.g. "Found in Azure Portal > Subscriptions"

  validationRegex?: string;
}

//
// Definition of a single MCP
//

export interface McpDefinition {
  id: string;
  // unique slug e.g. "azure", "playwright", "mssql"

  name: string;
  // display name e.g. "Azure MCP"

  description: string;
  // one-line description

  category: McpCategory;

  npmPackage: string;
  // e.g. "@azure/mcp"

  command: string;

  args: string[];
  // e.g. ["-y", "@azure/mcp@latest", "server", "start"]

  // supports ${KEY} placeholders for env var substitution in args

  envVars: McpEnvVar[];
  // questions to ask during setup

  devOnly: boolean;
  // true = only in --dev profile

  nonDevOnly: boolean;
  // true = only in --non-dev profile

  requiresNetwork: boolean;

  healthCheckUrl?: string;
  // URL to ping to verify connectivity

  docsUrl: string;

  version?: string;
  // cached latest version
}

//
// A configured MCP entry in mcp.json
//

export interface McpServerEntry {
  type?: string;
  // e.g. "stdio"

  command: string;

  args: string[];

  env?: Record<string, string>;

  disabled?: boolean;
  // when true, VS Code ignores this server
}

//
// VS Code input prompt for variable substitution
//

export interface McpInputPrompt {
  id: string;

  type: string;

  description: string;

  password?: boolean;
}

//
// The full mcp.json structure
//

export interface McpJsonConfig {
  inputs?: McpInputPrompt[];

  servers: Record<string, McpServerEntry>;
}

//
// Detected VS Code paths on the current machine
//

export interface VsCodePaths {
  mcpJsonPath: string;
  // full path to mcp.json

  vscodeFolderPath: string;
  // full path to .vscode folder

  source:
    | 'project'
    | 'global'
    | 'created';

  // project = found in working dir tree
  // global = found in OS VS Code user config
  // created = did not exist, created new
}

//
// Result of doctor check per MCP
//

export interface DoctorResult {
  mcpId: string;

  mcpName: string;

  configured: boolean;

  credentialsPresent: boolean;

  networkReachable?: boolean;

  packageInstallable: boolean;

  issues: string[];
  // human-readable list of issues

  suggestions: string[];
  // how to fix

  status:
    | 'healthy'
    | 'warning'
    | 'error';
}

//
// Status entry per configured MCP
//

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

//
// Represents a resolved credential value
//

export interface CredentialValue {
  key: string;

  value: string;

  storage: CredentialStorage;
}

//
// mcp-kit's own metadata stored at ~/.mcp-kit/meta.json
//

export interface McpKitMeta {
  installedAt: string;

  lastUpdated: string;

  profileMode: ProfileMode;

  vscodePath: string;

  credentialStorage: CredentialStorage;

  installedMcps: string[];
  // list of MCP IDs configured

  mcpKitVersion: string;
}

//
// Export structure for mcp-kit export command
//

export interface McpKitExport {
  exportedAt: string;

  mcpKitVersion: string;

  profileMode: string;

  servers: Record<string, McpServerEntry>;

  mcpIds: string[];

  instructions: string;
}