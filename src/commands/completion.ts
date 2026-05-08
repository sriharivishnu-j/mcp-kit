import { log } from "../utils/logger";

const ZSH_COMPLETION = `
# mcp-kit zsh completion
# Add to ~/.zshrc: eval "$(mcp-kit completion zsh)"

mcp_kit_completions() {
  local -a subcmds
  subcmds=(
    'init:Initialise MCP configuration'
    'add:Add a single MCP server'
    'remove:Remove a configured MCP server'
    'update:Update MCP server versions'
    'status:Show status of configured MCPs'
    'doctor:Run diagnostics on MCPs'
    'list:List available MCPs'
    'reset:Remove all configured MCPs'
    'export:Export mcp.json to a file'
    'import:Import an mcp.json file'
    'install:Pre-install MCP packages'
    'env:Environment variable commands'
    'validate:Validate mcp.json schema'
    'enable:Enable a disabled MCP'
    'disable:Disable an MCP without removing it'
    'info:Show details for an MCP'
    'open:Open mcp.json in VS Code'
    'backup:Back up mcp.json'
    'search:Search available MCPs'
    'completion:Print shell completion script'
  )
  _describe 'command' subcmds
}

compdef mcp_kit_completions mcp-kit
`.trimStart();

const BASH_COMPLETION = `
# mcp-kit bash completion
# Add to ~/.bashrc: eval "$(mcp-kit completion bash)"

mcp_kit_completions() {
  local MCP_IDS="azure confluence mssql playwright runbook filesystem git azuredevops postgres slack sonarqube context7 figma everything"
  local SUBCMDS="init add remove update status doctor list reset export import install env validate enable disable info open backup search completion"
  local cur prev
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  case "\${prev}" in
    add|remove|enable|disable|info)
      COMPREPLY=( $(compgen -W "\${MCP_IDS}" -- "\${cur}") )
      return ;;
  esac
  COMPREPLY=( $(compgen -W "\${SUBCMDS}" -- "\${cur}") )
}

complete -F mcp_kit_completions mcp-kit
`.trimStart();

export async function runCompletion(shell?: string): Promise<void> {
  try {
    const s = shell?.toLowerCase() ?? "zsh";

    if (s === "zsh") {
      process.stdout.write(ZSH_COMPLETION);
      return;
    }

    if (s === "bash") {
      process.stdout.write(BASH_COMPLETION);
      return;
    }

    log.error(`Unsupported shell: '${shell}'. Use 'zsh' or 'bash'.`);
    log.blank();
    log.info("Usage:");
    log.muted("  mcp-kit completion zsh   # zsh");
    log.muted("  mcp-kit completion bash  # bash");
    log.blank();
    log.muted("Then add to your shell profile:");
    log.muted('  echo \'eval "$(mcp-kit completion zsh)"\' >> ~/.zshrc && source ~/.zshrc');
    process.exit(1);
  } catch (err) {
    log.error(`completion failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    process.exit(1);
  }
}
