## GitHub Copilot CLI Instructions for MyCodexVantaOS

This document defines the unified architectural standards and operational guidelines for the **MyCodexVantaOS** Monorepo, incorporating the **AI Context Governance and Navigation Specification**.

### 1. Three-Layer AI Context Model (C.3)

To ensure consistent AI assistance and platform integrity, the repository uses a three-layer context model:
- **L1: Semantic Guidance**: README, ARCHITECTURE.md, and @ai-context annotations provide intent and navigation (Advisory).
- **L2: Architectural Metadata**: Schemas, manifests, and indexes provide structured facts (Validateable).
- **L3: Governance Gates**: CI validators, policy-as-code, and unified gates provide enforcement (Mandatory).

### 2. AI-Assisted Development Principles (C.4)

When assisting in development, agents MUST follow these principles:
- **Task-Driven**: Any auditable, meterable, or AI-consuming workload MUST be represented as an `ai-task` resource.
- **Contract-First**: Propose and validate contracts (OpenAPI, Events, Schemas) before implementing runtime code.
- **Billing-Aware**: Every billable operation (inference, embedding, etc.) MUST emit a usage event traceable to the `billing-model/`.
- **Provider Isolation**: Never import provider SDKs directly into `core/` or `ports/`. Use `providers/` adapters.
- **Navigation Sync**: Update `navigation/` indexes whenever root modules, services, or contracts change.

### 3. Repository Navigation & Directory Layers (C.2)

The repository uses a large flat structure (242+ directories). Agents MUST use the following layers for navigation:
- **Foundation Layer**: `foundation/` (Strategic specifications).
- **Contract Layer**: `contracts/`, `schemas/`, `events/`.
- **Governance Layer**: `mycodexvantaos-namespace-governance/`, `unified-gates/`.
- **Navigation Layer**: `navigation/` (Dependency graph, module index).

### 4. Normative Positions (C.5)

- **Cloud-Agnostic**: The platform is "Edge-adapter ready, cloud-agnostic, local-first." Cloudflare is an adapter, not the foundation.
- **Relational Data**: Relational databases primarily carry metadata, audit chains, and billing ledgers. Semantic retrieval prefers vector/hybrid search.
- **No Silent Fallback**: Fallback behavior must be manifest-declared, policy-allowed, and audit-logged.

### 5. Automated Repair Loop (Autopilot)

In Autopilot mode, follow the **Detect → Classify → Fix → PR** loop:
1. **Detect**: Use L2 metadata and L3 gates to find architectural or governance drift.
2. **Classify**: Map violations to the correct **Governance Code** (e.g., `mycodexvantaos-00100` for naming).
3. **Fix**: Apply remediation scripts and update navigation/registries.
4. **PR**: Create a signed PR with a `ci-governance-summary.json` as proof of closure.

For detailed domain knowledge, refer to modular instructions in `.github/instructions/`.
