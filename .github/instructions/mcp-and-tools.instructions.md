# MCP Servers and Tools Configuration

## Available MCP Servers

### GitHub MCP Server (Built-in)

The GitHub MCP server is automatically available and provides:

- Repository file operations
- Pull request creation and management
- Issue tracking and management
- Code search across repositories
- Actions workflow inspection

Usage example in prompts:
```
Use the GitHub MCP server to find good first issues for a new team member
```

### Cloudflare Integration

For deployment and Workers management, use the Cloudflare CLI (`wrangler`):

```bash
# Check deployment status
npx wrangler deployments list

# View Workers logs
npx wrangler tail
```

## Tool Permission Matrix

| Tool | Autopilot Allowed | Requires Approval | Denied |
|------|:-----------------:|:-----------------:|:------:|
| `git add` | ✓ | | |
| `git commit` | ✓ | | |
| `git branch` | ✓ | | |
| `git checkout` | ✓ | | |
| `git push` | | ✓ | |
| `git push --force` | | | ✓ |
| `npm run build` | ✓ | | |
| `npm run typecheck` | ✓ | | |
| `npm run format` | ✓ | | |
| `npm run deploy` | | | ✓ |
| `npm install` | | ✓ | |
| `rm` (single file) | | ✓ | |
| `rm -rf` | | | ✓ |
| File write | ✓ | | |

## Programmatic Usage

For CI/CD or automated scripts, use the programmatic interface:

```bash
# Safe automated task
copilot -p "Run typecheck and fix any errors" --allow-tool='shell(npm run typecheck)' --allow-tool='write'

# Code review automation
copilot -p "Review changes in current branch against main" --allow-tool='shell(git)'
```

## Custom Agent Invocation

To use the configured custom agent:

```bash
copilot
# Then in the interactive session:
# The agent will automatically follow the rules in .github/agents/my-agent.agent.md
```
