## GitHub Copilot CLI Instructions for MyCodexVantaOS

This document defines the unified architectural standards and operational guidelines for the **MyCodexVantaOS** Monorepo, incorporating the latest **A.0 Patch** and **CI/CD Expansion** for a fully self-hosted, governed environment.

### 1. Platform Identity & SSOT

- **Brand Identity**: **MyCodexVantaOS** (Use in human-readable documents).
- **Machine Identity**: **mycodexvantaos** (Use in all machine-readable identifiers, repos, scopes, and URNs).
- **SSOT (Single Source of Truth)**:
  - Service Topology: `platform/service-catalog.yaml`
  - Global Navigation: `navigation/` (dependency-graph, module-index)
  - Namespace Governance: `mycodexvantaos-namespace-governance/`
  - Quality Gates: `unified-gates/`

### 2. Manifest Governance Matrix

| Manifest Type | File Name | Required Location |
|---------------|-----------|-------------------|
| Root Module | `mycodexvantaos-module.yaml` | `<root-directory>/` |
| Service | `module-manifest.yaml` | `modules/<service-id>/` |
| Provider | `provider-manifest.yaml` | `providers/<capability>/<id>/` |
| Foundation | `foundation.yaml` | `foundation/<name>-foundation/` |

**Forbidden Names**: `mycodexvantaos.module.yaml`, `module.yaml`, `axiom.module.yaml`. CI MUST reject these.

### 3. CI/CD & Automated Repair Loop (Autopilot)

In Autopilot mode, implement the **Detect → Classify → Fix → PR** loop with self-hosted toolchains:
1. **Detect**: 
   - Use `naming-guard.yaml` and `conftest-naming.yaml` for policy checks.
   - Use `trivy-scan.yaml` and `gitleaks.yaml` for security scanning.
2. **Classify**: Categorize as Hard Rule (Blocker) or Soft Rule (Warning).
3. **Fix**: 
   - Use `actions-hardening.sh` for pinning SHA.
   - Use `naming/remediate.sh` for automated renaming.
   - Use `lint-fix` and `deps-refresh` for codebase health.
4. **PR**: Create a signed PR with audit fields: `actor`, `hash`, `version`, `correlationId`.

### 4. Supply Chain & Security Standards

- **Pinned Actions**: All GitHub Actions MUST use full commit SHAs.
- **Artifact Integrity**: 
  - Primary hash: **SHA3-512** for release artifacts.
  - Secondary hash: **SHA-256** for audit chains.
- **SBOM & Provenance**: Generate CycloneDX 1.5 SBOM and SLSA v1 Provenance for all releases.
- **Minimal Permissions**: Workflows must use `permissions: contents: read` as the baseline.

### 5. Self-Hosted Architecture (Phase 1-3)

- **Local-first**: Prioritize `Docker Compose` and `PostgreSQL 16` over cloud-specific services.
- **Independence**: All business logic MUST reside behind `packages/ports/` to ensure vendor neutrality.
- **Observability**: Integrate Prometheus rules and Grafana dashboards for naming compliance and SLA tracking.

For detailed domain knowledge, refer to modular instructions in `.github/instructions/`.
