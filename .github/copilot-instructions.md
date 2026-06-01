## GitHub Copilot CLI Instructions for MyCodexVantaOS

This document defines the unified architectural standards and operational guidelines for the **MyCodexVantaOS** Monorepo, an AI-native upstream infrastructure platform.

### 1. Platform Positioning & Identity

- **Positioning**: **MyCodexVantaOS** is a vertically integrated upstream AI infrastructure platform unifying compute, data, algorithms, agents, and contracts.
- **Brand Identity**: **MyCodexVantaOS** (Human-facing).
- **Machine Identity**: **mycodexvantaos** (Machine-facing, all lowercase, no special characters).
- **Core Principles**: Local-first, Cloud-agnostic, Contract-first, Governance-enforced.

### 2. The Seven Platform Foundations

Agents must align all work with the seven strategic foundations defined in `foundation/`:
1. **Compute**: AI chips, GPUs, inference pools, and workload scheduling.
2. **Data**: Datasets, vector databases, RAG-ready assets, and data governance.
3. **Algorithm**: Model routing, BYOK, fine-tuning, and evaluation pipelines.
4. **Agent**: Runtime, memory, tool calling (MCP), and workflow DAGs.
5. **Contract**: Declarative task contracts, service manifests, and URNs.
6. **Governance**: Policy-as-code, audit chains, and CI gates.
7. **Business**: Metering, quota, and outcome-based AI billing.

### 3. Manifest & Contract Governance

"If there is no contract, there is no implementation."
- **Root Module**: `<root>/mycodexvantaos-module.yaml`
- **Service**: `modules/<service-id>/module-manifest.yaml`
- **Provider**: `providers/<cap>/<id>/provider-manifest.yaml`
- **Foundation**: `foundation/<name>-foundation/foundation.yaml`

### 4. Outcome-Based Billing & AI Task Model

AI work is modeled as a governed **AI Task** resource with a clear lifecycle:
`pending → scheduled → running → succeeded / failed / cancelled / fallback-used`.

**Billing Loop**:
`task submitted → provider selected → executed → result produced → usage event → metering → billing model → invoice/quota`.

### 5. Runtime Modes & Provider Abstraction

Production environments MUST explicitly set the runtime mode. `auto` is for startup only.
- **native**: Local, CI, offline, disaster recovery.
- **connected**: Full external provider integration.
- **hybrid**: Partial provider availability with fallback.

All external systems (DB, Storage, AI) MUST be accessed through **Provider Adapters** defined in `providers/`.

### 6. Automated Repair Loop (Autopilot)

Follow the **Detect → Classify → Fix → PR** loop:
1. **Detect**: Scan for naming, contract, or foundation violations.
2. **Classify**: Categorize as Hard Rule (Blocker) or Soft Rule (Warning).
3. **Fix**: Apply remediation scripts (e.g., `naming-remediate.sh`, `manifest-sync.sh`).
4. **PR**: Create a signed PR with audit fields: `actor`, `hash`, `version`, `correlationId`.

For detailed domain knowledge, refer to modular instructions in `.github/instructions/`.
