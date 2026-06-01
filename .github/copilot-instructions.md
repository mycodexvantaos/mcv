## GitHub Copilot CLI Instructions for MyCodexVantaOS

This document defines the unified architectural standards and operational guidelines for the **MyCodexVantaOS** Monorepo, incorporating the **Namespace Governance Closure Specification**.

### 1. Platform Identity & SSOT

- **Brand Identity**: **MyCodexVantaOS** (Human-facing).
- **Machine Identity**: **mycodexvantaos** (Machine-facing, all lowercase).
- **Governance Statement**: Namespace code defines identity; repository name defines responsibility; binding manifest defines logical pairings.

### 2. Global Naming Rules (I.1)

All machine-facing names MUST follow:
- **Constraints**: `lowercase` only, `kebab-case` only, `hyphen` as the only separator.
- **Forbidden**: No underscores (`_`), semantic dots (`.`), spaces, version numbers (e.g., `-v1`), or environment markers (e.g., `-prod`).
- **Exception**: Semantic dots are only allowed in protocol-specific fields like Kubernetes API groups (e.g., `mycodexvantaos.quantum`).

### 3. Namespace Plane Model (I.2)

- **Control Plane (`mycodexvantaos`)**: Core infrastructure, policy, auth, audit, automation, registry.
- **Product Plane (`softwareos`)**: Product-facing services, domain apps, user workflows.
- **Dependency Rule**: Product Plane may depend on Control Plane. Control Plane MUST NOT hard-depend on Product Plane runtime implementations. Use mediators (Registry, Catalog, Binding) for reverse awareness.

### 4. Governance Code Taxonomy (I.3)

Codes follow the `mycodexvantaos-{ll}{d}{s}{qq}` format:
- **ll (2 digits)**: Layer group.
- **d (1 digit)**: Governance domain.
- **s (1 digit)**: Governance subtype.
- **qq (2 digits)**: Rule sequence.
- **Regex**: `^mycodexvantaos-[0-9]{5}$`.

### 5. Governance Era Mapping (I.4)

- `00000-09999`: Meta-Governance (Immutable baseline, charter, lifecycle).
- `10000-29999`: Era One (Code & Architecture).
- `30000-59999`: Era Two (Distributed Runtime).
- `60000-89999`: Era Three (Intent, Autonomy, Quantum).
- `90000-99999`: Cross-Era Governance (Mapping, Migration, Archive).

### 6. Automated Repair Loop (Autopilot)

In Autopilot mode, follow the **Detect → Classify → Fix → PR** loop:
1. **Detect**: Scan for naming, plane dependency, or taxonomy violations.
2. **Classify**: Map violations to specific Governance Codes (e.g., `mycodexvantaos-00100` for naming).
3. **Fix**: Use remediation scripts and update the **Governance Registry**.
4. **PR**: Create a signed PR with audit evidence and `validation-reports`.

For detailed domain knowledge, refer to modular instructions in `.github/instructions/`.
