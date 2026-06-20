# AGENTS.md — AI Context Governance & Navigation Enforcement

This document defines the behavioral norms for autonomous agents within the **MyCodexVantaOS** ecosystem, focusing on AI context, navigation, and **Document-Driven Development (DDD)**.

## Platform Identity

MyCodeXvantaOS is a Local-first, Provider-agnostic, Contract-driven full-stack application operating system. It can complete generation, execution, validation, publishing, and rollback with zero external dependencies.

## Architecture Invariants (MUST NOT VIOLATE)

All code changes MUST respect these four core principles:

1.  **Local-first** — Never introduce external dependencies without a native fallback
2.  **Provider-agnostic** — Never couple business logic directly to third-party SDKs
3.  **Contract-first** — Define interfaces before implementation; validate with `npm run contracts:validate`
4.  **Governance-enforced** — All rules are machine-enforced via `npm run governance:check`

### 1. Three-Layer AI Context Model (C.3)

To ensure consistent AI assistance and platform integrity, the repository uses a three-layer context model:
-   **L1 (Semantic)**: Use README and ARCHITECTURE.md for navigation intent. Do NOT treat them as absolute authority.
-   **L2 (Metadata)**: Always prefer manifests (`module-manifest.yaml`), schemas, and indexes (`contracts/INDEX.yaml`) for architectural facts.
-   **L3 (Enforcement)**: Critical rules MUST be enforced by CI validators, policy-as-code, and unified gates.

### 2. Navigation and Directory Mapping (C.2)

To navigate the 242+ root directories, agents MUST:
-   **Consult Navigation**: Refer to `navigation/module-index.yaml` and `navigation/dependency-graph.yaml` before proposing changes.
-   **Respect Boundaries**: Distinguish between `specification` vs `implementation` and `provider` vs `port`.
-   **Sync Indexes**: Automatically update navigation indexes whenever adding, moving, or changing modules or services.

### 3. AI-Assisted Development Principles (C.4)

In Autopilot mode, agents MUST adhere to these development standards:
-   **Task-Driven Workloads**: Wrap any auditable or AI-consuming workload as an `ai-task` resource with a defined lifecycle.
-   **Contract-First**: Propose contract drafts and validate them through schema checks before writing runtime code.
-   **Billing Awareness**: Ensure every billable primitive (inference, tool call, etc.) emits a traceable usage event.
-   **Provider Isolation**: Maintain strict isolation of external SDKs within the `providers/` layer.

### 4. Memory-Driven Persistence Protocol

Agents MUST operate within a memory-driven persistence loop to ensure continuity, reusability, and unconstrained operation:
-   **Context Fetch (Pre-Task)**: Before initiating any task, agents MUST query the `mycodexvantaos-memory-dream` engine to retrieve relevant `MemoryItem`s as contextual input. This ensures work builds upon past knowledge.
-   **Memory Emission (Post-Task)**: Upon task completion (success or failure), agents MUST emit a `MemoryItem` encapsulating the task's outcome, key decisions, and any generated `DreamReport`. This `MemoryItem` MUST be formatted according to `mycodexvantaos-memory-dream` data models and include `temporal_expressions` and `related_entities`.
-   **Dream Action Resolution**: If the `mycodexvantaos-memory-dream` engine generates `DreamAction`s (e.g., for conflict resolution or orphan detection), agents MUST prioritize executing these actions to maintain memory integrity and consistency.
-   **Semantic Clustering Reuse**: Agents SHOULD leverage semantic clustering from the `mycodexvantaos-memory-dream` engine to identify and reuse best practices or relevant historical contexts from semantically similar modules or tasks.

### 5. Document-Driven Development (Artifact-to-App)

Agents MUST prioritize Document-Driven Development, transforming various document formats into structured **Artifacts** and executable code:
-   **Artifact Conversion**: Automatically convert documents (TXT, DOCX, PDF, Markdown) into structured **Artifacts** (YAML, JSON, Markdown, Python, JS/TS, Java/Go modules, JSX/TSX components, OpenAPI specs).
-   **Quality Assurance**: For all generated **Artifacts**, agents MUST perform automated Linting, Schema Validation, and Unit Test Generation (e.g., Pytest, Jest).
-   **Metadata & Traceability**: Extract metadata from source documents and embed it into generated **Artifacts** for enhanced traceability and auditability.
-   **Output Customization**: Utilize template engines (e.g., Jinja2) to ensure generated **Artifacts** conform to team-specific coding styles and formats.
-   **CI/CD Integration**: Integrate **Artifact** conversion and validation into CI/CD pipelines, supporting semantic versioning, cloud storage uploads (S3, GCS), and incremental conversion.

### 6. Automated Repair & PR Loop

Agents act as "Navigation Guardians":
-   **Detection**: Use `scripts/validate-ai-context.py` and `scripts/validate-directory-context.py` to detect drift.
-   **Remediation**: Automatically update `directory-context.yaml` and `navigation/` files to reflect architectural changes.
-   **Verification**: Ensure the `closure-prover` and `unified-gates` validate the entire governance chain before opening a PR.

### 7. Normative Behavior

-   **No Silent Fallback**: Fallback logic must be declared in manifests and generate audit events.
-   **Local-First**: Prioritize local validation and Docker Compose over remote cloud deployments.
-   **Transparency**: Every autonomous action must be documented with a clear reasoning trace referencing the relevant **Governance Code**.

