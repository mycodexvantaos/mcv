# Contributing to MyCodeXvantaOS

Thank you for your interest in contributing to MyCodeXvantaOS — an AI-native Agent Operating System built on a nine-layer hexagonal (port/adapter) architecture with constitutional governance and dual-plane design.

## 🚀 Quick Start

### Prerequisites

- **Node.js 22+** and **pnpm 9+**
- Python 3.11+ (for Python intelligence plane contributions)
- Git

### Setup

```bash
# Fork and clone
git clone https://github.com/your-username/mycodexvantaos.git
cd mycodexvantaos

# Enable corepack (required for pnpm)
corepack enable

# Install dependencies
pnpm install --frozen-lockfile

# Verify setup
pnpm build
pnpm test
```

### Start the API Server

```bash
# Start the Node.js API server (port 9100)
pnpm api:start

# Verify health
curl http://localhost:9100/v1/health
```

## 🏗️ Architecture

MyCodeXvantaOS follows a **nine-layer hexagonal (port/adapter) architecture** with strict dependency direction from inner to outer layers. The platform employs a **dual-plane design**: a TypeScript control plane and a Python intelligence plane.

### Layer Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  I. Apps Layer                                                │
│  api-worker (CF Workers) • api-node (Node.js API) •          │
│  web-console (SPA) • admin-console • cli (mcx)               │
├──────────────────────────────────────────────────────────────┤
│  H. Runtimes Layer                                            │
│  Cloudflare • Node.js (port 9100) • Docker • Kubernetes      │
├──────────────────────────────────────────────────────────────┤
│  G. Governance Layer (cross-cutting)                          │
│  Policy Engine • Audit Chain • Usage Metering •               │
│  Dream Safety • Architecture Decisions • Knowledge Trace     │
├──────────────────────────────────────────────────────────────┤
│  F. Release & Supply Chain Layer (cross-cutting)              │
│  SBOM (CycloneDX 1.5) • Provenance (SLSA v1) •              │
│  Artifact Digests (SHA3-512) • Promotion Gates • Signing     │
├──────────────────────────────────────────────────────────────┤
│  E. Infrastructure Layer                                      │
│  Helm Charts • Docker Compose • Migrations • Contracts        │
├──────────────────────────────────────────────────────────────┤
│  D. Adapters Layer                                            │
│  cloudflare-d1 • cloudflare-kv • cloudflare-r2 •             │
│  openai • openrouter • workers-ai • providers                 │
├──────────────────────────────────────────────────────────────┤
│  C. Application Layer                                         │
│  identity • workspace • knowledge • agent • model •           │
│  audit • usage • automation • memory • resource-registry      │
├──────────────────────────────────────────────────────────────┤
│  B. Ports Layer                                               │
│  database • object-storage • search • model-provider •        │
│  queue • auth                                                 │
├──────────────────────────────────────────────────────────────┤
│  A. Core Layer                                                │
│  shared • service-catalog • resource-model •                  │
│  policy-model • audit-model • knowledge-model •               │
│  memory-model • runtime-model • contracts-sdk                 │
└──────────────────────────────────────────────────────────────┘
```

**Dependency direction:** A → B → C → D → E (governance G is cross-cutting; release & supply chain F is cross-cutting; runtimes H and apps I compose the stack)

### Dual-Plane Architecture

- **TypeScript Control Plane** — API serving, governance enforcement, contract validation, and service orchestration. Runs on Cloudflare Workers (edge) or Node.js API server (self-hosted, port 9100).
- **Python Intelligence Plane** — Knowledge pipeline processing, agent orchestration, vector operations, evaluation, and memory dream. Connects to the control plane through the shared contract layer.

### Repository Structure

```
mycodexvantaos/
├── contracts/              # Constitutional model definitions
│   ├── service-definitions/  # 15 service YAML files + catalog
│   ├── schemas/              # 14 JSON Schema validation files
│   ├── events/               # 7 event YAML files
│   ├── resource-kinds/       # 16 resource kind YAML files
│   ├── policies/             # 5 policy YAML files
│   └── openapi/              # OpenAPI 3.1 specification
├── packages/
│   ├── core/                 # 9 zero-dependency domain model packages
│   ├── ports/                # 6 platform-neutral interface packages
│   ├── application/          # 10+ service business logic modules
│   ├── adapters/             # 7+ provider-specific implementations
│   ├── capabilities/         # Provider management with Runtime Mode
│   └── providers/            # 5 Cloudflare provider packages
├── apps/                    # 5 application entry points
│   ├── api-worker/           # Cloudflare Worker API
│   ├── api-node/             # Node.js API server (port 9100)
│   ├── web-console/          # Admin SPA
│   ├── admin-console/        # Admin management console
│   └── cli/                  # CLI tool (mcx)
├── python/                  # Python intelligence plane
│   ├── packages/             # 5 Python packages
│   └── apps/                 # 3 Python apps
├── runtimes/                # Multi-runtime bootstrap
├── release/                 # Release artifacts and policies
├── governance/              # Platform governance specification
├── services/                # 39 service packages
├── migrations/              # Database migrations (SQLite, PostgreSQL, D1)
├── infra/                   # Infrastructure configuration
├── tools/                   # Development tooling
├── docs/                    # Documentation
└── .github/workflows/       # 49 CI/CD pipeline configurations
```

## 🛠️ Development Commands

### Build & Test

```bash
pnpm build              # Build all packages
pnpm lint               # TypeScript check across workspace
pnpm format:check       # Prettier format check
pnpm format             # Prettier format fix
pnpm typecheck          # Type-check without emit
pnpm test               # Run tests
pnpm test:coverage      # Run tests with coverage
pnpm test:integration   # Run integration tests
pnpm validate           # Validate project structure
```

### Governance & Contracts

```bash
pnpm governance:check           # Full governance check (24 checks)
pnpm contracts:validate         # Validate all contracts
pnpm schemas:validate           # Validate JSON schemas
pnpm service-catalog:check      # Check service catalog consistency
pnpm resource-model:check       # Check resource model consistency
pnpm policy:check               # Check policy contracts
pnpm events:check               # Check event contracts
```

### Release Pipeline

```bash
pnpm rc:verify                   # RC verification (8 categories)
pnpm rc:soak                     # RC soak validation report
pnpm release:artifacts           # Generate release artifacts
pnpm release:sbom                # Generate CycloneDX 1.5 SBOM
pnpm release:provenance          # Generate SLSA v1 provenance
pnpm release:promotion:evaluate  # Evaluate promotion gates
```

### Python Intelligence Plane

```bash
pnpm python:test         # Run Python tests
pnpm python:lint         # Run Python linter (ruff)
pnpm python:typecheck    # Run Python type checking
```

### API Server

```bash
pnpm api:start           # Start Node.js API server (port 9100)
```

## 🧪 Testing Strategy

### Unit Tests

- All new features must include unit tests
- Tests use the Jest framework
- Place tests in `__tests__/` directories alongside the source
- Maintain >80% test coverage

```bash
pnpm test                               # Run all tests
pnpm test -- packages/core/shared       # Run tests for specific package
```

### Integration Tests

- Test component interactions across layers
- Focus on data flow and contract compliance
- Run with `pnpm test:integration`

### Contract Validation

- All changes to `contracts/` must pass schema validation
- Run `pnpm contracts:validate` before submitting PRs
- Cross-language contract check validates TypeScript-Python consistency

## 📋 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines (`pnpm lint` passes)
- [ ] Format check passes (`pnpm format:check` passes)
- [ ] All tests pass (`pnpm test` passes)
- [ ] Governance check passes (`pnpm governance:check` passes)
- [ ] Contract validation passes (`pnpm contracts:validate` passes)
- [ ] No Section Sign Symbol (U+00A7) in code or documentation
- [ ] Documentation section headings use `## Spec X：Title` or `### Spec X.Y：Title` format (never `§X`)
- [ ] Documentation is updated for user-facing changes
- [ ] Commit messages follow conventional commit format

