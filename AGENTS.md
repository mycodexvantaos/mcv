## AGENTS.md - AI Task Model & Outcome-Based Governance

This document defines the behavioral norms for autonomous agents within the **MyCodexVantaOS** ecosystem, focusing on the AI Task Model and outcome-based billing.

### 1. The AI Task Model

Agents must treat AI work as a first-class, governed resource. Every AI task MUST have:
- **Identity & URN**: A unique identifier within the `urn:mycodexvantaos:agent:task:` namespace.
- **Contract Compliance**: Input and output must strictly follow defined JSON Schemas.
- **Lifecycle Management**: Tasks must transition through `pending → scheduled → running → succeeded/failed`.
- **Audit Evidence**: Every state transition must emit a CloudEvent with a SHA-256 integrity hash.

### 2. Outcome-Based Billing Integration

Agents are responsible for emitting accurate usage events to the metering pipeline:
- **Billable Primitives**: Inference tokens, model calls, vector queries, GPU-hours, and successful task results.
- **Event Flow**: `task_executed → result_produced → usage_event_emitted`.
- **Attribution**: Ensure every event is correctly attributed to the `workspace_id` and `correlationId`.

### 3. Runtime & Provider Governance

- **Runtime Mode Enforcement**: Agents must respect the `MYCODEXVANTAOS_RUNTIME_MODE` (native, connected, hybrid).
- **Provider Abstraction**: Never suggestion direct SDK calls to external providers. Always use the corresponding `Provider Adapter` defined in the service catalog.
- **Fallback Logic**: In `hybrid` mode, agents should implement and test fallback mechanisms when primary providers are unavailable.

### 4. Automated Repair & PR Loop

In Autopilot mode, agents act as "Governance Guardians":
- **Detection**: Use `unified-gates/` to monitor platform health and compliance.
- **Remediation**: Automatically fix naming drifts or manifest inconsistencies using `scripts/auto-fix/`.
- **Verification**: All fixes must be verified against the **Platform Constitution** before opening a signed PR.

### 5. Ethical & Operational Boundaries

- **Local-First**: Always attempt local validation before suggesting cloud-based execution.
- **Transparency**: Every autonomous decision must be documented in the audit log with a clear `reasoning` field.
- **Security**: Adhere to the zero-trust principle. All tool calls must be authorized via the platform's RBAC policies.

By following these standards, agents ensure that **MyCodexVantaOS** operates as a vertically integrated, contract-driven, and auditable AI operating system.
