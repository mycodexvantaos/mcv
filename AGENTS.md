# AGENTS.md — Autonomous Agent Configuration

## Platform Context

MyCodeXvantaOS is a Local-first, Provider-agnostic, Contract-driven full-stack application operating system. This file configures autonomous agent behavior across all surfaces: GitHub Copilot CLI, Copilot Cloud Agent, and compatible AI coding agents.

## Architecture Invariants (MUST NOT VIOLATE)

1. **Local-first** — Never introduce external dependencies without a native fallback
2. **Provider-agnostic** — Never couple business logic directly to third-party SDKs
3. **Contract-first** — Define interfaces before implementation; validate with `npm run contracts:validate`
4. **Governance-enforced** — All rules are machine-enforced via `npm run governance:check`

## Autopilot Behavior

When operating in Autopilot mode, the agent MUST:

1. **Read project conventions first**: Load `.github/copilot-instructions.md`, `AGENTS.md`, and relevant `.agents/skills/` before starting work
2. **Always validate before committing**: Execute `npm run typecheck && npm run format:check`
3. **Follow Explore → Plan → Code → Validate → Commit** for non-trivial changes
4. **Create feature branches** for new work; never commit directly to `main`
5. **Write descriptive commit messages** using conventional commits format
6. **Run governance checks** (`npm run governance:check`) before finalizing changes
7. **Validate contracts** (`npm run contracts:validate`) when modifying service interfaces
8. **Respect naming conventions**: `mycodexvantaos-<domain>-<capability>` for all new services/packages
9. **Respect layer boundaries**: Do not create circular dependencies between layers

## Tool Permissions

### Pre-approved (Autopilot Safe)

```
shell(git:*)                        — All Git commands (except force push)
shell(npm run build)                — Build
shell(npm run typecheck)            — TypeScript validation
shell(npm run lint)                 — Linting
shell(npm run format:*)             — Code formatting
shell(npm run validate:*)           — Validation scripts
shell(npm run governance:check)     — Governance checks
shell(npm run contracts:validate)   — Contract validation
shell(npm run test:*)               — All test commands
shell(npm run python:*)             — Python plane commands
shell(npm run genkit:*)             — Genkit development
shell(npm run rc:verify)            — Release candidate verification
shell(npm run api:start)            — API server start
write                               — File write operations
```

### Require Confirmation

```
shell(git push)                     — Push to remote (review branch first)
shell(npm install)                  — Install new dependencies
shell(npm run migration:*)          — Database migrations
shell(rm)                           — File deletion (single files)
```

### Denied (NEVER execute autonomously)

```
shell(git push --force)             — Force push
shell(rm -rf)                       — Recursive deletion
shell(npm run deploy)               — Production deployment
shell(npm run upload)               — Upload to Cloudflare
shell(curl * | sh)                  — Remote script execution
shell(curl * | bash)                — Remote script execution
```

## Hooks Integration

Quality gates and security controls are enforced via hooks:

| File | Purpose |
|------|---------|
| `.github/hooks/quality-gates.json` | Lifecycle hooks: sessionStart, agentStop (typecheck gate), errorOccurred |
| `.github/hooks/security.json` | preToolUse security: blocks rm -rf, force push, secrets exposure, curl\|sh |
| `.github/copilot/settings.json` | Repository-level permissions and inline hooks |

### Hook Events Active

| Event | Behavior |
|-------|----------|
| `sessionStart` | Auto-load project conventions |
| `preToolUse` | Security validation before every tool execution |
| `postToolUse` | Track file modifications |
| `agentStop` | Run typecheck; block completion if errors found |
| `subagentStop` | Track sub-agent completion |
| `errorOccurred` | Log errors for debugging |
| `sessionEnd` | Session cleanup |

## Custom Agents

### Repository-Level Agents (`.github/agents/`)

| Agent | File | Purpose | Invocation |
|-------|------|---------|------------|
| mycodexvantaos-autopilot | `my-agent.agent.md` | Main autonomous coding agent | `copilot --agent=mycodexvantaos-autopilot` |
| code-review | `code-review.agent.md` | Bug, security, performance review | `copilot --agent=code-review` |
| refactor | `refactor.agent.md` | Behavior-preserving refactoring | `copilot --agent=refactor` |
| docs | `docs.agent.md` | Documentation maintenance | `copilot --agent=docs` |

### Built-in Sub-Agents (Auto-delegated)

| Agent | Purpose |
|-------|---------|
| Explorer | Quick codebase analysis without polluting main context |
| Task | Execute commands (build, test) with summarized output |
| General Purpose | Complex multi-step tasks in separate context |
| Code Review | Focus on real issues, minimize noise |
| Research | Deep research across codebase and web |
| Rubber Duck | Constructive criticism for complex decisions |