### PR Checklist

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Contract modification

## Quality Gates

- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm test` passes
- [ ] `pnpm governance:check` passes
- [ ] `pnpm contracts:validate` passes
- [ ] No Section Sign Symbol (U+00A7) in changes
- [ ] Section headings use `## Spec X：Title` or `### Spec X.Y：Title` format (never `§X`)
- [ ] Documentation updated

## Architecture Compliance

- [ ] Changes follow dependency direction (A→B→C→D→E)
- [ ] No cross-layer dependency violations
- [ ] New adapters implement the correct port interface
- [ ] New services follow the service catalog specification
```

### Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

**Types:**

| Type         | Description                                      |
| ------------ | ------------------------------------------------ |
| `feat`       | New feature                                      |
| `fix`        | Bug fix                                          |
| `docs`       | Documentation changes                            |
| `style`      | Code style changes (formatting, no logic change) |
| `refactor`   | Code refactoring                                 |
| `test`       | Test changes                                     |
| `chore`      | Build process or tooling changes                 |
| `governance` | Governance or policy changes                     |
| `contract`   | Contract definition changes                      |

**Examples:**

```
feat(knowledge-search): add hybrid search with evidence levels

Implement semantic + fulltext hybrid search with three evidence
levels: knowledge-assisted, knowledge-verified, knowledge-grounded.

