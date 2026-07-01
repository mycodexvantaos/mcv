# Architecture Instructions

## Platform Layers

The platform uses a strict layered architecture with unidirectional dependencies.

### Layer A: Builder Layer (Generation)

- **Location**: `packages/builder`, `packages/*-generator`
- **Purpose**: Generate application skeletons from requirements, templates, or configuration
- **Includes**: UI generator, API generator, Schema generator, Workflow generator, Test generator, Deployment manifest generator
- **Output**: `frontend/`, `backend/`, `shared/`, `schema/`, `workflows/`, `deploy/`, `tests/`, `docs/`

### Layer B: Runtime Layer (Execution)

- **Location**: `packages/runtime`, `packages/core-*`
- **Purpose**: Core execution engine
- **Includes**: Core kernel, core gateway, core auth, core config
- **Key Principle**: Must function with zero external dependencies (local-first)

### Layer C: Deployment Layer (Infrastructure)

- **Location**: `infra/`, `packages/deployment-manifest-generator`
- **Purpose**: Infrastructure management and deployment
- **Target**: Cloudflare (Workers, D1, KV, R2)

### Layer D: Native Services Layer

- **Location**: `packages/service-*`, `services/`
- **Purpose**: Platform microservices
- **Includes**: Service discovery, config sync, storage, database, events, monitoring
- **Key Principle**: All must have native local implementations

### Layer E: AI Layer

- **Location**: `src/ai/`, `packages/ai-*`, `modules/mycodexvantaos-ai-*`
- **Purpose**: AI/ML capabilities
- **Framework**: Google Genkit (NOT LangChain)
- **Services**: AI agent, AI embedding, AI LLM, AI memory, AI team orchestrator

### Layer F: Python Plane

- **Location**: `python/`
- **Purpose**: Specialized Python services
- **Includes**: CI repair agent, agent worker, dream worker
- **Framework**: FastAPI, managed with `uv`

## Dependency Rules

```
Builder → Runtime → Native Services
                 → AI Layer
                 → Python Plane (via API contracts)
Deployment ← All layers (infrastructure support)
```

### Forbidden Dependencies

- ❌ Runtime → Builder (runtime must not depend on generators)
- ❌ Native Services → Builder (services must not depend on generators)
- ❌ Cross-service direct imports (use contracts/APIs)
- ❌ Business logic → Third-party SDKs (use Provider abstraction)

## Provider Pattern

All external services MUST be accessed through Provider abstractions:

```typescript
// CORRECT: Provider abstraction
import { StorageProvider } from "@mycodexvantaos/core-config";

class MyService {
  constructor(private storage: StorageProvider) {}

  async save(data: unknown) {
    await this.storage.put("key", data);
  }
}

// WRONG: Direct SDK usage in business logic
import { S3Client } from "@aws-sdk/client-s3"; // NEVER in business logic
```

## Contract-First Development

### Creating New Contracts

1. Define schema in `schemas/` or `contracts/`
2. Add to `packages/mycodexvantaos-contracts-sdk/`
3. Validate: `npm run contracts:validate`
4. Implement service against the contract
5. Test: `npm run test:contracts`

### Modifying Existing Contracts

1. Check all consumers of the contract
2. Ensure backward compatibility (or coordinate breaking change)
3. Update contract definition
4. Update all implementations
5. Validate and test

## Governance Rules

### Naming Convention (Enforced by CI)

| Type              | Pattern                                | Example                             |
| ----------------- | -------------------------------------- | ----------------------------------- |
| Service directory | `mycodexvantaos-<domain>-<capability>` | `mycodexvantaos-ai-memory`          |
| Package scope     | `@mycodexvantaos/<capability>`         | `@mycodexvantaos/core-gateway`      |
| Module directory  | `mycodexvantaos-<domain>-<capability>` | `mycodexvantaos-governance-policy`  |
| Schema file       | `<domain>/<entity>.schema.json`        | `ai-team/agent-profile.schema.json` |
| Workflow file     | `<descriptive-name>.yml`               | `ci-repair-agent.yml`               |

### Capability Declaration

Every new service/package that introduces capabilities must:

1. Declare capabilities in `governance.json`
2. Use URN format: `urn:mycodexvantaos:capability:<name>`
3. Pass governance check: `npm run governance:check`

### Architecture Compliance

- Layer boundaries must not be violated
- Circular dependencies are forbidden
- All services must be independently deployable
- All packages must have explicit dependency declarations

## Creating New Components

### New Package

```bash
mkdir packages/<name>
# Create package.json, tsconfig.json, src/index.ts
# Add to workspace if using workspaces
# Run npm run governance:check
```

### New Service

```bash
mkdir services/mycodexvantaos-<domain>-<capability>
# Create package.json, tsconfig.json, src/index.ts
# Define contracts first
# Add to governance.json if new capabilities
# Run npm run governance:check
```

### New Module

```bash
mkdir modules/mycodexvantaos-<domain>-<capability>
# Create package.json, tsconfig.json, src/index.ts
# Modules compose multiple packages/services
# Run npm run governance:check
```
