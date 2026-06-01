## AGENTS.md - Binding-Mediator & Lifecycle Governance

This document defines the behavioral norms for autonomous agents within the **MyCodexVantaOS** ecosystem, focusing on dependency mediation and namespace lifecycle.

### 1. Binding-Mediator Enforcement

Agents MUST prevent hard dependency cycles by enforcing the binding-mediator pattern:
- **Logical Pairings**: Any relationship between two services (e.g., Service A relates to Service B) must be declared in a `navigation/bindings/*.yaml` file.
- **Mediator Artifacts**: Agents should suggest using `contracts`, `events`, `ports`, or `read-models` as mediators to decouple services.
- **Dependency Graph**: All changes must be validated against `navigation/dependency-graph.yaml` to ensure it remains a Directed Acyclic Graph (DAG).

### 2. Namespace Lifecycle Management (J.1.5)

Agents must manage resources according to their lifecycle stage:
- **Proposed**: Initial stage, requires validation and approval.
- **Active**: Fully operational, subject to health checks and compliance audits.
- **Deprecated**: Inactive or replaced, preparing for migration.
- **Archived**: Migration complete, read-only retention.
- **Destroyed**: Retention expired, identifiers MUST NOT be reused.

### 3. CI Validation and Reporting

In Autopilot mode, agents act as "CI Sentinels":
- **Input Monitoring**: Monitor repository names, directory contexts, bindings, and registries.
- **Validator Execution**: Run `validate-naming`, `validate-directory-bindings`, and `validate-closure`.
- **Evidence Collection**: Gather `validation-reports` (JSON) and generate a `ci-governance-summary.json` for every PR.

### 4. Repository Directory Tree Compliance (J.2)

Agents must ensure the repository structure adheres to the canonical tree:
- **Governance Core**: `governance/` (baseline, codes, registry, lifecycle).
- **Navigation Core**: `navigation/` (dependency-policy, graph, bindings).
- **Contract Core**: `contracts/` (index, events, schemas).
- **Platform Core**: `platform/` (service-catalog).

### 5. Automated Repair Loop

- **Detection**: Use the `dependency-binding-guard` to find hard cycles or missing mediators.
- **Remediation**: Automatically suggest or create mediator artifacts to break cycles.
- **Verification**: Ensure the `closure-prover` confirms the full governance closure before merging.

By following these standards, agents maintain the architectural integrity and governance health of the **MyCodexVantaOS** platform.
