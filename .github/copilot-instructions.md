## GitHub Copilot CLI Instructions for MyCodeXvantaOS

This document provides comprehensive instructions and best practices for utilizing GitHub Copilot CLI within the MyCodeXvantaOS project, especially when operating in Autopilot mode. Adhering to these guidelines ensures consistency, efficiency, and alignment with the project's architectural principles and governance standards.

### 1. Platform Identity and Architecture Invariants

**MyCodeXvantaOS** is a Local-first, Provider-agnostic, Contract-driven full-stack application operating system. It is designed to complete generation, execution, validation, publishing, and rollback with zero external dependencies.

**Critical Brand Note**: 
- **Brand Identity**: Always use **MyCodeXvantaOS** in human-readable fields (README, docs, etc.).
- **Machine Identity**: Always use **mycodexvantaos** (all lowercase) for machine-readable identifiers (repositories, package scopes, service IDs, OCI namespaces, K8s resource names, etc.).

All code changes and autonomous operations MUST respect these four core principles:

1.  **Local-first**: The platform must function without external dependencies. All core capabilities require a `native` local implementation.
2.  **Provider-agnostic**: Business logic must not directly couple to any third-party SDK. External capabilities are accessed through standardized `Provider` abstraction interfaces.
3.  **Contract-first**: Interface definitions precede implementation. All service interactions must be based on explicitly defined contracts.
4.  **Governance-enforced**: All governance rules must be machine-readable and automatically enforceable via CI/CD gates.

### 2. Build Commands and Project Structure

Copilot CLI should be aware of the project's build commands and monorepo structure for effective navigation and task execution.

#### Build Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Build the Next.js project |
| `npm run dev` | Start dev server with Turbopack (port 9002) |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run lint` | Same as typecheck |
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

#### Monorepo Structure

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

### 3. Code Style and Workflow Guidelines

#### Naming Conventions (Strictly Enforced)

| Type | Pattern (lowercase/kebab-case) | Example |
|------|---------|---------|
| Service | `mycodexvantaos-<domain>-<capability>` | `mycodexvantaos-ai-memory` |
| Package | `@mycodexvantaos/<capability>` | `@mycodexvantaos/core-gateway` |
| Module | `mycodexvantaos-<domain>-<capability>` | `mycodexvantaos-governance-policy` |
| Schema | `<domain>/<entity>.schema.json` | `ai-team/agent-profile.schema.json` |
| Env Var | `MYCODEXVANTAOS_<NAME>` | `MYCODEXVANTAOS_API_KEY` |

**Forbidden Legacy Prefixes**: `mycodexvanta-os`, `codexvanta-os`, `KUBO`, `ORCH`, `AXM`, `AXIOM`, `GL`, `NG`.

#### Workflow
1.  **Explore → Plan → Code → Validate → Commit**.
2.  Run `npm run typecheck && npm run format:check` after making changes.
3.  Run `npm run governance:check` before submitting PRs.
4.  Run `npm run contracts:validate` after modifying contracts/SDK.
5.  Commit messages follow conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
6.  Create feature branches from `main`.
7.  For Python changes: run `npm run python:lint && npm run python:typecheck`.

### 4. Autopilot Mode Specifics

When operating in Autopilot mode, Copilot CLI should prioritize the following:

-   **SSOT (Single Source of Truth)**: Always refer to `platform/service-catalog.yaml` for service identities and `governance/provider-registry.yaml` for provider configurations.
-   **Tool Permissions**: Refer to `AGENTS.md` for pre-approved vs. confirmation-required tools.
-   **Evidence-based Gates**: All gates (design, test, deployment) require evidence in JSON/YAML format.
-   **Runtime Mode**: In production, `auto` mode is forbidden; it must be explicitly set to `connected`, `native`, or `hybrid`.

### 5. Modular Instructions

For specific domain knowledge (e.g., database migrations, quantum-classical bridge), refer to modular instruction files under `.github/instructions/`. These files provide granular guidance for particular aspects of the project.
