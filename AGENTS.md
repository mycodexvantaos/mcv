# AGENTS.md — Autopilot Configuration

## Overview

This file configures autonomous agent behavior (Autopilot mode) for GitHub Copilot CLI and compatible AI coding agents working in this repository. When Autopilot mode is enabled, the agent can work autonomously on tasks without requiring step-by-step approval.

## Autopilot Behavior

When operating in Autopilot mode, the agent MUST:

1. **Always run validation before committing**: Execute `npm run typecheck` and `npm run format:check` to ensure code quality.
2. **Follow the Explore → Plan → Code → Commit workflow** for any non-trivial changes.
3. **Create feature branches** for new work; never commit directly to `main`.
4. **Write descriptive commit messages** using conventional commits format.
5. **Run governance checks** (`npm run governance:check`) before finalizing changes.
6. **Respect existing architecture** — do not restructure directories or rename core modules without explicit instruction.

## Allowed Tools (Autopilot Permissions)

The following tools are pre-approved for autonomous execution:

```
shell(git:*)              — All Git commands (except force push)
shell(npm run build:*)    — All build scripts
shell(npm run lint:*)     — All lint scripts
shell(npm run typecheck)  — TypeScript validation
shell(npm run format:*)   — Code formatting
shell(npm run validate:*) — Validation scripts
shell(npm run governance:check) — Governance checks
shell(npm run contracts:validate) — Contract validation
write                     — File write operations
```

### Restricted Tools (Require Confirmation)

The following actions MUST NOT be performed without explicit user approval:

- `git push --force` — Force pushing to any branch
- `npm run deploy` — Production deployment
- `npm run upload` — Upload to Cloudflare
- `rm -rf` — Recursive deletion
- Deleting files or directories outside of generated/temporary paths
- Modifying CI/CD workflow files (`.github/workflows/`)
- Changing environment variables or secrets configuration
- Installing packages from URLs or untrusted sources
- Running `curl | sh` or similar patterns

## Hooks Integration

This repository uses Copilot hooks for automated quality gates and security controls:

- **`.github/hooks/quality-gates.json`** — Enforces typecheck on agent stop, logs errors, and provides session lifecycle hooks
- **`.github/hooks/security.json`** — Blocks dangerous operations (force push, rm -rf, secret exposure, remote script execution)
- **`.github/copilot/settings.json`** — Repository-level permissions and inline hooks

### Hook Events Used

| Event | Purpose |
|-------|---------|
| `sessionStart` | Load project conventions at session start |
| `preToolUse` | Security checks before tool execution |
| `postToolUse` | Track file modifications |
| `agentStop` | Run typecheck before agent completes |
| `errorOccurred` | Log errors for debugging |
| `sessionEnd` | Session cleanup |
| `subagentStop` | Track sub-agent completion |

## Plan Mode Guidelines

For complex tasks, the agent SHOULD use Plan mode:

- **Use Plan mode for**: Multi-file changes, new feature implementation, refactoring across modules, architecture changes
- **Skip Plan mode for**: Single-file bug fixes, formatting changes, documentation typos, simple dependency updates

When creating a plan, the agent should:
1. Analyze the current codebase state
2. Ask clarifying questions if requirements are ambiguous
3. Produce a structured plan with checkboxes in `plan.md`
4. Wait for user approval before implementing

## Code Generation Standards

When generating code, the agent MUST:

- Use TypeScript with strict mode enabled
- Follow existing patterns in the codebase
- Add appropriate error handling
- Include JSDoc comments for exported functions and types
- Ensure new code passes `npm run typecheck` without errors
- Use the existing project dependencies; do not add new dependencies without justification

## Custom Agents

This repository includes specialized agents in `.github/agents/`:

| Agent | File | Purpose |
|-------|------|---------|
| mycodexvantaos-autopilot | `my-agent.agent.md` | Main autonomous coding agent |
| code-review | `code-review.agent.md` | Specialized code review |
| refactor | `refactor.agent.md` | Behavior-preserving refactoring |
| docs | `docs.agent.md` | Documentation maintenance |

### Invoking Agents

```bash
# Interactive selection
/agent

# Direct invocation
copilot --agent=code-review --prompt "Review current branch"
copilot --agent=refactor --prompt "Refactor src/components/"
copilot --agent=docs --prompt "Update API documentation"
```

## Multi-Repository Context

This repository is part of the mycodexvantaos platform ecosystem. Related repositories:

- `mycodexvantaos-base/mycodexvantaos` — Base/upstream repository

When working across repositories, coordinate changes to maintain compatibility.

## Delegation Guidelines

Use `/delegate` for:
- Documentation updates that don't affect code
- Dependency version bumps with no breaking changes
- Adding test coverage for existing code
- Formatting or linting fixes across multiple files

Keep local for:
- Core feature development
- Debugging and investigation
- Interactive architecture decisions
- Security-sensitive changes

## Fleet (Parallel Execution)

Use `/fleet` for:
- Large-scale refactoring across many files
- Bulk test generation
- Cross-module dependency updates
- Code style migrations

## Error Recovery

If the agent encounters errors during autonomous execution:

1. Attempt to fix the error using available context
2. If the fix requires architectural decisions, pause and ask for guidance
3. Never suppress or ignore type errors or test failures
4. Log all attempted fixes in commit messages for traceability
