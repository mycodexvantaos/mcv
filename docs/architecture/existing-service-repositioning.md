# Existing Service Repositioning

## Overview

This document maps existing services to their new roles within the bilingual architecture
(TypeScript Control Plane + Python Intelligence Plane). No existing service is deleted or
renamed; instead, each is repositioned with clear boundaries and extended contracts.

## Repositioning Map

### Identity Layer

| Existing Service                             | New Role       | Plane      | Notes                                           |
| -------------------------------------------- | -------------- | ---------- | ----------------------------------------------- |
| `@mycodexvantaos/service-identity`           | Auth gateway   | TS Control | Already aligned; add policy-engine hooks        |
| `@mycodexvantaos/core` (identity sub-export) | Identity types | TS Control | Re-exported via `@mycodexvantaos/contracts-sdk` |

### Memory Layer

| Existing Service                              | New Role            | Plane               | Notes                             |
| --------------------------------------------- | ------------------- | ------------------- | --------------------------------- |
| `@mycodexvantaos/service-memory-dream`        | Dream orchestration | TS Control          | Dispatches to Python dream-worker |
| `python/packages/mycodexvantaos-memory-dream` | Dream execution     | Python Intelligence | Actual ML/NLP processing          |
| `python/apps/dream-worker`                    | Dream job runner    | Python Intelligence | Polls job table, executes dreams  |

### Knowledge Layer

| Existing Service                                    | New Role             | Plane               | Notes                              |
| --------------------------------------------------- | -------------------- | ------------------- | ---------------------------------- |
| `@mycodexvantaos/service-knowledge`                 | Knowledge CRUD API   | TS Control          | Delegates pipeline to Python       |
| `python/packages/mycodexvantaos-knowledge-pipeline` | Document processing  | Python Intelligence | Parsing, embedding, clustering     |
| `python/apps/knowledge-worker`                      | Knowledge job runner | Python Intelligence | Polls job table for pipeline tasks |

### Resource & Policy Layer

| Existing Service                                   | New Role         | Plane      | Notes                                         |
| -------------------------------------------------- | ---------------- | ---------- | --------------------------------------------- |
| `@mycodexvantaos/service-service-catalog`          | Service registry | TS Control | Already aligned                               |
| `@mycodexvantaos/core` (resource-model sub-export) | Resource types   | TS Control | Extended via `@mycodexvantaos/resource-model` |
| `@mycodexvantaos/core` (policy-model sub-export)   | Policy types     | TS Control | Extended via `@mycodexvantaos/policy-model`   |

### Infrastructure

| Existing Service                              | New Role         | Plane               | Notes                            |
| --------------------------------------------- | ---------------- | ------------------- | -------------------------------- |
| `@mycodexvantaos/service-audit`               | Audit event sink | TS Control          | Receives events from both planes |
| `@mycodexvantaos/service-chat`                | Chat gateway     | TS Control          | Delegates to Python agent-worker |
| `python/packages/mycodexvantaos-agent-worker` | Agent execution  | Python Intelligence | LLM orchestration                |

## Communication Pattern

```
TS API Gateway
  -> Policy Engine (TS) -> evaluates request
  -> Job Table (D1) -> enqueued
  -> Python Worker -> picks up job
  -> Report -> writes result
  -> TS Audit Log -> records outcome
```

## Migration Strategy

1. **Phase 1 - Contracts First**: All new contracts (events, policies, schemas) are defined
   before any code changes. Existing services adopt contracts incrementally.

2. **Phase 2 - Bridge Services**: New bridge services (`memory-store`, `memory-capture`,
   `knowledge-store`, `knowledge-trace`) provide the TS API surface while delegating
   to Python workers.

3. **Phase 3 - Gradual Delegation**: Existing services gain the ability to delegate
   compute-heavy operations to Python workers via the job table pattern.

4. **Phase 4 - Full Integration**: Both planes are fully operational with cross-language
   contract validation in CI.

## Non-Negotiable Rules

- Existing TS packages are NOT rewritten in Python
- Python workers are NOT ported to TypeScript
- Communication is ONLY via contracts (JSON Schema, YAML, events, policies)
- No direct imports between TS and Python codebases
- All 377 existing TypeScript tests must continue to pass