## Skills Integration

### Platform Skills (`.agents/skills/`)

| Skill | Path | Purpose |
|-------|------|---------|
| Genkit JS | `.agents/skills/developing-genkit-js/` | AI development with Genkit (Node.js/TypeScript) |
| FBS to AGY Export | `.agents/skills/fbs-to-agy-export/` | Firebase Studio project export to Antigravity |

### Copilot Skills (`.github/skills/`)

| Skill | File | Purpose |
|-------|------|---------|
| Platform Deploy | `platform-deploy.md` | Cloudflare deployment workflow |
| Feature Development | `feature-development.md` | Standard feature development lifecycle |

### Workflows (`.agents/workflows/`)

| Workflow | File | Purpose |
|----------|------|---------|
| FBS Export | `fbs-to-agy-export.md` | Firebase Studio export workflow |

## Plan Mode Guidelines

### Use Plan Mode For

- Multi-file changes spanning multiple packages/services
- New feature implementation
- Refactoring across modules
- Architecture changes
- New service/package creation
- Cross-layer modifications

### Skip Plan Mode For

- Single-file bug fixes
- Formatting changes
- Documentation typos
- Simple dependency updates
- Adding JSDoc comments

### Plan Workflow

1. Analyze current codebase state and affected modules
2. Ask clarifying questions if requirements are ambiguous
3. Verify changes respect architecture invariants
4. Produce structured plan with checkboxes in `plan.md`
5. Wait for user approval before implementing

## Code Generation Standards

When generating code, the agent MUST:

- Use TypeScript with strict mode enabled
- Follow existing patterns in the codebase
- Add appropriate error handling with typed errors
- Include JSDoc comments for exported functions and types
- Ensure new code passes `npm run typecheck` without errors
- Follow the Provider abstraction pattern for external services
- Define contracts before implementation
- Use existing project dependencies; justify new ones
- Follow naming convention: `mycodexvantaos-<domain>-<capability>`
- Place new services in `services/`, packages in `packages/`, modules in `modules/`

## Cross-Module Coordination

### When Modifying Packages

1. Check which services/modules depend on the package
2. Ensure backward compatibility or update all consumers
3. Run `npm run contracts:validate` if the package defines contracts
4. Run `npm run test:contracts` for contract changes

### When Creating New Services

1. Follow naming: `mycodexvantaos-<domain>-<capability>`
2. Define contracts first in `packages/mycodexvantaos-contracts-sdk/`
3. Create service directory in `services/`
4. Add to governance.json if it introduces new capabilities
5. Run `npm run governance:check` to verify compliance

### When Modifying AI Layer

1. Reference `.agents/skills/developing-genkit-js/` for Genkit patterns
2. Use `genkit docs:read` for current API (knowledge may be outdated)
3. Test with `npm run genkit:dev`
4. Minimum Genkit CLI version: 1.29.0

### When Modifying Python Plane

1. Use `uv` for dependency management
2. Run `npm run python:lint` for linting
3. Run `npm run python:typecheck` for type checking
4. Run `npm run python:test` for tests
5. CI Repair Agent has its own workflow: `.github/workflows/ci-repair-agent.yml`

## Delegation Guidelines

### Use `/delegate` For

- Documentation updates that don't affect code
- Dependency version bumps with no breaking changes
- Adding test coverage for existing code
- Formatting or linting fixes across multiple files
- Updating changelog entries

### Keep Local For

- Core feature development
- Debugging and investigation
- Interactive architecture decisions
- Security-sensitive changes
- Contract modifications
- Governance rule changes

## Fleet (Parallel Execution)

### Use `/fleet` For

- Large-scale refactoring across many files
- Bulk test generation for services
- Cross-module dependency updates
- Code style migrations
- Documentation generation across packages

### Fleet Constraints

- Maximum 5 parallel sub-agents
- Each sub-agent works on independent modules/packages
- All sub-agents must run `npm run typecheck` before completing
- Merge conflicts resolved by coordinating agent
- Each sub-agent respects governance rules independently

## Error Recovery

1. Attempt to fix using available context and error messages
2. If fix requires architectural decisions, pause and ask for guidance
3. Never suppress or ignore type errors or test failures
4. Never bypass governance checks
5. Log all attempted fixes in commit messages for traceability
6. If a hook blocks completion, fix the underlying issue (don't disable the hook)

## Session Management

- Use `/compact` if context becomes too large
- Use `/clear` between unrelated tasks
- Use `/resume` or `copilot --continue` to resume previous sessions
- Save important findings to session files for reference
- Use `@filepath` to reference specific files in prompts
