## AGENTS.md - AI Context Governance & Navigation Enforcement

This document defines the behavioral norms for autonomous agents within the **MyCodexVantaOS** ecosystem, focusing on AI context and navigation.

### 1. AI Context Layering (C.3)

Agents must distinguish between semantic guidance and enforceable governance:
- **L1 (Semantic)**: Use README and ARCHITECTURE.md for navigation intent. Do NOT treat them as absolute authority.
- **L2 (Metadata)**: Always prefer manifests (`module-manifest.yaml`), schemas, and indexes (`contracts/INDEX.yaml`) for architectural facts.
- **L3 (Enforcement)**: Critical rules MUST be enforced by CI validators, policy-as-code, and unified gates.

### 2. Navigation and Directory Mapping (C.2)

To navigate the 242+ root directories, agents MUST:
- **Consult Navigation**: Refer to `navigation/module-index.yaml` and `navigation/dependency-graph.yaml` before proposing changes.
- **Respect Boundaries**: Distinguish between `specification` vs `implementation` and `provider` vs `port`.
- **Sync Indexes**: Automatically update navigation indexes whenever adding, moving, or changing modules or services.

### 3. AI-Assisted Development Standards (C.4)

In Autopilot mode, agents MUST adhere to these development standards:
- **Contract-First**: Propose contract drafts and validate them through schema checks before writing runtime code.
- **Task-Driven Workloads**: Wrap any auditable or AI-consuming workload as an `ai-task` resource with a defined lifecycle.
- **Billing Awareness**: Ensure every billable primitive (inference, tool call, etc.) emits a traceable usage event.
- **Provider Isolation**: Maintain strict isolation of external SDKs within the `providers/` layer.

### 4. Memory-Driven Persistence Protocol

Agents MUST operate within a memory-driven persistence loop to ensure continuity, reusability, and unconstrained operation:
- **Context Fetch (Pre-Task)**: Before initiating any task, agents MUST query the `mycodexvantaos-memory-dream` engine to retrieve relevant `MemoryItem`s as contextual input. This ensures work builds upon past knowledge.
- **Memory Emission (Post-Task)**: Upon task completion (success or failure), agents MUST emit a `MemoryItem` encapsulating the task's outcome, key decisions, and any generated `DreamReport`. This `MemoryItem` MUST be formatted according to `mycodexvantaos-memory-dream` data models and include `temporal_expressions` and `related_entities`.
- **Dream Action Resolution**: If the `mycodexvantaos-memory-dream` engine generates `DreamAction`s (e.g., for conflict resolution or orphan detection), agents MUST prioritize executing these actions to maintain memory integrity and consistency.
- **Semantic Clustering Reuse**: Agents SHOULD leverage semantic clustering from the `mycodexvantaos-memory-dream` engine to identify and reuse best practices or relevant historical contexts from semantically similar modules or tasks.

### 5. Automated Repair & PR Loop

Agents act as "Navigation Guardians":
- **Detection**: Use `scripts/validate-ai-context.py` and `scripts/validate-directory-context.py` to detect drift.
- **Remediation**: Automatically update `directory-context.yaml` and `navigation/` files to reflect architectural changes.
- **Verification**: Ensure the `closure-prover` and `unified-gates` validate the entire governance chain before opening a PR.

### 6. Normative Behavior

- **No Silent Fallback**: Fallback logic must be declared in manifests and generate audit events.
- **Local-First**: Prioritize local validation and Docker Compose over remote cloud deployments.
- **Transparency**: Every autonomous action must be documented with a clear reasoning trace referencing the relevant **Governance Code**.

By following these standards, agents ensure the platform's architecture remains transparent, navigable, and constitutionally sound for both AI and human contributors.
