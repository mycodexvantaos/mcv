## GitHub Copilot CLI Instructions for MyCodexVantaOS

This document defines the unified architectural standards and operational guidelines for the **MyCodexVantaOS** Monorepo, incorporating the latest **Namespace Governance Module** and **Governance Code Taxonomy**.

### 1. Platform Identity & SSOT

- **Brand Identity**: **MyCodexVantaOS** (Human-facing).
- **Machine Identity**: **mycodexvantaos** (Machine-facing, all lowercase, no special characters).
- **Core Principles**: Local-first, Cloud-agnostic, Contract-first, Governance-enforced.

### 2. Namespace & Repository Governance

All identifiers MUST follow the **lowercase-kebab-case** rule.
- **Repository Pattern**: `{namespace}-{domain}-{function}` (e.g., `mycodexvantaos-auth-service`).
- **Forbidden**: No underscores (`_`), dots (`.`), spaces, version numbers, or environment markers (e.g., `-v1`, `-prod`) in machine identifiers.
- **Namespace Planes**:
  - `mycodexvantaos`: Control Plane (Core infrastructure, policy, audit, automation).
  - `softwareos`: Product Plane (Domain platforms, business services, user APIs).
  - **Rule**: Product Plane may depend on Control Plane, but Reverse Awareness requires a **Mediator** (Registry, Catalog, Binding).

### 3. Governance Code Taxonomy

Governance codes follow the `mycodexvantaos-{code}` format where `{code}` is `ll-d-s-qq`:
- `ll` (00-99): Layer group.
- `d` (0-9): Governance domain.
- `s` (0-9): Governance subtype.
- `qq` (00-99): Rule sequence.

**Era Ranges**:
- `00000-09999`: Meta-Governance (Immutable baseline).
- `10000-29999`: Era One (Code & Architecture).
- `30000-59999`: Era Two (Distributed Runtime).
- `60000-89999`: Era Three (Intent & Autonomy).
- `90000-99999`: Cross-Era Governance (Migration & Archive).

### 4. Manifest & Contract Governance

"If there is no contract, there is no implementation."
- **Root Module**: `<root>/mycodexvantaos-module.yaml`
- **Service**: `modules/<service-id>/module-manifest.yaml`
- **Provider**: `providers/<cap>/<id>/provider-manifest.yaml`
- **Foundation**: `foundation/<name>-foundation/foundation.yaml`

### 5. Automated Repair Loop (Autopilot)

Follow the **Detect → Classify → Fix → PR** loop:
1. **Detect**: Scan for naming, code taxonomy, or plane dependency violations.
2. **Classify**: Categorize as Hard Rule (Blocker) or Soft Rule (Warning).
3. **Fix**: Use remediation scripts (e.g., `naming-remediate.sh`, `manifest-sync.sh`).
4. **PR**: Create a signed PR with audit fields: `actor`, `hash`, `version`, `correlationId`.

For detailed domain knowledge, refer to modular instructions in `.github/instructions/`.
