## Governance Closure and Registry Instructions

This document provides modular instructions for managing the governance closure system and registries within **MyCodexVantaOS**.

### 1. Global Naming Rules (I.1)

- **Rule**: `lowercase`, `kebab-case`, `hyphen` only.
- **Forbidden**: `_`, `.`, ` `, version numbers, environment markers.
- **Exception**: Dotted names allowed ONLY in `kubernetesApiGroup` or similar external protocol fields.

### 2. Governance Code Model (I.3)

- **Format**: `mycodexvantaos-{ll}{d}{s}{qq}`.
- **Regex**: `^mycodexvantaos-[0-9]{5}$`.
- **Eras**:
  - `00000-09999`: Meta (Baseline)
  - `10000-29999`: Era 1 (Arch)
  - `30000-59999`: Era 2 (Runtime)
  - `60000-89999`: Era 3 (AI/Autonomy)
  - `90000-99999`: Cross-Era (Migration)

### 3. Plane Dependency Rules (I.2.4)

- **Product → Control**: Allowed (Contracts/Services).
- **Control → Product**: Forbidden (Hard Runtime Dependencies).
- **Mediators**: Use Registry, Catalog, Binding, or Evidence Channel for reverse awareness.

### 4. Registry Management

- **Namespace Registry**: `governance/registry/namespace-registry.yaml`.
- **Repository Registry**: `governance/registry/repository-registry.yaml`.
- **Code Registry**: `governance/registry/governance-code-registry.yaml`.
- **Action**: Always update the registry when a resource is added, renamed, or changed in lifecycle state.

### 5. CI Validation Requirements

- **Naming Guard**: Validates kebab-case and forbidden characters.
- **Registry Guard**: Detects drift between the registry and actual repository state.
- **Closure Prover**: Verifies the end-to-end governance chain.

Agents must refer to these instructions when performing platform governance or auditing tasks.
