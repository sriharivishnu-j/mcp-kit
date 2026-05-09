# 🚀 @global-packages/mcp-kit

> **Zero-friction MCP setup for VS Code** — works seamlessly on Windows, macOS, and Linux.

---

## 📦 Install

```bash
npm install -g @global-packages/mcp-kit
```

## ⚡ Quick Start

```bash
mcp-kit install
mcp-kit init --dev     # For developers
mcp-kit init --non-dev # For non-developers
```

## ✨ What It Does

- **Auto-detects** your `.vscode` folder across project and OS paths.
- **Configures** a wide range of MCPs (Azure, AWS, GCP, Confluence, MSSQL, Playwright, ADO, and more).
- **Stores credentials** securely in your system keychain, `.env`, or inline.
- **Works for everyone**: tailored setups for both technical and non-technical employees.

## 🛠️ All Commands

| Command | Description |
|---------|-------------|
| `mcp-kit install` | Pre-download all MCP packages |
| `mcp-kit init --dev` | Configure developer MCPs |
| `mcp-kit init --non-dev` | Configure non-developer MCPs |
| `mcp-kit status` | Show configured MCPs |
| `mcp-kit add <id>` | Add a single MCP |
| `mcp-kit remove <id>` | Remove an MCP |
| `mcp-kit update` | Update to latest versions |
| `mcp-kit doctor` | Diagnose all issues |
| `mcp-kit list` | List configured MCPs |
| `mcp-kit list --available` | List all available MCPs |
| `mcp-kit reset` | Wipe all configuration |
| `mcp-kit export` | Export config for teammates |
| `mcp-kit import <file>` | Import shared config |

## 🔌 Supported MCPs

| ID | Name | Category | For | Description |
|----|------|----------|-----|-------------|
| `azure` | Azure MCP | cloud | all | Query and manage Azure resources |
| `aws` | AWS Core MCP | cloud | all | Manage AWS infrastructure via awslabs core |
| `gcp` | GCP Cloud Run MCP | cloud | all | Deploy and manage apps on Google Cloud Run |
| `confluence` | Confluence MCP | documentation | all | Search and read Confluence pages and spaces |
| `context7` | Context7 MCP | documentation | all | Library documentation and code examples |
| `mssql` | MSSQL MCP | database | dev | Query Microsoft SQL Server and Azure SQL |
| `postgres` | PostgreSQL MCP | database | dev | Query PostgreSQL databases |
| `playwright` | Playwright MCP | testing | dev | Browser automation and end-to-end testing |
| `runbook` | Runbook MCP | incident | all | Incident runbook automation (GitHub, ADO, etc.) |
| `filesystem` | Filesystem MCP | filesystem | dev | Read, write and navigate local files |
| `everything` | Everything MCP | filesystem | dev | Universal search and development utilities |
| `git` | Git MCP | versioncontrol | dev | Query git history, branches, and diffs |
| `azuredevops` | Azure DevOps MCP | devops | all | Query ADO work items, pipelines, and repos |
| `slack` | Slack MCP | productivity | all | Read Slack messages and send notifications |
| `sonarqube` | SonarQube MCP | codeanalysis | dev | Code quality and security analysis |
| `figma` | Figma MCP | design | all | Read, describe and convert Figma design files |
| `notion` | Notion MCP | productivity | all | Read and write Notion pages, databases, and blocks |
| `gmail` | Gmail MCP | productivity | all | Read emails, send messages, and manage your Gmail inbox |
| `outlook` | Outlook MCP | productivity | all | Read emails and manage your Microsoft Outlook inbox |
| `google-calendar` | Google Calendar MCP | productivity | all | Schedule awareness and calendar management directly in your IDE |
| `teams` | Microsoft Teams MCP | productivity | all | Interact with Microsoft Teams channels and messages |
| `jira` | Jira MCP | productivity | all | Manage issues, sprints, and projects in Jira |
| `docker` | Docker MCP | devops | dev | Manage containers, images, compose — without leaving your IDE |
| `kubernetes` | Kubernetes MCP | devops | dev | Logs, pods, and deployments for Kubernetes (k8s) |
| `github` | GitHub MCP | versioncontrol | dev | Manage PRs, issues, Actions, and releases in GitHub |
| `sentry` | Sentry MCP | codeanalysis | dev | Error tracking and production issue debugging with full context |
| `datadog` | Datadog MCP | cloud | dev | Pull observability metrics, logs, and alerts into your workflow |
| `mongodb` | MongoDB MCP | database | dev | Query and analyze MongoDB databases |
| `redis` | Redis MCP | database | dev | Cache inspection, key browsing, and debugging for Redis |
| `mysql` | MySQL MCP | database | dev | Read schemas and query MySQL databases securely |

## 🧠 .vscode Detection Logic

`mcp-kit` resolves the target path intelligently:

1. Walks up parent directories from the current working directory looking for `.vscode`.
2. Falls back to the global VS Code User path for your OS:
   - **Windows:** `%APPDATA%\Code\User`
   - **macOS:** `~/Library/Application Support/Code/User`
   - **Linux:** `~/.config/Code/User`
3. Creates `.vscode` in the current working directory if none exists.

## 🔐 Credential Storage

`mcp-kit` supports 3 secure storage strategies:

1. `keychain` **(Recommended)**: Uses the system keychain / credential manager.
2. `dotenv`: Writes values into `.env` and references `${env:KEY}` in `mcp.json`.
3. `inline`: Writes raw values directly into `mcp.json` (not recommended for shared repos).

> **Note:** For shared repositories, keychain is strongly recommended.

## 🧑‍💻 Adding to Registry

The MCP extension point is `src/constants.ts`. To add a new MCP:

1. Add an `McpDefinition` object to `MCP_REGISTRY`.
2. Add the MCP id to `DEV_MCP_IDS` or `NON_DEV_MCP_IDS`.

All commands and prompts read dynamically from these constants!

## 🤝 Contributing

**This project is public and community-driven!** 

If anyone wants to add new MCPs, suggest improvements, fix bugs, or do something else, please feel free to raise a PR. Let's make this tool next level together!


## 📄 License

MIT
