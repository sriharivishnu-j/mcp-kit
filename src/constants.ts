import os from "node:os";
import path from "node:path";
import { McpDefinition } from "./types";

export const MCP_REGISTRY: McpDefinition[] = [
  {
    id: "azure",
    name: "Azure MCP",
    description: "Query and manage Azure resources, resource groups, subscriptions and services",
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
        hint: "Azure Portal → Subscriptions → copy Subscription ID"
      },
      {
        key: "AZURE_TENANT_ID",
        label: "Azure Tenant ID (optional)",
        secret: false,
        required: false,
        hint: "Azure Portal → Azure Active Directory → Tenant ID"
      },
      {
        key: "AZURE_CLIENT_ID",
        label: "Azure Client ID (optional, for service principal)",
        secret: false,
        required: false
      },
      {
        key: "AZURE_CLIENT_SECRET",
        label: "Azure Client Secret (optional, for service principal)",
        secret: true,
        required: false
      }
    ]
  },
  {
    id: "confluence",
    name: "Confluence MCP",
    description: "Search and read Confluence pages, spaces and documentation",
    category: "documentation",
    npmPackage: "@global-packages/confluence-mcp",
    command: "npx",
    args: ["-y", "@global-packages/confluence-mcp"],
    devOnly: false,
    nonDevOnly: false,
    requiresNetwork: true,
    docsUrl: "https://github.com/global-packages/confluence-mcp",
    healthCheckUrl: "https://www.atlassian.com",
    envVars: [
      {
        key: "CONFLUENCE_URL",
        label: "Confluence Base URL",
        secret: false,
        required: true,
        hint: "e.g. https://yourcompany.atlassian.net"
      },
      {
        key: "CONFLUENCE_TOKEN",
        label: "Confluence API Token",
        secret: true,
        required: true,
        hint: "Atlassian Account → Security → API Tokens → Create token"
      },
      {
        key: "CONFLUENCE_EMAIL",
        label: "Atlassian Account Email",
        secret: false,
        required: true,
        hint: "Email you use to log into Confluence"
      },
      {
        key: "CONFLUENCE_SPACE",
        label: "Confluence Space Key (optional)",
        secret: false,
        required: false,
        hint: "e.g. OPS, ENGG, DEV — leave blank to search all spaces"
      }
    ]
  },
  {
    id: "mssql",
    name: "MSSQL MCP",
    description: "Query Microsoft SQL Server and Azure SQL databases",
    category: "database",
    npmPackage: "mssql-mcp",
    command: "npx",
    args: ["-y", "mssql-mcp"],
    devOnly: true,
    nonDevOnly: false,
    requiresNetwork: true,
    docsUrl: "https://github.com/dambakk/mssql-mcp",
    healthCheckUrl: "https://www.microsoft.com",
    envVars: [
      {
        key: "MSSQL_CONNECTION_STRING",
        label: "MSSQL Connection String",
        secret: true,
        required: false,
        hint: "Server=myserver;Database=mydb;User Id=sa;Password=xxxx;"
      },
      {
        key: "MSSQL_SERVER",
        label: "MSSQL Server Host (alternative to connection string)",
        secret: false,
        required: false,
        hint: "e.g. myserver.database.windows.net"
      },
      {
        key: "MSSQL_DATABASE",
        label: "Database Name",
        secret: false,
        required: false
      },
      {
        key: "MSSQL_USER",
        label: "Database Username",
        secret: false,
        required: false
      },
      {
        key: "MSSQL_PASSWORD",
        label: "Database Password",
        secret: true,
        required: false
      }
    ]
  },
  {
    id: "playwright",
    name: "Playwright MCP",
    description: "Browser automation, web scraping and end-to-end testing",
    category: "testing",
    npmPackage: "@playwright/mcp",
    command: "npx",
    args: ["@playwright/mcp@latest"],
    devOnly: true,
    nonDevOnly: false,
    requiresNetwork: false,
    docsUrl: "https://github.com/microsoft/playwright-mcp",
    envVars: []
  },
  {
    id: "runbook",
    name: "Runbook MCP",
    description: "Incident runbook automation across GitHub, ADO, Confluence, Notion",
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
        hint: "GitHub → Settings → Developer Settings → Personal Access Tokens"
      },
      {
        key: "GITHUB_REPO",
        label: "GitHub Repo containing runbooks (org/repo)",
        secret: false,
        required: false,
        hint: "e.g. my-org/runbooks"
      },
      {
        key: "ADO_TOKEN",
        label: "Azure DevOps PAT (if runbooks are in ADO Wiki)",
        secret: true,
        required: false,
        hint: "ADO → User Settings → Personal Access Tokens"
      },
      {
        key: "ADO_ORG",
        label: "Azure DevOps Organization",
        secret: false,
        required: false
      },
      {
        key: "ADO_PROJECT",
        label: "Azure DevOps Project",
        secret: false,
        required: false
      }
    ]
  },
  {
    id: "filesystem",
    name: "Filesystem MCP",
    description: "Read, write and navigate local files and directories",
    category: "filesystem",
    npmPackage: "@modelcontextprotocol/server-filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem"],
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
        hint: "e.g. /Users/yourname/projects or C:\\Projects"
      }
    ]
  },
  {
    id: "git",
    name: "Git MCP",
    description: "Query git history, branches, commits and diffs",
    category: "versioncontrol",
    npmPackage: "@modelcontextprotocol/server-git",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-git"],
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
        hint: "e.g. /Users/yourname/projects/my-app"
      }
    ]
  },
  {
    id: "azuredevops",
    name: "Azure DevOps MCP",
    description: "Query ADO work items, pipelines, repos and pull requests",
    category: "devops",
    npmPackage: "@azure-devops/mcp",
    command: "npx",
    args: ["-y", "@azure-devops/mcp"],
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
        hint: "ADO → User Settings (top right) → Personal Access Tokens"
      },
      {
        key: "ADO_ORG",
        label: "Azure DevOps Organization Name",
        secret: false,
        required: true,
        hint: "e.g. mycompany (from dev.azure.com/mycompany)"
      },
      {
        key: "ADO_PROJECT",
        label: "Azure DevOps Project Name",
        secret: false,
        required: true
      }
    ]
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
        hint: "postgresql://user:password@host:5432/dbname"
      }
    ]
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
        hint: "Slack API → Your App → OAuth & Permissions → Bot User OAuth Token"
      },
      {
        key: "SLACK_TEAM_ID",
        label: "Slack Team/Workspace ID",
        secret: false,
        required: true,
        hint: "Slack → Workspace Settings → bottom of page"
      }
    ]
  }
];

export const DEV_MCP_IDS: string[] = [
  "azure",
  "confluence",
  "mssql",
  "playwright",
  "filesystem",
  "git",
  "azuredevops",
  "postgres",
  "runbook",
  "slack"
];

export const NON_DEV_MCP_IDS: string[] = ["azure", "confluence", "runbook", "azuredevops", "slack"];

export const MCP_KIT_META_PATH = path.join(os.homedir(), ".mcp-kit", "meta.json");

export const VSCODE_SEARCH_DEPTH = 5;
