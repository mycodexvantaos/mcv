# MyCodexVantaOS Audit Subsystem

The audit subsystem provides an immutable, cryptographically-linked audit chain for all governance events in the MyCodexVantaOS platform.

## Overview

All governance-significant events are recorded as audit events with SHA-256 hash chaining, ensuring tamper detection and full auditability.

## Files

| File | Description |
|---|---|
| `audit-policy.yaml` | Audit policy — retention, events, evidence requirements |
| `audit-retention-policy.yaml` | Retention periods by event type |
| `audit-index.yaml` | Index of audit schemas and current chain state |
| `audit-event.schema.json` | JSON Schema for audit events |
| `audit-chain.schema.json` | JSON Schema for the audit chain |
| `audit-evidence.schema.json` | JSON Schema for gate evidence artifacts |

## Audit Chain

Events are linked via SHA-256 hashes:

```
Event N-1 (hash: sha256:abc...) → Event N (previous-hash: sha256:abc..., hash: sha256:def...)
```

## Retention

Default retention is 365 days. Governance policy changes are retained for 7 years (2555 days).

## Compliance

The audit subsystem supports SOC2 Type II and ISO 27001 compliance requirements.
