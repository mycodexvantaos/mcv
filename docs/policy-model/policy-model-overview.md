# Policy Model Overview

## Purpose

The Policy Model enables declarative policy enforcement across the platform. Policies
define rules that govern:

- Access control (who can do what)
- Resource quotas (how many of what)
- Data governance (where data can go)
- Operational constraints (when actions are allowed)

## Architecture

- **Package**: `@mycodexvantaos/policy-model`
- **Core Types**: Re-exported from `@mycodexvantaos/core`
- **Contract**: `contracts/policies/*.yaml` (5 policy contract definitions)
- **Schema**: `contracts/schemas/policy.schema.json`

## Policy Evaluation Flow

1. Request arrives at TS API Gateway
2. Policy Engine loads applicable policies from contract definitions
3. Request context is evaluated against policy rules
4. If allowed, request proceeds; if denied, 403 response with policy reference
5. Decision is recorded in audit log

## Policy Contracts

| Contract             | Purpose                | Scope            |
| -------------------- | ---------------------- | ---------------- |
| `access-control`     | RBAC/ABAC rules        | Per-workspace    |
| `resource-quota`     | Resource limits        | Per-workspace    |
| `data-governance`    | Data residency rules   | Per-organization |
| `rate-limit`         | API rate limits        | Per-service      |
| `operational-window` | Time-based constraints | Per-service      |

## Integration with Python Plane

Policies are evaluated in the TS control plane. Python workers receive the
policy decision as part of the job context and must honor the constraints.
For example, a `data-governance` policy may restrict which knowledge collections
a Python worker can access during embedding generation.
