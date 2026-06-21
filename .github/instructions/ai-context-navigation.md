## AI Context Governance and Navigation Instructions

This document provides modular instructions for managing AI-readable architectural context and navigation within **MyCodexVantaOS**.

### 1. The Three-Layer Context Model (C.3)

| Layer  | Type       | Artifacts                              | Purpose             |
| ------ | ---------- | -------------------------------------- | ------------------- |
| **L1** | Semantic   | README, ARCHITECTURE.md, @ai-context   | Intent and Guidance |
| **L2** | Metadata   | Manifests, Schemas, INDEX.yaml         | Structured Facts    |
| **L3** | Governance | CI Validators, Policies, Unified Gates | Hard Enforcement    |

### 2. Navigation Protocols (C.2)

- **Root Navigation**: Use `navigation/` to locate modules and dependencies.
- **Local Context**: Every high-value directory SHOULD have a `directory-context.yaml` and a local `README.md`.
- **Sync Rule**: Any change to a module's role or dependencies MUST be reflected in the `navigation/` indexes.

### 3. AI Development Instructions (C.4.2)

When generating code or documentation, agents MUST:

1. **Be Task-Driven**: Wrap workloads in `ai-task` resources.
2. **Be Contract-First**: Propose contracts before implementation.
3. **Be Billing-Aware**: Emit usage events for all billable operations.
4. **Enforce Isolation**: Use `providers/` for all external SDKs.
5. **Enforce Governance**: Document rules in L1/L2 and enforce them in L3.

### 4. Normalized Principles (C.5)

- **Cloud-Agnostic**: "Edge-adapter ready, cloud-agnostic, local-first."
- **Data Strategy**: Vector/hybrid search for knowledge; Relational for metadata/transactions.
- **No Silent Fallback**: All fallbacks must be declared and auditable.

### 5. Validation and Repair

- **Guard**: Use `validate-ai-context` and `validate-directory-context` to check for drift.
- **Repair**: Automatically update navigation indexes and local context files when drift is detected.

Agents must refer to these instructions when assisting with development or navigating the repository.
