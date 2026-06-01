## GitHub Copilot CLI Instructions for MyCodeXvantaOS

This document defines the unified architectural standards and operational guidelines for the **MyCodeXvantaOS** Monorepo. All agents, including those in Autopilot mode, MUST adhere to these rules to ensure platform integrity, governance compliance, and supply chain security.

### 1. Platform Identity & SSOT

- **Brand Identity**: **MyCodeXvantaOS** (Use in human-readable fields: README, docs, spec titles).
- **Machine Identity**: **mycodexvantaos** (Use in machine-readable fields: repos, package scopes, service IDs, OCI namespaces, K8s resource names, URNs).
- **SSOT (Single Source of Truth)**:
  - Service Identity: `platform/service-catalog.yaml`
  - Provider Registry: `governance/provider-registry.yaml`
  - Capability Set: `governance/capability-set.yaml`
  - Naming Policy: `schemas/naming-policy.schema.json`

### 2. Monorepo Directory Responsibilities

| Directory | Responsibility | CI Validation |
|-----------|----------------|---------------|
| `.github/workflows` | CI/CD Pipeline & Auto-fix Flows | Fixed SHA, Minimal Permissions |
| `governance/` | Policies, Registries, & Audit Trails | Schema & Drift Validation |
| `navigation/` | Dependency Graphs & Bindings | Cycle & Mediator Validation |
| `contracts/` | Service Contracts & Event Schemas | Contract-first Validation |
| `apps/` | Core Applications & Auto-fix Bots | Unit & Integration Tests |
| `scripts/` | Bootstrap, Lifecycle, & Repair Scripts | Functional Verification |

### 3. Automated Repair & PR Loop (Autopilot)

When operating in Autopilot mode, the agent MUST implement the **Detect → Classify → Fix → PR** loop:
1. **Detect**: Monitor workflows and scan for naming, dependency, or security violations.
2. **Classify**: Categorize the issue based on governance policies (Hard Rule vs. Soft Rule).
3. **Fix**: Apply the appropriate fixer (e.g., `actions-hardening.sh`, `lint-fix`, `deps-refresh`).
4. **PR**: Create a signed PR with a detailed audit report and evidence of verification.

### 4. Supply Chain Security & Governance

- **Hard Rules**: Direct push to `main` is blocked. All changes must pass `npm run governance:check`.
- **Security**: 
  - All GitHub Actions MUST use pinned SHAs (e.g., `uses: actions/checkout@sha256:...`).
  - Generate SBOM and Provenance for all artifacts.
  - Sign all commits and PRs using Cosign/Attestation.
- **Audit Fields**: Every action must record: `actor`, `action`, `resource`, `result`, `hash`, `version`, `requestId`, `correlationId`.

### 5. Code Generation & Artifact Standards

- **Contract-first**: Define interfaces in `contracts/` before implementing logic.
- **Naming**: Strictly lowercase/kebab-case. No `_`, `.`, or environment markers in machine IDs.
- **Error Handling**: Provide fallback mocks, `.env.example`, and `rollback.sh` for every new service.
- **Artifact Conversion**: Use the `docx-to-artifact` module for structured documentation processing.

### 6. Workflow Best Practices

- **Explore → Plan → Code → Validate → Commit**.
- Use **Plan Mode** (`/plan`) for multi-file or cross-module changes.
- In **Production**, `auto` runtime mode is FORBIDDEN; use `connected`, `native`, or `hybrid`.
- Minimum GitHub Actions permissions: `contents: read`, `packages: write` (as needed).

Adherence to these standards is mandatory for all automated and manual contributions to the **MyCodeXvantaOS** ecosystem.