Closes #42

fix(cloudflare-d1): handle connection timeouts with retry logic

Add exponential backoff for D1 connection failures.

docs(readme): sync documentation with v0.1.0 stable

governance(policy): add dream safety enforcement flag

contract(schemas): add memory-model JSON schema
```

## 📝 Documentation Format Rules

### Section Heading Format

All technical documentation **must** use the following Markdown-compatible section heading format:

| Level | Format | Example |
|-------|--------|---------|
| Top-level spec | `## Spec X：Title` | `## Spec 3：Compliance Baseline` |
| Sub-spec | `### Spec X.Y：Title` | `### Spec 4.2：Threat Vectors` |

### Prohibited: Section Sign Symbol (U+00A7)

The `§` symbol is **strictly prohibited** in all documentation. It is not standard Markdown and causes parsing failures on GitLab Wiki, Docsify, and some static site generators (broken TOC and anchor generation).

| Prohibited | Correct |
|------------|---------|
| `§3 合規基準` | `## Spec 3：合規基準` |
| `§4.2 威脅向量` | `### Spec 4.2：威脅向量` |

A pre-commit hook is configured to reject any commit containing `§` (U+00A7).

## 🏛️ Governance

MyCodeXvantaOS enforces constitutional governance through:

- **8 hard enforcement flags** — Must pass for any merge
- **9 soft enforcement flags** — Advisory, tracked but not blocking
- **Runtime middleware**: `withAudit()`, `withPolicy()`, knowledge trace, dream safety, architecture decision
- **Governance specification**: `governance/platform-governance-spec.yaml`

All PRs must pass `pnpm governance:check` (24 checks) before merging.

## 🐳 Docker Development

```bash
# Build Docker image
docker build -t mycodexvantaos/api-node .

# Run Docker container (port 9100)
docker run -p 9100:9100 mycodexvantaos/api-node

# Verify health
curl http://localhost:9100/v1/health
```

## 🌿 Branch Naming Conventions

| Pattern       | Example                   | Purpose                |
| ------------- | ------------------------- | ---------------------- |
| `feature/`    | `feature/hybrid-search`   | New features           |
| `fix/`        | `fix/d1-timeout`          | Bug fixes              |
| `docs/`       | `docs/sync-readme-v0.1.0` | Documentation          |
| `governance/` | `governance/dream-safety` | Governance changes     |
| `contract/`   | `contract/memory-schema`  | Contract modifications |
| `chore/`      | `chore/update-deps`       | Maintenance            |

## 📦 Package Management

MyCodeXvantaOS uses **pnpm** as its package manager with workspace support.

```bash
# Add a workspace dependency
pnpm add <package> -w

# Add a dependency to a specific package
pnpm add <package> --filter <package-name>

# Add a dev dependency
pnpm add <package> -D --filter <package-name>

# Build all packages
pnpm build

# Build specific workspace package
pnpm build --filter <package-name>
```

## 📜 Licensing

By contributing to MyCodeXvantaOS, you agree that your contributions will be licensed under the **Proprietary** license. All rights reserved.

---

Thank you for contributing to MyCodeXvantaOS! Your contributions help build a governed, auditable, and vendor-independent AI-native platform.
