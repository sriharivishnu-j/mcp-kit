import os from "node:os";
import path from "node:path";
import type { McpDefinition } from "./types.js";

export const MCP_REGISTRY: McpDefinition[] = [
  {
    id: "azure",
    name: "Azure MCP",
    description:
      "Query and manage Azure resources, resource groups, subscriptions and services",
    category: "cloud",
    npmPackage: "@azure/mcp",
    command: "npx",
    args: ["-y", "@azure/mcp@latest", "server", "start"],
    devOnly: false,
    nonDevOnly: false,
    requiresNetwork: true,
    docsUrl: "https://github.com/Azure/azure-mcp",
    healthCheckUrl: "https://management.azure.com",
    envVars: [
      {
        key: "AZURE_SUBSCRIPTION_ID",
        label: "Azure Subscription ID",
        secret: false,
        required: true,
        hint: "Azure Portal → Subscriptions → copy Subscription ID",
      },
      {
        key: "AZURE_TENANT_ID",
        label: "Azure Tenant ID (optional)",
        secret: false,
        required: false,
        hint: "Azure Portal → Azure Active Directory → Tenant ID",
      },
      {
        key: "AZURE_CLIENT_ID",
        label: "Azure Client ID (optional, for service principal)",
        secret: false,
        required: false,
      },
      {
        key: "AZURE_CLIENT_SECRET",
        label: "Azure Client Secret (optional, for service principal)",
        secret: true,
        required: false,
      },
    ],
  },
  {
    id: "confluence",
    name: "Confluence MCP",
    description: "Search and read Confluence pages, spaces and documentation",
    category: "documentation",
    npmPackage: "@global-packages/confluence-mcp",
    command: "npx",
    args: ["{CONFLUENECE_LOCAL_PATH}"],
    devOnly: false,
    nonDevOnly: false,
    requiresNetwork: true,
    docsUrl: "https://github.com/global-packages/confluence-mcp",
    healthCheckUrl: "https://www.atlassian.com",
    envVars: [
      {
        key: "CONFLUENECE_LOCAL_PATH",
        label: "Confluence Local Path (path to confluence-mcp)",
        secret: false,
        required: false,
        hint: "Path to local confluence CLI installation (e.g. /Users/yourname/confluence-cli) - leave blank to auto-install latest confluence CLI on each run",
      },

      {
        key: "CONFLUENCE_URL",
        label: "Confluence Base URL",
        secret: false,
        required: true,
        hint: "e.g. https://yourcompany.atlassian.net",
      },
      {
        key: "CONFLUENCE_TOKEN",
        label: "Confluence API Token",
        secret: true,
        required: true,
        hint: "Atlassian Account → Security → API Tokens → Create token",
      },
      {
        key: "CONFLUENCE_EMAIL",
        label: "Atlassian Account Email",
        secret: false,
        required: true,
        hint: "Email you use to log into Confluence",
      },
      {
        key: "CONFLUENCE_SPACE",
        label: "Confluence Space Key (optional)",
        secret: false,
        required: false,
        hint: "e.g. OPS, ENGG, DEV — leave blank to search all spaces",
      },
      {
        key: "NODE_EXTRA_CA_CERTS",
        label: "Path to additional CA certificates (optional)",
        secret: false,
        required: false,
        hint: "Path to .pem file with additional CA certificates, if your Confluence uses a self-signed certificate (e.g. /Users/yourname/certs/ca.pem)",
      },
      {
        key: "NO_PROXY",
        label: "No Proxy (optional)",
        secret: false,
        required: false,
        hint: "Comma-separated list of hosts to exclude from proxy, if your Confluence is on a private network (e.g. localhost,127.0.0.1)",
      },
    ],
  },
  {
    id: "mssql",
    name: "MSSQL MCP",
    description: "Query Microsoft SQL Server and Azure SQL databases via DBHub",
    category: "database",
    npmPackage: "@bytebase/dbhub",
    command: "npx",
    args: ["@bytebase/dbhub@latest"],
    devOnly: true,
    nonDevOnly: false,
    requiresNetwork: true,
    docsUrl: "https://github.com/bytebase/dbhub",

    envVars: [
      {
        key: "DB_TYPE",
        label: "Database Type",
        secret: false,
        required: false,
        defaultValue: "sqlserver",
        hint: "e.g. sqlserver, mysql, postgres",
      },
      {
        key: "DB_HOST",
        label: "Database Host",
        secret: false,
        required: false,
        hint: "e.g. myserver.database.windows.net",
      },
      {
        key: "DB_PORT",
        label: "Database Port",
        secret: false,
        required: false,
        defaultValue: "1433",
      },
      {
        key: "DB_USER",
        label: "Database Username",
        secret: false,
        required: false,
      },
      {
        key: "DB_PASSWORD",
        label: "Database Password",
        secret: true,
        required: false,
      },
      {
        key: "DB_NAME",
        label: "Database Name",
        secret: false,
        required: false,
      },
      {
        key: "HTTP_PROXY",
        label: "HTTP Proxy (optional)",
        secret: false,
        required: false,
        hint: "e.g. http://proxyserver:8080 - needed if your database is behind a proxy",
      },
      {
        key: "NODE_EXTRA_CA_CERTS",
        label: "Path to additional CA certificates (optional)",
        secret: false,
        required: false,
        hint: "Path to .pem file with additional CA certificates, if your Confluence uses a self-signed certificate (e.g. /Users/yourname/certs/ca.pem)",
      },
      {
        key: "NO_PROXY",
        label: "No Proxy (optional)",
        secret: false,
        required: false,
        hint: "Comma-separated list of hosts to exclude from proxy, if your Confluence is on a private network (e.g. localhost,127.0.0.1)",
      },
    ],
  },
  {
    id: "playwright",
    name: "Playwright MCP",
    description: "Browser automation, web scraping and end-to-end testing",
    category: "testing",
    npmPackage: "@playwright/mcp",
    command: "npx",
    args: ['-y',"@playwright/mcp@latest"],
    devOnly: true,
    nonDevOnly: false,
    requiresNetwork: false,
    docsUrl: "https://github.com/microsoft/playwright-mcp",
    envVars: [],
  },
  {
    id: "runbook",
    name: "Runbook MCP",
    description:
      "Incident runbook automation across GitHub, ADO, Confluence, Notion",
    category: "incident",
    npmPackage: "@global-packages/runbook-mcp",
    command: "npx",
    args: ["-y", "@global-packages/runbook-mcp"],
    devOnly: false,
    nonDevOnly: false,
    requiresNetwork: true,
    docsUrl: "https://github.com/global-packages/runbook-mcp",
    healthCheckUrl: "https://github.com",
    envVars: [
      {
        key: "GITHUB_TOKEN",
        label: "GitHub Personal Access Token (if runbooks are on GitHub)",
        secret: true,
        required: false,
        hint: "GitHub → Settings → Developer Settings → Personal Access Tokens",
      },
      {
        key: "GITHUB_REPO",
        label: "GitHub Repo containing runbooks (org/repo)",
        secret: false,
        required: false,
        hint: "e.g. my-org/runbooks",
      },
      {
        key: "ADO_TOKEN",
        label: "Azure DevOps PAT (if runbooks are in ADO Wiki)",
        secret: true,
        required: false,
        hint: "ADO → User Settings → Personal Access Tokens",
      },
      {
        key: "ADO_ORG",
        label: "Azure DevOps Organization",
        secret: false,
        required: false,
      },
      {
        key: "ADO_PROJECT",
        label: "Azure DevOps Project",
        secret: false,
        required: false,
      },
      {
        key: "ADO_PROJECT",
        label: "Azure DevOps Project",
        secret: false,
        required: false,
      }
    ],
  },
  {
    id: "filesystem",
    name: "Filesystem MCP",
    description: "Read, write and navigate local files and directories",
    category: "filesystem",
    npmPackage: "@modelcontextprotocol/server-filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem",'${FILESYSTEM_ALLOWED_PATH}'],
    devOnly: true,
    nonDevOnly: false,
    requiresNetwork: false,
    docsUrl: "https://github.com/modelcontextprotocol/servers",
    envVars: [
      {
        key: "FILESYSTEM_ALLOWED_PATH",
        label: "Allowed directory path for filesystem access",
        secret: false,
        required: true,
        hint: "e.g. /Users/yourname/projects or C:\\Projects",
      },
    ],
  },
  {
    id: "git",
    name: "Git MCP",
    description: "Query git history, branches, commits and diffs",
    category: "versioncontrol",
    npmPackage: "@modelcontextprotocol/server-git",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-git",'--repository','${GIT_REPO_PATH}'],
    devOnly: true,
    nonDevOnly: false,
    requiresNetwork: false,
    docsUrl: "https://github.com/modelcontextprotocol/servers",
    envVars: [
      {
        key: "GIT_REPO_PATH",
        label: "Path to your git repository",
        secret: false,
        required: true,
        hint: "e.g. /Users/yourname/projects/my-app",
      },
    ],
  },
  {
    id: "azuredevops",
    name: "Azure DevOps MCP",
    description: "Query ADO work items, pipelines, repos and pull requests",
    category: "devops",
    npmPackage: "@azure-devops/mcp",
    command: "npx",
    args: ['--verbose',"-y", "@azure-devops/mcp"],
    devOnly: false,
    nonDevOnly: false,
    requiresNetwork: true,
    docsUrl: "https://github.com/microsoft/azure-devops-mcp",
    healthCheckUrl: "https://dev.azure.com",
    envVars: [
      {
        key: "ADO_TOKEN",
        label: "Azure DevOps Personal Access Token",
        secret: true,
        required: true,
        hint: "ADO → User Settings (top right) → Personal Access Tokens",
      },
      {
        key: "ADO_PAT_TOKEN",
        label: "Azure DevOps Personal Access Token (alternative)",
        secret: true,
        required: false,
        hint: "ADO → User Settings (top right) → Personal Access Tokens - alternative env var name",
      },
      {
        key: "ADO_ORG",
        label: "Azure DevOps Organization Name",
        secret: false,
        required: true,
        hint: "e.g. mycompany (from dev.azure.com/mycompany)",
      },
      {
        key: "ADO_PROJECT",
        label: "Azure DevOps Project Name",
        secret: false,
        required: true,
      },
    ],
  },
  {
    id: "postgres",
    name: "PostgreSQL MCP",
    description: "Query PostgreSQL databases",
    category: "database",
    npmPackage: "@modelcontextprotocol/server-postgres",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres"],
    devOnly: true,
    nonDevOnly: false,
    requiresNetwork: true,
    docsUrl: "https://github.com/modelcontextprotocol/servers",
    healthCheckUrl: "https://www.postgresql.org",
    envVars: [
      {
        key: "POSTGRES_CONNECTION_STRING",
        label: "PostgreSQL Connection String",
        secret: true,
        required: true,
        hint: "postgresql://user:password@host:5432/dbname",
      },
    ],
  },
  {
    id: "slack",
    name: "Slack MCP",
    description: "Read Slack messages, channels and send notifications",
    category: "productivity",
    npmPackage: "@modelcontextprotocol/server-slack",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    devOnly: false,
    nonDevOnly: false,
    requiresNetwork: true,
    docsUrl: "https://github.com/modelcontextprotocol/servers",
    healthCheckUrl: "https://slack.com",
    envVars: [
      {
        key: "SLACK_BOT_TOKEN",
        label: "Slack Bot Token",
        secret: true,
        required: true,
        hint: "Slack API → Your App → OAuth & Permissions → Bot User OAuth Token",
      },
      {
        key: "SLACK_TEAM_ID",
        label: "Slack Team/Workspace ID",
        secret: false,
        required: true,
        hint: "Slack → Workspace Settings → bottom of page",
      },
    ],
  },
  {
  // 11. SonarQube MCP
  id: 'sonarqube',
  name: 'SonarQube MCP',
  description:
    'Code quality and security analysis via SonarQube MCP server (JAR)',
  category: 'codeanalysis',
  npmPackage: 'sonarqube-mcp-server',
  command: 'java',
  args: [
    '-Djdk.tls.client.protocols=TLSv1.2',
    '-jar',
    '${SONARQUBE_JAR_PATH}',
  ],
  devOnly: true,
  nonDevOnly: false,
  requiresNetwork: true,
  docsUrl: 'https://github.com/SonarSource/mcp-server-sonarqube',

  envVars: [
    {
      key: 'SONARQUBE_JAR_PATH',
      label: 'Path to SonarQube MCP Server JAR file',
      secret: false,
      required: true,
      hint:
        'e.g. /Users/yourname/sonarqube-mcp-server-1.9.0.jar',
    },
    {
      key: 'SONARQUBE_TOKEN',
      label: 'SonarQube Token',
      secret: true,
      required: true,
      hint:
        'SonarQube → My Account → Security → Generate Token',
    },
    {
      key: 'SONARQUBE_URL',
      label: 'SonarQube Server URL',
      secret: false,
      required: true,
      hint: 'e.g. https://sonarqube.yourdomain.com',
    },
    {
      key: 'STORAGE_PATH',
      label: 'Storage path for SonarQube MCP data (optional)',
      secret: false,
      required: false,
      hint: 'e.g. /Users/yourname/sonarqube-mcp-data',
    },
    {
      key: 'NO_PROXY',
      label: 'No-proxy hosts (optional)',
      secret: false,
      required: false,
      hint: 'e.g. 127.0.0.1, localhost, yourdomain.com',
    },
  ],
},

