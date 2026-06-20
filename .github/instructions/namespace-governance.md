## Namespace Governance and Taxonomy Instructions

This document provides modular instructions for managing namespace governance and the governance code taxonomy within **MyCodexVantaOS**.

### 1. Naming and Identification (A.1)

All machine-readable identifiers MUST be normalized:
- **Rule**: `lowercase-kebab-case` only.
- **Forbidden**: `_`, `.`, ` `, version numbers (`-v1`), environment markers (`-prod`).
- **Pattern**: `{namespace}-{domain}-{function}`.

### 2. Governance Code Structure

Codes follow the `mycodexvantaos-ll-d-s-qq` pattern:
- `ll`: Layer group (00-99).
- `d`: Governance domain (0-9).
- `s`: Governance subtype (0-9).
- `qq`: Rule sequence (00-99).

**Era Assignments**:
- Meta-Governance: `00000-09999`
- Era One (Architecture): `10000-29999`
- Era Two (Runtime): `30000-59999`
- Era Three (AI/Autonomy): `60000-89999`
- Cross-Era: `90000-99999`

### 3. Namespace Planes and Dependencies

- **Control Plane (`mycodexvantaos`)**: Core services.
- **Product Plane (`softwareos`)**: Business services.
- **Dependency**: Product → Control (Allowed). Control → Product (Forbidden without Mediator).

### 4. Controlled Vocabulary

Only use approved terms for domains and functions:
- **Domains**: `auth`, `policy`, `infra`, `platform`, `compliance`, `rollback`, `scheduler`.
- **Functions**: `service`, `agent`, `sdk`, `api`, `engine`, `scanner`, `reporter`, `controller`.

### 5. Validation and Remediation

- **Gate**: Use `ci-naming-validators` to enforce these rules in every PR.
- **Fixer**: Run `scripts/naming/remediate.sh` to fix violations autonomously.
- **Registry**: Update `governance/registry/repository-registry.yaml` after any naming change.

Agents must refer to these instructions when creating new resources or auditing existing ones.
