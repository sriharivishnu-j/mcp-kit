import { log } from '../utils/logger.js';

//
// mcp-kit completion [shell]
//

const ZSH_COMPLETION = `
# mcp-kit zsh completion
# Add to ~/.zshrc: eval "$(mcp-kit completion zsh)"

_mcp_kit_completions() {
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

_mcp_kit_mcpids() {
  local -a ids
  ids=(
    'azure' 'confluence' 'mssql' 'playwright' 'runbook'
    'filesystem' 'git' 'azuredevops' 'postgres' 'slack'
    'sonarqube' 'context' 'figma' 'everything'
  )
  _describe 'mcp-id' ids
}

_mcp_kit() {
  local -a args
  args=(\${words[@]})
  case "\${args[2]}" in
    add|remove|update|enable|disable|info)
      _mcp_kit_mcpids ;;
    *)
      _mcp_kit_completions ;;
  esac
}

compdef _mcp_kit mcp-kit
`.trimStart();

const BASH_COMPLETION = `
# mcp-kit bash completion
# Add to ~/.bashrc: eval "$(mcp-kit completion bash)"

_mcp_kit_completions() {
  local MCP_IDS="azure confluence mssql playwright runbook filesystem git azuredevops postgres slack sonarqube context figma everything"
  local SUBCMDS="init add remove update status doctor list reset export import install env validate enable disable info open backup search completion"
  local cur prev
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  case "\${prev}" in
    add|remove|update|enable|disable|info)
      COMPREPLY=(\$(compgen -W "\${MCP_IDS}" -- "\${cur}"))
      return ;;
  esac
  COMPREPLY=(\$(compgen -W "\${SUBCMDS}" -- "\${cur}"))
}

complete -F _mcp_kit_completions mcp-kit
`.trimStart();

export async function runCompletion(shell: string = 'zsh'): Promise<void> {
  const s = shell.toLowerCase();

  if (s === 'zsh') {
    process.stdout.write(ZSH_COMPLETION);
    return;
  }

  if (s === 'bash') {
    process.stdout.write(BASH_COMPLETION);
    return;
  }

  log.error(`Unsupported shell: "${shell}". Use 'zsh' or 'bash'.`);
  log.blank();
  log.info('Usage:');
  log.muted('  mcp-kit completion zsh   # zsh');
  log.muted('  mcp-kit completion bash  # bash');
  log.blank();
  log.muted('Then add to your shell profile:');
  log.muted(`  echo 'eval "$(mcp-kit completion zsh)"' >> ~/.zshrc && source ~/.zshrc`);
  process.exit(1);
}