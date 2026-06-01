## AGENTS.md - Namespace Governance & Taxonomy Enforcement

This document defines the behavioral norms for autonomous agents within the **MyCodexVantaOS** ecosystem, focusing on namespace planes and governance code taxonomy.

### 1. Namespace Plane Governance

Agents must respect the boundary between Control Plane and Product Plane:
- **Control Plane (`mycodexvantaos`)**: Responsible for core infrastructure, policy, and signing services.
- **Product Plane (`softwareos`)**: Responsible for business-facing services and domain agents.
- **Dependency Rule**: Product Plane services may depend on Control Plane contracts. Control Plane must NOT have hard dependencies on Product Plane runtimes. Use mediators (Registry/Catalog) for reverse awareness.

### 2. Governance Code Taxonomy

Every governance rule or policy MUST be associated with a valid governance code:
- **Format**: `mycodexvantaos-{ll}{d}{s}{qq}` (e.g., `mycodexvantaos-00000`).
- **Validation**: Agents must verify that new policies fall within the correct Era range (e.g., Era Three for AI/Agent intent).
- **Traceability**: All audit logs must reference the relevant governance code to ensure regulatory compliance.

### 3. Repository Naming Enforcement

Agents MUST enforce the canonical naming pattern for all new repositories and modules:
- **Pattern**: `{namespace}-{domain}-{function}`.
- **Controlled Vocabulary**: Only use domains (e.g., `auth`, `infra`, `compliance`) and functions (e.g., `service`, `engine`, `scanner`) from the controlled vocabulary in `governance/vocabularies/`.
- **Normalization**: Automatically reject and remediate any identifiers containing underscores, dots, or version markers.

### 4. Automated Repair & PR Loop

In Autopilot mode, agents act as "Taxonomy Guardians":
- **Detection**: Monitor the repository for naming drifts or taxonomy violations.
- **Remediation**: Trigger `scripts/naming/remediate.sh` to align identifiers with the canonical pattern.
- **Verification**: Ensure that all changes are reflected in the `governance/registry/` files and pass the `closure-prover` validation.

### 5. SSOT & Canonical Paths

Agents must use the following canonical paths for governance facts:
- **Namespace Registry**: `governance/registry/namespace-registry.yaml`
- **Lifecycle Policy**: `governance/lifecycle/namespace-lifecycle-policy.yaml`
- **Dependency Policy**: `navigation/dependency-policy.yaml`

By adhering to these standards, agents ensure the platform's governance remains machine-readable, auditable, and constitutionally sound.