// 12. Context7 MCP
{
  id: 'context',
  name: 'Context7 MCP',
  description:
    'Library documentation and code examples for AI-backed development',
  category: 'documentation',
  npmPackage: '@upstash/context7-mcp',
  command: 'npx',
  args: ['-y', '@upstash/context7-mcp', '--api-key', '${CONTEXT7_API_KEY}'],
  devOnly: false,
  nonDevOnly: false,
  requiresNetwork: true,
  docsUrl: 'https://github.com/upstash/context7',

  envVars: [
    {
      key: 'CONTEXT7_API_KEY',
      label: 'Context7 API Key',
      secret: true,
      required: true,
      hint: 'Get your free API key at upstash.com/context7',
    },
  ],
},

// 13. Figma MCP
{
  id: 'figma',
  name: 'Figma MCP',
  description: 'Read, describe and convert Figma design files',
  category: 'design',
  npmPackage: 'figma-scwebkit-mcp',
  command: 'npx',
  args: ['-y', 'figma-scwebkit-mcp'],
  devOnly: false,
  nonDevOnly: false,
  requiresNetwork: true,
  docsUrl: 'https://github.com/global-packages/figma-scwebkit-mcp',

  envVars: [
    {
      key: 'FIGMA_API_TOKEN',
      label: 'Figma API Token',
      secret: true,
      required: true,
      hint:
        'Figma → Account Settings → Personal access tokens → Generate new token',
    },
    {
      key: 'NPM_CONFIG_REGISTRY',
      label: 'NPM Registry URL (optional - leave blank for default)',
      secret: false,
      required: false,
      hint:
        'e.g. https://registry.npmjs.org or your private Artifactory registry',
    },
    {
      key: 'HTTP_PROXY',
      label: 'HTTP Proxy (optional)',
      secret: false,
      required: false,
      hint: 'e.g. http://proxy.yourdomain.com:443',
    },
    {
      key: 'HTTPS_PROXY',
      label: 'HTTPS Proxy (optional)',
      secret: false,
      required: false,
    },
    {
      key: 'NO_PROXY',
      label: 'No-proxy hosts (optional)',
      secret: false,
      required: false,
      hint: 'e.g. *.yourdomain.com, internal.domain.com',
    },
  ],
},

