## GitHub Copilot CLI Instructions for MyCodexVantaOS

This document defines the unified architectural standards and operational guidelines for the **MyCodexVantaOS** Monorepo, incorporating the latest **A.0 Patch** for canonical normalization.

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

### 3. Foundation Directory Rules (A.3)

The `foundation/` directory is a **specification center**, not an implementation root.
- **Prohibited**: No source code, Dockerfiles, or deployment manifests.
- **Mandatory**: Must contain `foundation.yaml`, `capability-map.yaml`, and `roadmap.yaml` per unit.
- **Structure**: Seven core foundations (Compute, Data, Algorithm, Agent, Contract, Governance, Business).

### 4. Automated Repair & PR Loop (Autopilot)

In Autopilot mode, follow the **Detect → Classify → Fix → PR** loop:
1. **Detect**: Scan for naming, manifest, or foundation violations.
2. **Classify**: Categorize as Hard Rule (Blocker) or Soft Rule (Warning).
3. **Fix**: Use pre-approved fixers (e.g., `naming-remediate.sh`, `manifest-sync.sh`).
4. **PR**: Create a signed PR with audit fields: `actor`, `hash`, `version`, `correlationId`.

### 5. Supply Chain & Security

- **Pinned Actions**: Use full commit SHAs for all GitHub Actions.
- **Signed Evidence**: Every gate validation must produce signed JSON/YAML evidence.
- **Minimal Permissions**: Adhere to the principle of least privilege for all workflows.

For detailed domain knowledge, refer to modular instructions in `.github/instructions/`.
