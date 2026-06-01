## GitHub Copilot CLI Instructions for MyCodexVantaOS

This document defines the unified architectural standards and operational guidelines for the **MyCodexVantaOS** Monorepo, incorporating the **Namespace Governance Architecture Panorama**.

### 1. Platform Identity & SSOT

- **Brand Identity**: **MyCodexVantaOS** (Human-facing).
- **Machine Identity**: **mycodexvantaos** (Machine-facing, all lowercase).
- **Governance Identity**: Defined by the **Namespace Code**.
- **Operational Responsibility**: Defined by the **Repository Name**.

### 2. Binding-Mediator Architecture (J.1.4)

To prevent hard dependency cycles, all logical pairings MUST be mediated:
- **Directory Context**: `directory-context.yaml` defines local relationships.
- **Binding Manifest**: `navigation/bindings/*.yaml` defines logical pairings.
- **Mediators**: Use `contracts`, `schemas`, `events`, `ports`, or `service-catalog` to decouple services.
- **Rule**: Product Plane services may depend on Control Plane, but Control Plane MUST NOT hard-depend on Product Plane runtimes.

### 3. CI Validation Panorama (J.1.6)

All PRs MUST pass the following CI guards:
- **Naming Guard**: Validates repository and resource names against canonical patterns.
- **Binding Guard**: Ensures all dependencies are mediated and no cycles exist in the `dependency-graph.yaml`.
- **Registry Guard**: Detects drift in namespace, repository, and governance code registries.
- **Closure Prover**: Verifies the full governance closure and lifecycle compliance.

### 4. Governance Code Taxonomy (J.1.3)

Codes follow the `mycodexvantaos-{ll}{d}{s}{qq}` format:
- `00000-09999`: Meta-Governance (Baseline, Identifiers, Lifecycle).
- `10000-29999`: Era One (Code & Architecture).
- `30000-59999`: Era Two (Distributed Runtime).
- `60000-89999`: Era Three (Intent, Autonomy, Quantum).
- `90000-99999`: Cross-Era Governance (Mapping, Migration, Archive).

### 5. Automated Repair Loop (Autopilot)

In Autopilot mode, follow the **Detect → Classify → Fix → PR** loop:
1. **Detect**: Scan `inputs` (repo names, bindings, registries) for violations.
2. **Classify**: Categorize based on the **Governance Code** (e.g., `mycodexvantaos-00100` for naming).
3. **Fix**: Apply remediation scripts and update relevant registries.
4. **PR**: Create a signed PR with `validation-reports` as evidence.

For detailed domain knowledge, refer to modular instructions in `.github/instructions/`.