// 14. Everything / Project Search MCP
{
  id: 'everything',
  name: 'Everything MCP (Project Search)',
  description:
    'Universal search, file system access and development utilities via MCP everything server',
  category: 'filesystem',
  npmPackage: '@modelcontextprotocol/server-everything',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-everything'],
  devOnly: true,
  nonDevOnly: false,
  requiresNetwork: false,
  docsUrl:
    'https://github.com/modelcontextprotocol/servers/tree/main/src/everything',

  envVars: [],
},

// 15. GCP Cloud Run MCP
{
  id: 'gcp',
  name: 'GCP Cloud Run MCP',
  description:
    'Deploy and manage apps on Google Cloud Run; list services, get logs and manage GCP projects',
  category: 'cloud',
  npmPackage: '@google-cloud/cloud-run-mcp',
  command: 'npx',
  args: ['-y', '@google-cloud/cloud-run-mcp'],
  devOnly: false,
  nonDevOnly: false,
  requiresNetwork: true,
  docsUrl:
    'https://github.com/GoogleCloudPlatform/cloud-run-mcp',

  envVars: [
    {
      key: 'GOOGLE_CLOUD_PROJECT',
      label: 'GCP Project ID',
      secret: false,
      required: true,
      hint:
        'GCP Console → Select project → Copy Project ID from the top bar',
    },
    {
      key: 'GOOGLE_CLOUD_REGION',
      label: 'GCP Region (optional)',
      secret: false,
      required: false,
      defaultValue: 'us-central1',
      hint:
        'e.g. us-central1, europe-west1, asia-southeast1',
    },
  ],
},

