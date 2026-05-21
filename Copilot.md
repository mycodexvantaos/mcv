# Copilot.md — Global Agent Configuration

## Identity

This repository is **mycodexvantaos** — a cloud-native platform built with Next.js, deployed on Cloudflare via OpenNext, with AI capabilities powered by Google Genkit.

## Autopilot Mode Configuration

When running in Autopilot mode (`--allow-all-tools` or `/yolo`), the following safety rules apply:

### Recommended Launch Command

```bash
copilot --allow-tool='shell(git:*)' --allow-tool='shell(npm run:*)' --allow-tool='write' --deny-tool='shell(rm -rf)' --deny-tool='shell(git push --force)'
```

### Safe Autopilot (Recommended)

```bash
copilot --allow-tool='shell(git)' --allow-tool='shell(npm run build)' --allow-tool='shell(npm run typecheck)' --allow-tool='shell(npm run format)' --allow-tool='shell(npm run governance:check)' --allow-tool='write'
```

### Full Autopilot (Use with caution)

```bash
copilot --allow-all-tools --deny-tool='shell(rm -rf)' --deny-tool='shell(git push --force)' --deny-tool='shell(npm run deploy)'
```

## MCP Server Integration

Configure the following MCP servers for enhanced capabilities:

| Server | Purpose | Configuration |
|--------|---------|---------------|
| GitHub | Repository operations, PR management, issue tracking | Built-in (auto-detected) |
| Cloudflare | Deployment status, Workers management | Configure via `wrangler` |
| Custom API | Internal platform services | See `packages/mycodexvantaos-contracts-sdk/` |

## Hooks Configuration

The following hooks should be configured for quality gates:

### Pre-commit Hook
```bash
npm run typecheck && npm run format:check
```

### Pre-push Hook
```bash
npm run governance:check && npm run contracts:validate
```

### Post-change Validation
```bash
npm run typecheck
```

## Memory Hints

Copilot should remember the following about this repository:

- The project uses **pnpm** as the package manager
- TypeScript strict mode is enforced across all packages
- The monorepo structure uses packages in `packages/`, services in `services/`, and infrastructure in `infra/`
- Governance checks must pass before any merge to `main`
- Cloudflare Workers are the deployment target (not Vercel or AWS)
- The AI layer uses Google Genkit (not LangChain or other frameworks)
- Conventional commits are required: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`

## Delegation Rules

When using `/delegate`, include these context hints:

- Always specify the target branch
- Include relevant file paths in the prompt
- Mention any governance constraints
- Reference related issues or PRs

## Fleet Parallelization

When using `/fleet` for parallel execution:

- Maximum 5 parallel sub-agents for this repository
- Each sub-agent should work on independent modules
- Merge conflicts should be resolved by the coordinating agent
- All sub-agents must run `npm run typecheck` before completing

## Security Boundaries

The agent MUST NOT:

- Access or modify files in `infra/secrets/` without explicit approval
- Run `npm run deploy` or `npm run upload` without user confirmation
- Modify `.github/workflows/` files without review
- Install packages from untrusted registries
- Execute arbitrary URLs or download scripts from the internet
- Expose environment variables or API keys in commits
