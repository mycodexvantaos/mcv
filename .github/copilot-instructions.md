## GitHub Copilot CLI Instructions for MyCodeXvantaOS

This document provides comprehensive instructions and best practices for utilizing GitHub Copilot CLI within the MyCodeXvantaOS project, especially when operating in Autopilot mode. Adhering to these guidelines ensures consistency, efficiency, and alignment with the project's architectural principles.

### 1. Platform Identity and Architecture Invariants

MyCodeXvantaOS is a Local-first, Provider-agnostic, Contract-driven full-stack application operating system, designed to complete generation, execution, validation, publishing, and rollback with zero external dependencies. All code changes and autonomous operations MUST respect these four core principles:

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

To maintain high code quality and consistency, Copilot CLI should adhere to the following guidelines:

#### Code Style
-   TypeScript strict mode throughout all packages.
-   Prefer functional components over class components (React).
-   Next.js App Router conventions for the main app.
-   JSDoc comments for all public APIs and exported functions.
-   Prettier formatting (run `npm run format` before committing).
-   ES module imports (import/export syntax).
-   Prefer `const` over `let`; never use `var`.
-   Naming convention: `mycodexvantaos-<domain>-<capability>` for services/packages.

#### Naming Conventions (Governance-Enforced)

| Type | Pattern | Example |
|------|---------|---------|
| Service | `mycodexvantaos-<domain>-<capability>` | `mycodexvantaos-ai-memory` |
| Package | `@mycodexvantaos/<capability>` | `@mycodexvantaos/core-gateway` |
| Module | `mycodexvantaos-<domain>-<capability>` | `mycodexvantaos-governance-policy` |
| Schema | `<domain>/<entity>.schema.json` | `ai-team/agent-profile.schema.json` |

#### Workflow
1.  Run `npm run typecheck && npm run format:check` after making changes.
2.  Run `npm run governance:check` before submitting PRs.
3.  Run `npm run contracts:validate` after modifying contracts/SDK.
4.  Commit messages follow conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
5.  Create feature branches from `main`.
6.  For Python changes: run `npm run python:lint && npm run python:typecheck`.

### 4. Autopilot Mode Specifics

When operating in Autopilot mode, Copilot CLI should prioritize the following:

-   **Contextual Awareness**: Always load and adhere to instructions from `AGENTS.md` and any relevant modular instruction files under `.github/instructions/`.
-   **Plan Mode**: For non-trivial tasks, utilize plan mode (`Shift+Tab` or `/plan`) to generate a detailed implementation plan. Review and approve the plan before execution.
-   **Tool Permissions**: Operate within the defined tool permissions to ensure secure and controlled execution. Refer to `AGENTS.md` for a detailed list of pre-approved, confirmation-required, and denied tools.
-   **Error Recovery**: Attempt to fix errors using available context. If architectural decisions are required, pause and seek guidance. Never suppress errors or bypass governance checks.

### 5. Modular Instructions

For specific domain knowledge or task-specific guidance, refer to modular instruction files located under `.github/instructions/`. These files provide granular instructions for particular aspects of the project, allowing for flexible and scalable instruction sets.