// 16. AWS Core MCP
{
  id: 'aws',
  name: 'AWS Core MCP',
  description:
    'Manage AWS infrastructure and services using natural language via the awslabs core MCP server',
  category: 'cloud',
  npmPackage: 'awslabs-core-mcp-server',
  command: 'uvx',
  args: ['awslabs-core-mcp-server@latest'],
  devOnly: false,
  nonDevOnly: false,
  requiresNetwork: true,
  docsUrl:
    'https://github.com/awslabs/mcp/tree/main/src/core-mcp-server',

  envVars: [
    {
      key: 'AWS_REGION',
      label: 'AWS Region',
      secret: false,
      required: true,
      defaultValue: 'us-east-1',
      hint:
        'e.g. us-east-1, ap-southeast-1, eu-west-1',
    },
    {
      key: 'AWS_ACCESS_KEY_ID',
      label: 'AWS Access Key ID',
      secret: true,
      required: true,
      hint:
        'IAM Console → Users → Security credentials → Create access key',
    },
    {
      key: 'AWS_SECRET_ACCESS_KEY',
      label: 'AWS Secret Access Key',
      secret: true,
      required: true,
    },
    {
      key: 'AWS_SESSION_TOKEN',
      label:
        'AWS Session Token (optional - for SSO / STS temporary credentials)',
      secret: true,
      required: false,
      hint:
        'Leave blank for long-term IAM user keys; required for STS/SSO/Identity Center',
    },
    {
      key: 'FASTMCP_LOG_LEVEL',
      label: 'Log level (optional)',
      secret: false,
      required: false,
      defaultValue: 'ERROR',
      hint:
        'DEBUG | INFO | WARNING | ERROR - defaults to ERROR',
    },
  ],
},
];

export const DEV_MCP_IDS: string[] = [
  "azure",
  "everything",
  "gcp",
  "aws",
  "sonarqube",
  "context7",
  "figma",
  "confluence",
  "mssql",
  "playwright",
  "filesystem",
  "git",
  "azuredevops",
  "postgres",
  "runbook",
  "slack",
];

export const NON_DEV_MCP_IDS: string[] = [
  "azure",
  "gcp",
  "aws",  
  "figma",
  "confluence",
  "runbook",
  "azuredevops",
  "slack",
];

export const MCP_KIT_META_PATH = path.join(
  os.homedir(),
  ".mcp-kit",
  "meta.json",
);

export const MCP_KIT_DIR = path.join(os.homedir(), ".mcp-kit");

export const MCP_KIT_INSTALL_LOG= path.join(os.homedir(), ".mcp-kit,", "install-errors.log");

export const VSCODE_SEARCH_DEPTH = 5;
