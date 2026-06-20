# Copilot.md — Global Agent Configuration

## Identity

**MyCodeXvantaOS** is a Local-first, Provider-agnostic, Contract-driven full-stack application operating system deployed on Cloudflare via OpenNext, with AI capabilities powered by Google Genkit and a Python plane for specialized services.

## Quick Start

```bash
# Interactive mode (reads all instructions automatically)
copilot

# Safe Autopilot (recommended for daily work)
copilot --allow-tool='shell(git:*)' --allow-tool='shell(npm run:*)' --allow-tool='write' \
        --deny-tool='shell(rm -rf)' --deny-tool='shell(git push --force)' --deny-tool='shell(npm run deploy)'

# Full Autopilot (use with caution, for trusted environments)
copilot --allow-all-tools --deny-tool='shell(rm -rf)' --deny-tool='shell(git push --force)' \
        --deny-tool='shell(npm run deploy)' --deny-tool='shell(npm run upload)'

# Specific agent invocation
copilot --agent=mycodexvantaos-autopilot
copilot --agent=code-review --prompt "Review current branch against main"
copilot --agent=refactor --prompt "Refactor src/components/"
copilot --agent=docs --prompt "Update API documentation"

# Programmatic (CI/CD)
copilot -p "Run typecheck and fix errors" --allow-tool='shell(npm run typecheck)' --allow-tool='write'
```

## Configuration Files Map

| File | Purpose | Scope |
|------|---------|-------|
| `.github/copilot-instructions.md` | Build commands, code style, architecture | All sessions |
| `AGENTS.md` | Autopilot behavior, permissions, hooks, skills | All sessions |
| `Copilot.md` (this file) | Quick start, MCP, memory hints, launch commands | All sessions |
| `.github/copilot/settings.json` | Repository-level permissions and inline hooks | All sessions |
| `.github/agents/*.agent.md` | Custom agent definitions | Agent invocation |
| `.github/instructions/*.instructions.md` | Modular workflow instructions | All sessions |
| `.github/hooks/*.json` | Lifecycle hooks (quality gates, security) | All sessions |
| `.github/skills/*.md` | Reusable skill definitions | On demand |
| `.agents/skills/` | Platform-specific skills (Genkit, FBS export) | On demand |
| `.agents/workflows/` | Reusable workflows | On demand |

## MCP Server Integration

| Server | Purpose | Status | Configuration |
|--------|---------|--------|---------------|
| GitHub | Repository ops, PRs, issues, Actions | Built-in | Auto-detected |
| Cloudflare | Deployment, Workers, D1, KV | Manual | `wrangler` CLI |
| Genkit | AI model interaction, flows | Manual | `genkit start` |
| Custom API | Internal platform services | Manual | `packages/mycodexvantaos-contracts-sdk/` |

### Adding MCP Servers

```bash
# Interactive
/mcp add

# View configured servers
/mcp

# Config location: ~/.copilot/mcp-config.json
```

## Hooks Configuration

### Quality Gates (`.github/hooks/quality-gates.json`)

| Event | Action |
|-------|--------|
| `sessionStart` | Load project conventions automatically |
| `agentStop` | Run `npm run typecheck`; block if errors found |
| `postToolUse` | Track file modifications |
| `errorOccurred` | Log errors for debugging |
| `subagentStop` | Track sub-agent completion |
| `sessionEnd` | Cleanup |

### Security Controls (`.github/hooks/security.json`)

| Blocked Pattern | Reason |
|-----------------|--------|
| `rm -rf /`, `rm -rf *`, `rm -rf ~` | Dangerous recursive deletion |
| `git push --force` | History rewriting not allowed |
| Writing passwords/secrets/tokens to files | Credential exposure |
| `curl \| sh`, `curl \| bash` | Remote code execution |

### Inline Hooks (`.github/copilot/settings.json`)

Pre-configured permissions allow/deny list matching the AGENTS.md tool permissions.

## Memory Hints

Copilot should remember these facts about this repository:

### Technology
- Next.js with App Router, deployed on Cloudflare via OpenNext
- TypeScript strict mode enforced across ALL packages
- Google Genkit for AI (NOT LangChain, NOT OpenAI SDK directly)
- Python plane uses FastAPI + uv (NOT pip, NOT poetry)
- Tailwind CSS for styling
- Prettier for formatting

### Structure
- 70+ packages in `packages/`
- 20+ modules in `modules/`
- 40+ services in `services/`
- Python apps in `python/apps/`
- Schemas in `schemas/`
- Infrastructure in `infra/`

### Conventions
- Naming: `mycodexvantaos-<domain>-<capability>`
- Commits: conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`)
- Governance: machine-enforced, CI blocks non-compliant code
- Contracts: define before implement, validate with SDK
- Providers: abstract all external services behind interfaces

### Important Files
- `governance.json` — Platform governance rules and layer definitions
- `ARCHITECTURE.md` — Full architecture specification (Chinese)
- `SECURITY.md` — Security policy
- `skills-lock.json` — Locked skill versions
- `components.json` — Component registry

## Delegation Rules

When using `/delegate`:
- Always specify the target branch
- Include relevant file paths with `@` references
- Mention governance constraints if applicable
- Reference related issues or PRs
- Specify which layer the change affects

## Fleet Parallelization

When using `/fleet`:
- Maximum 5 parallel sub-agents
- Each works on independent modules/packages
- All must run `npm run typecheck` before completing
- Merge conflicts resolved by coordinating agent
- Each respects governance independently

## Model Selection Guide

| Task | Recommended Model | Reason |
|------|-------------------|--------|
| Complex architecture changes | Claude Opus 4.5 | Deep reasoning, multi-file understanding |
| Daily coding tasks | Claude Sonnet 4.5 | Fast, cost-effective |
| Code generation & review | GPT-5.2 Codex | Strong code generation |
| Auto (default) | Auto | Balances speed, cost, and capability |

## Security Boundaries

The agent MUST NOT:
- Access or modify `infra/secrets/` without explicit approval
- Run `npm run deploy` or `npm run upload` without user confirmation
- Modify `.github/workflows/` files without review
- Install packages from untrusted registries or URLs
- Execute arbitrary URLs or download scripts from the internet
- Expose environment variables or API keys in commits
- Bypass governance checks or disable hooks
- Force push to any branch
- Delete directories recursively without explicit approval
