# @global-packages/mcp-kit

> Zero-friction MCP setup for VS Code — works on Windows, macOS and Linux

## Install

npm install -g @global-packages/mcp-kit

## Quick Start

mcp-kit install
mcp-kit init --dev # for developers
mcp-kit init --non-dev # for non-developers

## What It Does

- Auto-detects your .vscode folder across project and OS paths
- Configures Azure, Confluence, MSSQL, Playwright, ADO and more
- Stores credentials in your system keychain, .env, or inline
- Works for developers and non-technical employees alike

## All Commands

| Command | Description |
|---------|-------------|
| mcp-kit install | Pre-download all MCP packages |
| mcp-kit init --dev | Configure developer MCPs |
| mcp-kit init --non-dev | Configure non-developer MCPs |
| mcp-kit status | Show configured MCPs |
| mcp-kit add <id> | Add a single MCP |
| mcp-kit remove <id> | Remove an MCP |
| mcp-kit update | Update to latest versions |
| mcp-kit doctor | Diagnose all issues |
| mcp-kit list | List configured MCPs |
| mcp-kit list --available | List all available MCPs |
| mcp-kit reset | Wipe all configuration |
| mcp-kit export | Export config for teammates |
| mcp-kit import <file> | Import shared config |

## Supported MCPs

| ID | Name | For | Category |
|----|------|-----|----------|
| azure | Azure MCP | all | cloud |
| confluence | Confluence MCP | all | documentation |
| mssql | MSSQL MCP | dev | database |
| playwright | Playwright MCP | dev | testing |
| runbook | Runbook MCP | all | incident |
| filesystem | Filesystem MCP | dev | filesystem |
| git | Git MCP | dev | versioncontrol |
| azuredevops | Azure DevOps MCP | all | devops |
| postgres | PostgreSQL MCP | dev | database |
| slack | Slack MCP | all | productivity |

## .vscode Detection Logic

mcp-kit resolves the target path in this order:

1. Walks up parent directories from current working directory looking for `.vscode`.
2. Falls back to global VS Code User path for your OS.
3. Creates `.vscode` in the current working directory if none exists.

OS global config paths:

- Windows: `%APPDATA%\\Code\\User`
- macOS: `~/Library/Application Support/Code/User`
- Linux: `~/.config/Code/User`

## Credential Storage

mcp-kit supports 3 secure storage strategies:

1. `keychain` (recommended): Uses system keychain / credential manager.
2. `dotenv`: Writes values into `.env` and references `${env:KEY}` in `mcp.json`.
3. `inline`: Writes raw values directly into `mcp.json` (not recommended for shared repos).

For shared repositories, keychain is strongly recommended.

## Adding to Registry

The MCP extension point is `src/constants.ts`.

To add a new MCP:

1. Add one `McpDefinition` object to `MCP_REGISTRY`.
2. Add the MCP id to `DEV_MCP_IDS` or `NON_DEV_MCP_IDS`.

All commands and prompts read dynamically from these constants.

## Publishing

npm login
npm version patch
npm run build
npm publish --access public

## License: MIT
