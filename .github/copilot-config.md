# Copilot CLI Configuration Reference

## Quick Start

```bash
# Navigate to the project root
cd mycodexvantaos

# Interactive mode (all instructions auto-loaded)
copilot

# Safe Autopilot (recommended for daily work)
copilot --allow-tool='shell(git:*)' --allow-tool='shell(npm run:*)' --allow-tool='write' \
        --deny-tool='shell(rm -rf)' --deny-tool='shell(git push --force)' --deny-tool='shell(npm run deploy)'

# Full Autopilot (trusted environments only)
copilot --allow-all-tools --deny-tool='shell(rm -rf)' --deny-tool='shell(git push --force)' \
        --deny-tool='shell(npm run deploy)' --deny-tool='shell(npm run upload)'

# Specific agent
copilot --agent=mycodexvantaos-autopilot
copilot --agent=code-review --prompt "Review changes in current branch"
copilot --agent=refactor --prompt "Refactor src/components/Dashboard.tsx"
copilot --agent=docs --prompt "Update README for the new auth flow"

# Programmatic (CI/CD, non-interactive)
copilot -p "Run typecheck and fix errors" --allow-tool='shell(npm run typecheck)' --allow-tool='write'
```

## Configuration Files

| File                                     | Purpose                                  | Loaded        |
| ---------------------------------------- | ---------------------------------------- | ------------- |
| `.github/copilot-instructions.md`        | Build commands, code style, architecture | Always        |
| `AGENTS.md`                              | Autopilot behavior, permissions, hooks   | Always        |
| `Copilot.md`                             | Quick start, MCP, memory hints           | Always        |
| `CODEX.md`                               | OpenAI Codex agent instructions          | By Codex      |
| `.github/copilot/settings.json`          | Permissions and inline hooks             | Always        |
| `.github/hooks/quality-gates.json`       | Lifecycle quality hooks                  | Always        |
| `.github/hooks/security.json`            | Security preToolUse hooks                | Always        |
| `.github/agents/*.agent.md`              | Custom agent definitions                 | On invocation |
| `.github/instructions/*.instructions.md` | Modular instructions                     | Always        |
| `.github/skills/*.md`                    | Reusable skills                          | On demand     |
| `.agents/skills/*/SKILL.md`              | Platform skills                          | On demand     |
| `.agents/workflows/*.md`                 | Reusable workflows                       | On demand     |

## Session Management

```bash
# Resume last session
copilot --continue

# Resume specific session
copilot --resume

# Inside interactive mode:
/session         # View session info
/compact         # Compress context
/context         # View token usage
/clear           # Clear for new task
/new             # Start new session
```

## Agent Commands

```bash
# List available agents
/agent

# Agents in this repo:
# - mycodexvantaos-autopilot: Main autonomous agent
# - code-review: Specialized code review
# - refactor: Behavior-preserving refactoring
# - docs: Documentation maintenance
```

## MCP Server Management

```bash
# Add new MCP server
/mcp add

# View configured servers
/mcp

# Config: ~/.copilot/mcp-config.json
```

## File References

```bash
# Reference files with @
Explain @src/ai/dev.ts
Fix the bug in @packages/mycodexvantaos-contracts-sdk/src/cli.ts
Review @services/mycodexvantaos-ai-memory/src/index.ts

# Add directories
/add-dir /path/to/related/repo

# Change working directory
/cwd /path/to/directory
```

## Slash Commands

| Command     | Description                       |
| ----------- | --------------------------------- |
| `/plan`     | Enter plan mode for complex tasks |
| `/agent`    | Select a custom agent             |
| `/model`    | Switch AI model                   |
| `/review`   | Request code review               |
| `/delegate` | Delegate to sub-agent             |
| `/fleet`    | Run parallel sub-agents           |
| `/mcp`      | Manage MCP servers                |
| `/compact`  | Compress context                  |
| `/context`  | View token usage                  |
| `/usage`    | View session statistics           |
| `/clear`    | Clear session                     |
| `/new`      | Start new session                 |
| `/session`  | View session info                 |
| `/add-dir`  | Add directory to context          |
| `/cwd`      | Change working directory          |
| `/feedback` | Submit feedback                   |
| `/help`     | Show help                         |

## Environment Variables

| Variable                    | Description                                       |
| --------------------------- | ------------------------------------------------- |
| `COPILOT_HOME`              | Override config directory (default: `~/.copilot`) |
| `COPILOT_PROVIDER_BASE_URL` | Custom model provider endpoint                    |
| `COPILOT_PROVIDER_TYPE`     | Provider: `openai`, `azure`, `anthropic`          |
| `COPILOT_PROVIDER_API_KEY`  | API key for custom provider                       |
| `COPILOT_MODEL`             | Override default model                            |

## CI/CD Automation Examples

```bash
# Automated typecheck and fix
copilot -p "Run typecheck and fix any errors" \
  --allow-tool='shell(npm run typecheck)' --allow-tool='write'

# Automated code review
copilot -p "Review the changes in this PR and report issues" \
  --allow-tool='shell(git)' --allow-tool='shell(gh)' --agent=code-review

# Automated documentation
copilot -p "Update docs to reflect recent changes" \
  --allow-tool='shell(git)' --allow-tool='write' --agent=docs

# Automated governance fix
copilot -p "Fix governance check failures" \
  --allow-tool='shell(npm run governance:check)' --allow-tool='write'

# Contract validation and fix
copilot -p "Validate and fix contract issues" \
  --allow-tool='shell(npm run contracts:validate)' --allow-tool='write'

# Python lint fix
copilot -p "Fix Python linting issues" \
  --allow-tool='shell(npm run python:lint)' --allow-tool='write'
```

## Hooks Reference

### Hook Files

| File                               | Events                                                                                                   | Purpose             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------- |
| `.github/hooks/quality-gates.json` | sessionStart, preToolUse, postToolUse, agentStop, subagentStart, subagentStop, errorOccurred, sessionEnd | Quality enforcement |
| `.github/hooks/security.json`      | preToolUse, permissionRequest                                                                            | Security controls   |

### Hook Behavior Summary

| Event            | Action                                      |
| ---------------- | ------------------------------------------- |
| Session starts   | Load project conventions into context       |
| Before tool use  | Security check (block dangerous operations) |
| After tool use   | Track modifications, remind to typecheck    |
| Agent stops      | Run typecheck; block if errors found        |
| Sub-agent starts | Inject project conventions                  |
| Error occurs     | Log error, suggest alternatives             |
| Session ends     | Cleanup temporary files                     |

## Platform Validation Checklist

Before any PR or merge:

```bash
npm run typecheck          # TypeScript compilation
npm run format:check       # Code formatting
npm run governance:check   # Governance compliance
npm run contracts:validate # Contract validation
npm run test:services      # Service tests
npm run test:contracts     # Contract tests
```

For Python changes, also:

```bash
npm run python:lint        # Ruff linting
npm run python:typecheck   # Mypy type checking
npm run python:test        # Pytest
```
