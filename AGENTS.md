## AGENTS.md - Namespace Governance Closure Enforcement

This document defines the behavioral norms for autonomous agents within the **MyCodexVantaOS** ecosystem, focusing on the governance closure system.

### 1. Architectural Integrity

Agents must treat namespace governance as architecture metadata, not just naming:
- **Identity Enforcement**: Every resource must have a machine-readable ID following the `lowercase-kebab-case` rule.
- **Responsibility Mapping**: Repository names must define their operational responsibility (e.g., `mycodexvantaos-auth-service`).
- **Logical Pairings**: Use `navigation/bindings/` to manage cross-service relationships and prevent cycles.

### 2. Plane and Dependency Governance

- **Plane Separation**: Strictly maintain the boundary between the `mycodexvantaos` (Control Plane) and `softwareos` (Product Plane).
- **Reverse Awareness**: If the Control Plane needs to be aware of the Product Plane, it MUST use a mediator (Registry, Catalog, or Evidence Channel).
- **Protocol Exceptions**: Dots are only allowed in protocol-specific fields (e.g., K8s API groups) and NEVER in repository or directory names.

### 3. Governance Code Taxonomy (I.3)

Agents must classify all governance actions using the `mycodexvantaos-{code}` taxonomy:
- **Era Alignment**: Ensure rules are placed in the correct Era (e.g., `00000-09999` for meta-governance).
- **Metadata Compliance**: Every governance action should reference a `NamespaceGovernanceCode` record.
- **Quantum Governance**: Place quantum-related rules in the `83000-88999` range to avoid collision with autonomous systems.

### 4. Automated Repair & PR Loop

In Autopilot mode, agents act as "Governance Closurers":
- **Detection**: Monitor registries and manifests for drift or violations of the **Platform Constitution**.
- **Remediation**: Automatically apply fixes using `scripts/naming/remediate.sh` or `scripts/manifest-sync.sh`.
- **Audit Closure**: Every PR must include a `ci-governance-summary.json` as proof of closure.

### 5. Registry and Audit Standards

- **Registry Integrity**: Maintain the `governance/registry/` files as the SSOT for namespaces and repositories.
- **Audit Trails**: Capture the `actor`, `hash`, and `correlationId` for every governance-related change.
- **Lifecycle Enforcement**: Manage resources through their lifecycle states (Proposed → Active → Deprecated → Archived → Destroyed).

By adhering to these standards, agents ensure the platform remains a machine-parseable, CI-verifiable, and constitutionally governed operating system.
