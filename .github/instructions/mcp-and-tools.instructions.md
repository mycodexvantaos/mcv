# MCP Servers and Tools Instructions

## MCP Server Configuration

### Available MCP Servers

| Server | Purpose | Protocol | Status |
|--------|---------|----------|--------|
| GitHub | Repository ops, PRs, issues, Actions, code search | Built-in | Auto-detected |
| Cloudflare | Workers, D1, KV, R2, deployment management | Manual | Via `wrangler` |
| Genkit | AI model interaction, flow execution, tool testing | Manual | Via `genkit start` |
| Platform API | Internal service contracts, resource registry | Manual | Via contracts SDK |

### Configuration File Location

```
~/.copilot/mcp-config.json
```

### Example MCP Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "gh",
      "args": ["copilot", "mcp"],
      "env": {}
    },
    "cloudflare": {
      "command": "npx",
      "args": ["-y", "@cloudflare/mcp-server"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}"
      }
    },
    "genkit": {
      "command": "npx",
      "args": ["-y", "genkit", "mcp"],
      "env": {
        "GOOGLE_API_KEY": "${GOOGLE_API_KEY}"
      }
    }
  }
}
```

### Adding MCP Servers

```bash
# Interactive add
/mcp add

# View configured servers
/mcp

# Test server connection
/mcp test <server-name>
```

## Tool Permission Matrix

### Shell Commands

| Command Pattern | Permission | Notes |
|-----------------|------------|-------|
| `git status`, `git diff`, `git log` | ✅ Always allowed | Read-only Git |
| `git add`, `git commit` | ✅ Always allowed | Local changes |
| `git push` | ⚠️ Requires review | Check branch first |
| `git push --force` | ❌ Denied | Never allowed |
| `npm run typecheck` | ✅ Always allowed | Validation |
| `npm run build` | ✅ Always allowed | Build |
| `npm run format` | ✅ Always allowed | Formatting |
| `npm run format:check` | ✅ Always allowed | Validation |
| `npm run governance:check` | ✅ Always allowed | Governance |
| `npm run contracts:validate` | ✅ Always allowed | Contracts |
| `npm run test:*` | ✅ Always allowed | Testing |
| `npm run python:*` | ✅ Always allowed | Python validation |
| `npm run genkit:*` | ✅ Always allowed | AI development |
| `npm run dev` | ✅ Always allowed | Dev server |
| `npm run api:start` | ✅ Always allowed | API server |
| `npm run deploy` | ❌ Denied | Requires approval |
| `npm run upload` | ❌ Denied | Requires approval |
| `npm install <pkg>` | ⚠️ Requires review | New dependency |
| `rm <file>` | ⚠️ Requires review | Single file |
| `rm -rf` | ❌ Denied | Never allowed |
| `curl \| sh` | ❌ Denied | Never allowed |

### File Operations

| Operation | Permission | Notes |
|-----------|------------|-------|
| Read any file | ✅ Always allowed | Full read access |
| Write to `src/`, `packages/`, `services/` | ✅ Always allowed | Core development |
| Write to `modules/`, `python/`, `docs/` | ✅ Always allowed | Core development |
| Write to `tools/`, `schemas/`, `contracts/` | ✅ Always allowed | Core development |
| Write to `.github/agents/`, `.github/instructions/` | ✅ Always allowed | Agent config |
| Write to `.github/workflows/` | ⚠️ Requires review | CI/CD changes |
| Write to `infra/` | ⚠️ Requires review | Infrastructure |
| Write to `infra/secrets/` | ❌ Denied | Secrets |
| Delete files | ⚠️ Requires review | Destructive |

### MCP Tool Usage

| MCP Server | Tool | Permission |
|------------|------|------------|
| GitHub | `search_code` | ✅ Always allowed |
| GitHub | `get_file_contents` | ✅ Always allowed |
| GitHub | `list_issues` | ✅ Always allowed |
| GitHub | `get_pull_request` | ✅ Always allowed |
| GitHub | `create_pull_request` | ⚠️ Requires review |
| GitHub | `merge_pull_request` | ❌ Denied |
| Cloudflare | `list_workers` | ✅ Always allowed |
| Cloudflare | `get_worker` | ✅ Always allowed |
| Cloudflare | `deploy_worker` | ❌ Denied |
| Genkit | `run_flow` | ✅ Always allowed |
| Genkit | `list_flows` | ✅ Always allowed |

## Platform-Specific Tools

### Governance Tools

```bash
# Check governance compliance
npm run governance:check

# Validate contracts
npm run contracts:validate

# Check service catalog
npm run service-catalog:check

# Check resource model
npm run resource-model:check

# Verify migrations
npm run migration:verify:d1
npm run migration:verify:sqlite
```

### Release Tools

```bash
# Release candidate verification
npm run rc:verify

# Soak testing
npm run rc:soak

# Promotion evaluation
npm run release:promotion:evaluate

# Generate artifacts
npm run release:artifacts

# Generate SBOM
npm run release:sbom

# Generate and sign provenance
npm run release:provenance
npm run release:sign
```

### Python Tools

```bash
# Lint
npm run python:lint

# Type check
npm run python:typecheck

# Test
npm run python:test

# Dream worker dry run
npm run dream:dry-run
```

## Programmatic Usage (CI/CD)

```bash
# Safe automated typecheck and fix
copilot -p "Run typecheck and fix any errors" --allow-tool='shell(npm run typecheck)' --allow-tool='write'

# Code review automation
copilot -p "Review changes in current branch against main" --allow-tool='shell(git)'

# Automated documentation update
copilot -p "Update docs to reflect recent changes" --allow-tool='shell(git)' --allow-tool='write' --agent=docs

# Contract validation and fix
copilot -p "Validate contracts and fix any issues" --allow-tool='shell(npm run contracts:validate)' --allow-tool='write'
```

## Slash Commands Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/plan` | Enter plan mode | Complex multi-file changes |
| `/agent` | Select custom agent | Specialized tasks |
| `/model` | Switch AI model | Different capability needs |
| `/delegate` | Delegate to sub-agent | Independent subtasks |
| `/fleet` | Parallel sub-agents | Large-scale changes |
| `/mcp` | Manage MCP servers | Server configuration |
| `/compact` | Compress context | Context too large |
| `/context` | View token usage | Monitor context size |
| `/clear` | Clear session | New unrelated task |
| `/new` | Start new session | Fresh start |
| `/session` | View session info | Check state |
| `/review` | Request code review | Before PR |
| `/add-dir` | Add directory to context | Cross-repo work |
| `/cwd` | Change working directory | Navigate project |