By following these standards, agents ensure the platform's architecture remains transparent, navigable, and constitutionally sound for both AI and human contributors.

## Build Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Build the Next.js project |
| `npm run dev` | Start dev server with Turbopack (port 9002) |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | Linting |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run validate` | Run typecheck validation |
| `npm run contracts:validate` | Validate contracts SDK |
| `npm run governance:check` | Run governance/policy checks |
| `npm run test:services` | Run service unit tests |
| `npm run test:contracts` | Run contracts SDK tests |
| `npm run preview` | Build and preview on Cloudflare |
| `npm run deploy` | Build and deploy to Cloudflare (REQUIRES APPROVAL) |
| `npm run genkit:dev` | Start Genkit AI development server |
| `npm run python:test` | Run Python test suite |
| `npm run python:lint` | Lint Python packages with ruff |
| `npm run python:typecheck` | Type check Python with mypy |
| `npm run api:start` | Start API Node server |
| `npm run rc:verify` | Verify release candidate |
| `npm run release:artifacts` | Generate release artifacts |

## Platform Layers

| Layer | Directory | Purpose |
|-------|-----------|---------|
| Builder | `packages/builder`, generators in `packages/*-generator` | Code generation from templates |
| Runtime | `packages/runtime`, `packages/core-*` | Core execution engine |
| Deployment | `infra/`, `packages/deployment-manifest-generator` | Infrastructure and deployment |
| Native Services | `packages/service-*`, `services/` | Platform services |
| Modules | `modules/` | High-level domain modules |
| AI Layer | `src/ai/`, `packages/ai-*`, `modules/mycodexvantaos-ai-*` | AI/ML capabilities via Genkit |
| Python Plane | `python/` | Python services (CI repair, dream worker, agent worker) |

## Monorepo Structure

```
├── src/                    # Next.js application source
├── packages/               # Shared packages (70+ packages)
├── modules/                # High-level domain modules (20+ modules)
├── services/               # Platform microservices (40+ services)
├── python/                 # Python plane (apps, packages, tests)
├── infra/                  # Infrastructure as code
├── tools/                  # Development tools (governance, migrations, generators)
├── contracts/              # Service contracts
├── schemas/                # JSON schemas (AI team, governance)
├── docs/                   # Documentation and ADRs
├── .github/                # CI/CD, agents, hooks, instructions
├── .agents/                # Agent skills and workflows
├── apps/                   # Additional applications
└── engineering-templates/  # Project templates
```

## Code Style

- TypeScript strict mode throughout all packages
- Functional components over class components (React)
- Next.js App Router conventions for the main app
- JSDoc comments for all public APIs and exported functions
- Prettier formatting (run `npm run format` before committing)
- ES module imports (import/export syntax)
- Prefer `const` over `let`; never use `var`
- Naming convention: `mycodexvantaos-<domain>-<capability>` for services/packages

## Naming Conventions (Governance-Enforced)

| Type | Pattern | Example |
|------|---------|---------|
| Service | `mycodexvantaos-<domain>-<capability>` | `mycodexvantaos-ai-memory` |
| Package | `@mycodexvantaos/<capability>` | `@mycodexvantaos/core-gateway` |
| Module | `mycodexvantaos-<domain>-<capability>` | `mycodexvantaos-governance-policy` |
| Schema | `<domain>/<entity>.schema.json` | `ai-team/agent-profile.schema.json` |

## Workflow

1. Run `npm run typecheck && npm run format:check` after making changes
2. Run `npm run governance:check` before submitting PRs
3. Run `npm run contracts:validate` after modifying contracts/SDK
4. Commit messages follow conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
5. Create feature branches from `main`
6. For Python changes: run `npm run python:lint && npm run python:typecheck`

## Testing

| Scope | Command | Notes |
|-------|---------|-------|
| TypeScript services | `npm run test:services` | Node.js test runner |
| Contracts SDK | `npm run test:contracts` | Contract validation tests |
| Python | `npm run python:test` | pytest via uv |
| Integration | `npm run test:integration` | Not yet configured |

## AI Development (Genkit)

- AI capabilities live in `src/ai/` and use Google Genkit
- Start Genkit dev: `npm run genkit:dev`
- Genkit skills reference: `.agents/skills/developing-genkit-js/`
- CRITICAL: Genkit API recently had breaking changes — always use `genkit docs:read` for current API
- Minimum Genkit CLI version: 1.29.0

## Python Plane

- Python services use FastAPI and are managed with `uv`
- Located in `python/` directory
- CI Repair Agent: `python/apps/ci-repair-agent/`
- Agent Worker: `python/apps/agent-worker/`
- Dream Worker: `python/apps/dream-worker/`
- Run tests: `cd python && .venv/bin/python -m pytest tests/ -v`
- Lint: `cd python && .venv/bin/ruff check packages/ apps/`

## Security

- Never commit secrets or API keys
- Use environment variables for all credentials
- Follow security guidelines in `SECURITY.md`
- Provider credentials go through `packages/security-secrets/`
- Validation via `packages/security-validation/`

## Release Process

1. `npm run rc:verify` — Verify release candidate
2. `npm run rc:soak` — Soak testing
3. `npm run release:promotion:evaluate` — Evaluate promotion criteria
4. `npm run release:artifacts` — Generate artifacts
5. `npm run release:sbom` — Generate SBOM
6. `npm run release:provenance` — Generate provenance
7. `npm run release:sign` — Sign provenance

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
