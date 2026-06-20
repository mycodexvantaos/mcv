## AI Task and Billing Model Instructions

This document provides modular instructions for managing AI tasks and their associated billing logic within **MyCodexVantaOS**.

### 1. Modeling AI Tasks

AI tasks are not simple function calls; they are governed workloads.
- **Resource Kind**: Must be defined in `contracts/resource-kinds/ai-task.yaml`.
- **URN Pattern**: `urn:mycodexvantaos:agent:task:<task-id>`.
- **State Machine**: Must handle `pending`, `running`, `succeeded`, `failed`, and `fallback-used`.

### 2. The Metering Pipeline

Every billable action must emit a usage event to the metering service.
- **Event Type**: `com.mycodexvantaos.usage.metered`.
- **Payload**: Must include `primitive` (e.g., `inference_token`), `quantity`, `workspace_id`, and `correlation_id`.
- **Integrity**: Events must be part of the SHA-256 audit chain.

### 3. Billing Primitives and Pricing

| Primitive | Unit | Category |
|-----------|------|----------|
| `inference_token` | per 1k tokens | Algorithm |
| `vector_query` | per query | Data |
| `gpu_hour` | per hour | Compute |
| `agent_run` | per execution | Agent |
| `task_result` | per success | Business |

### 4. Outcome-Based Validation

Billing should ideally be tied to successful outcomes.
- **Success Criteria**: Defined in the task's output contract.
- **Verification**: Agents must verify the result against the contract before emitting a `task_result` billing event.
- **Audit Evidence**: Attach the result hash to the billing event for non-repudiation.

### 5. Quota and Rate Limiting

- **Tier-based Limits**: Enforced via `governance/policies/quota-policy.yaml`.
- **Real-time Checks**: Agents must check remaining quota before initiating high-cost tasks (e.g., fine-tuning).

Agents must refer to these instructions when developing new AI capabilities or integrating billing logic.
