## Governance and Audit Instructions

This document provides modular instructions for governance enforcement and audit trail management within the **MyCodexVantaOS** ecosystem.

### 1. Identity Normalization (A.1)

- **Brand Name**: **MyCodexVantaOS** (Use in documentation).
- **Machine Name**: **mycodexvantaos** (Use in all identifiers: repos, npm scopes, URNs, labels, package names).
- **Forbidden Prefixes**: Strictly avoid `mycodexvanta-os`, `codexvanta-os`, `codexvanta`, `KUBO`, `AXIOM`.

### 2. Manifest Governance (A.2)

Every module and service must contain the correct manifest type:

- **Root Module**: `<root>/mycodexvantaos-module.yaml`
- **Service**: `modules/<id>/module-manifest.yaml`
- **Provider**: `providers/<cap>/<id>/provider-manifest.yaml`
- **Foundation**: `foundation/<name>-foundation/foundation.yaml`

### 3. Audit Closure

All autonomous and manual actions must be recorded with the following mandatory fields:

- `actor`: Identity of the agent or user.
- `action`: Specific operation performed.
- `resource`: Target of the action (URN or path).
- `result`: Outcome (success/failure).
- `hash`: Integrity hash of the changed state.
- `correlationId`: ID linking related actions across the platform.

### 4. Navigation and SSOT

- **Canonical Index**: `platform/service-catalog.yaml`
- **Global Indexes**: Found in `navigation/` (directory-index, module-index, dependency-graph).
- **Namespace Governance**: Records in `mycodexvantaos-namespace-governance/governance/`.

### 5. Compliance Gates

- **Unified Gates**: Refer to `unified-gates/gate/gate-catalog.yaml` for quality and AI infrastructure gates.
- **Validation**: Every change MUST pass the corresponding gate before merging. Evidence of validation (JSON/YAML) must be attached to the PR.
