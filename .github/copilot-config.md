# Copilot CLI Configuration Reference

This file documents the recommended Copilot CLI configuration for this repository.

## Quick Start

```bash
# Navigate to the project root
cd mycodexvantaos

# Start Copilot CLI (interactive mode)
copilot

# Start with safe autopilot permissions
copilot --allow-tool='shell(git:*)' --allow-tool='shell(npm run:*)' --allow-tool='write' --deny-tool='shell(git push --force)' --deny-tool='shell(rm -rf)'

# Start with a specific agent
copilot --agent=mycodexvantaos-autopilot

# Start in plan mode for complex tasks
copilot
# Then press Shift+Tab to enter plan mode
```

## Session Management

```bash
# Resume last session
copilot --continue

# Resume a specific session
copilot --resume

# View session info (inside interactive mode)
/session

# Compact context manually
/compact

# View context usage
/context

# Clear session for new task
/clear
```

## Agent Invocation

```bash
# List available agents
/agent

# Use code review agent
copilot --agent=code-review --prompt "Review changes in current branch"

# Use refactoring agent
copilot --agent=refactor --prompt "Refactor src/components/Dashboard.tsx"

# Use documentation agent
copilot --agent=docs --prompt "Update README for the new auth flow"
```

## MCP Server Setup

```bash
# Add a new MCP server (interactive)
/mcp add

# View configured MCP servers
/mcp

# MCP config location: ~/.copilot/mcp-config.json
```

## File References in Prompts

```bash
# Reference specific files with @
Explain @src/ai/dev.ts
Fix the bug in @packages/mycodexvantaos-contracts-sdk/src/cli.ts

# Add additional directories
/add-dir /path/to/related/repo

# Change working directory
/cwd /path/to/directory
```

## Useful Slash Commands

| Command | Description |
|---------|-------------|
| `/plan` | Enter plan mode for current prompt |
| `/agent` | Select a custom agent |
| `/model` | Switch AI model |
| `/review` | Request code review |
| `/delegate` | Delegate task to cloud agent |
| `/fleet` | Run parallel sub-agents |
| `/mcp` | Manage MCP servers |
| `/compact` | Compress context |
| `/context` | View token usage |
| `/usage` | View session statistics |
| `/clear` | Clear session |
| `/new` | Start new session |
| `/session` | View session info |
| `/feedback` | Submit feedback |
| `/help` | Show help |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `COPILOT_HOME` | Override default config directory (`~/.copilot`) |
| `COPILOT_PROVIDER_BASE_URL` | Custom model provider endpoint |
| `COPILOT_PROVIDER_TYPE` | Provider type: `openai`, `azure`, `anthropic` |
| `COPILOT_PROVIDER_API_KEY` | API key for custom provider |
| `COPILOT_MODEL` | Override default model |

## Programmatic Usage (CI/CD)

```bash
# Automated code review in CI
copilot -p "Review the changes in this PR and report issues" --allow-tool='shell(git)' --allow-tool='shell(gh)'

# Automated test fixing
copilot -p "Run tests and fix any failures" --allow-tool='shell(npm run test)' --allow-tool='write'

# Automated documentation update
copilot -p "Update docs to reflect recent changes" --allow-tool='shell(git)' --allow-tool='write' --agent=docs
```
