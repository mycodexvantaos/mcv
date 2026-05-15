#!/bin/bash
# Platform Control Plane Expansion - Scaffold Generator
# Creates all skeleton files for the bilingual architecture expansion
set -e

BASE="/workspace/mycodexvantaos"
CREATED=0
SKIPPED=0

write() {
    local path="$1"
    local full="$BASE/$path"
    if [ -f "$full" ]; then
        SKIPPED=$((SKIPPED + 1))
        return
    fi
    mkdir -p "$(dirname "$full")"
    cat > "$full"
    CREATED=$((CREATED + 1))
    echo "  ✅ $path"
}

echo "═══════════════════════════════════════════════════════"
echo "§5 - TypeScript Control Plane Packages (8 packages)"
echo "═══════════════════════════════════════════════════════"

# service-catalog
write "packages/mycodexvantaos-service-catalog/package.json" << 'ENDOFFILE'
{
  "name": "@mycodexvantaos/mycodexvantaos-service-catalog",
  "version": "0.1.0",
  "description": "Service catalog model - service definitions, categories, capabilities, permissions, runtime metadata",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \"TODO: add tests\" && exit 0"
  },
  "keywords": ["mycodexvantaos", "service-catalog"],
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  },
  "dependencies": {
    "@mycodexvantaos/core": "workspace:*"
  }
}
ENDOFFILE

write "packages/mycodexvantaos-service-catalog/tsconfig.json" << 'ENDOFFILE'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
ENDOFFILE

write "packages/mycodexvantaos-service-catalog/README.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-service-catalog

Service catalog model - service definitions, categories, capabilities, permissions, runtime metadata

## Core Types

- `ServiceDefinition`
- `ServiceCategory`
- `ServiceCapability`
- `ServicePermission`
- `ServiceRuntimeSupport`

## Usage

```typescript
import { ServiceDefinition, ServiceCategory, ServiceCapability } from '@mycodexvantaos/mycodexvantaos-service-catalog';
```

## Status

🚧 Skeleton - typed interfaces with TODO markers for implementation.
ENDOFFILE

write "packages/mycodexvantaos-service-catalog/CHANGELOG.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-service-catalog

## 0.1.0 (2025-05-15)

- Initial skeleton with typed interfaces
- Re-exports from @mycodexvantaos/core where applicable
ENDOFFILE

write "packages/mycodexvantaos-service-catalog/src/index.ts" << 'ENDOFFILE'
/**
 * @mycodexvantaos/mycodexvantaos-service-catalog
 * Service catalog model - service definitions, categories, capabilities, permissions, runtime metadata
 */

// Re-export from core constitution
export * from '@mycodexvantaos/core/service-catalog';

// Extended types for standalone package
export interface ServiceDependency {
  serviceId: string;
  required: boolean;
  minVersion?: string;
}

export interface ServiceRuntimeSupport {
  portable: boolean;
  supported: ('cloudflare-workers' | 'node-server' | 'docker-container' | 'kubernetes-pod')[];
}
ENDOFFILE

# resource-model
write "packages/mycodexvantaos-resource-model/package.json" << 'ENDOFFILE'
{
  "name": "@mycodexvantaos/mycodexvantaos-resource-model",
  "version": "0.1.0",
  "description": "Resource model - resource kinds, metadata, spec, status, lifecycle, references",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \"TODO: add tests\" && exit 0"
  },
  "keywords": ["mycodexvantaos", "resource-model"],
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  },
  "dependencies": {
    "@mycodexvantaos/core": "workspace:*"
  }
}
ENDOFFILE

write "packages/mycodexvantaos-resource-model/tsconfig.json" << 'ENDOFFILE'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
ENDOFFILE

write "packages/mycodexvantaos-resource-model/README.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-resource-model

Resource model - resource kinds, metadata, spec, status, lifecycle, references

## Core Types

- `ResourceKind`
- `ResourceMetadata`
- `ResourceSpec`
- `ResourceStatus`
- `ResourceReference`

## Usage

```typescript
import { ResourceKind, ResourceMetadata, ResourceSpec } from '@mycodexvantaos/mycodexvantaos-resource-model';
```

## Status

🚧 Skeleton - typed interfaces with TODO markers for implementation.
ENDOFFILE

write "packages/mycodexvantaos-resource-model/CHANGELOG.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-resource-model

## 0.1.0 (2025-05-15)

- Initial skeleton with typed interfaces
- Re-exports from @mycodexvantaos/core where applicable
ENDOFFILE

write "packages/mycodexvantaos-resource-model/src/index.ts" << 'ENDOFFILE'
/**
 * @mycodexvantaos/mycodexvantaos-resource-model
 * Resource model - resource kinds, metadata, spec, status, lifecycle, references
 */

// Re-export from core constitution
export * from '@mycodexvantaos/core/resource-model';

// Extended types for standalone package
export type ResourceKind = string;

export interface ResourceSpec {
  [key: string]: unknown;
}

export interface ResourceStatus {
  phase: string;
  conditions?: Record<string, unknown>;
  observedGeneration?: number;
}
ENDOFFILE

# policy-model
write "packages/mycodexvantaos-policy-model/package.json" << 'ENDOFFILE'
{
  "name": "@mycodexvantaos/mycodexvantaos-policy-model",
  "version": "0.1.0",
  "description": "Policy model - subject, action, resource, condition, effect, evaluation result",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \"TODO: add tests\" && exit 0"
  },
  "keywords": ["mycodexvantaos", "policy-model"],
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  },
  "dependencies": {
    "@mycodexvantaos/core": "workspace:*"
  }
}
ENDOFFILE

write "packages/mycodexvantaos-policy-model/tsconfig.json" << 'ENDOFFILE'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
ENDOFFILE

write "packages/mycodexvantaos-policy-model/README.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-policy-model

Policy model - subject, action, resource, condition, effect, evaluation result

## Core Types

- `PolicyDefinition`
- `PolicySubject`
- `PolicyAction`
- `PolicyResource`
- `PolicyCondition`
- `PolicyEffect`
- `PolicyEvaluationResult`

## Status

🚧 Skeleton - typed interfaces with TODO markers for implementation.
ENDOFFILE

write "packages/mycodexvantaos-policy-model/CHANGELOG.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-policy-model

## 0.1.0 (2025-05-15)

- Initial skeleton with typed interfaces
- Re-exports from @mycodexvantaos/core where applicable
ENDOFFILE

write "packages/mycodexvantaos-policy-model/src/index.ts" << 'ENDOFFILE'
/**
 * @mycodexvantaos/mycodexvantaos-policy-model
 * Policy model - subject, action, resource, condition, effect, evaluation result
 */

// Re-export from core constitution
export * from '@mycodexvantaos/core/policy-model';

// Extended types for standalone package
export type PolicyEffect = 'allow' | 'deny' | 'require-review';

export interface PolicyEvaluationResult {
  allowed: boolean;
  effect: PolicyEffect;
  matchedPolicies: string[];
  reason?: string;
}
ENDOFFILE

# audit-model
write "packages/mycodexvantaos-audit-model/package.json" << 'ENDOFFILE'
{
  "name": "@mycodexvantaos/mycodexvantaos-audit-model",
  "version": "0.1.0",
  "description": "Audit model - audit events, actor, resource reference, trace context, integrity metadata",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \"TODO: add tests\" && exit 0"
  },
  "keywords": ["mycodexvantaos", "audit-model"],
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  },
  "dependencies": {
    "@mycodexvantaos/core": "workspace:*"
  }
}
ENDOFFILE

write "packages/mycodexvantaos-audit-model/tsconfig.json" << 'ENDOFFILE'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
ENDOFFILE

write "packages/mycodexvantaos-audit-model/README.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-audit-model

Audit model - audit events, actor, resource reference, trace context, integrity metadata

## Core Types

- `AuditEvent`
- `AuditActor`
- `AuditResource`
- `AuditContext`
- `AuditIntegrity`

## Status

🚧 Skeleton - typed interfaces with TODO markers for implementation.
ENDOFFILE

write "packages/mycodexvantaos-audit-model/CHANGELOG.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-audit-model

## 0.1.0 (2025-05-15)

- Initial skeleton with typed interfaces
- Re-exports from @mycodexvantaos/core where applicable
ENDOFFILE

write "packages/mycodexvantaos-audit-model/src/index.ts" << 'ENDOFFILE'
/**
 * @mycodexvantaos/mycodexvantaos-audit-model
 * Audit model - audit events, actor, resource reference, trace context, integrity metadata
 */

// Re-export from core constitution
export * from '@mycodexvantaos/core/audit-model';

// Extended types for standalone package
export interface AuditActor {
  subjectId: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditResource {
  kind: string;
  id: string;
  urn: string;
}

export interface AuditContext {
  correlationId: string;
  parentEventId?: string;
  traceId?: string;
}

export interface AuditIntegrity {
  hash: string;
  previousHash?: string;
  chainIndex: number;
}
ENDOFFILE

# knowledge-model
write "packages/mycodexvantaos-knowledge-model/package.json" << 'ENDOFFILE'
{
  "name": "@mycodexvantaos/mycodexvantaos-knowledge-model",
  "version": "0.1.0",
  "description": "Knowledge model - document, chunk, collection, retrieval receipt, answer trace, issue, repair",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \"TODO: add tests\" && exit 0"
  },
  "keywords": ["mycodexvantaos", "knowledge-model"],
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  },
  "dependencies": {
    "@mycodexvantaos/core": "workspace:*"
  }
}
ENDOFFILE

write "packages/mycodexvantaos-knowledge-model/tsconfig.json" << 'ENDOFFILE'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
ENDOFFILE

write "packages/mycodexvantaos-knowledge-model/README.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-knowledge-model

Knowledge model - document, chunk, collection, retrieval receipt, answer trace, issue, repair

## Core Types

- `DocumentResource`
- `DocumentChunk`
- `KnowledgeCollection`
- `RetrievalReceipt`
- `AnswerTrace`
- `KnowledgeIssue`
- `KnowledgeRepair`

## Status

🚧 Skeleton - typed interfaces with TODO markers for implementation.
ENDOFFILE

write "packages/mycodexvantaos-knowledge-model/CHANGELOG.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-knowledge-model

## 0.1.0 (2025-05-15)

- Initial skeleton with typed interfaces
- Re-exports from @mycodexvantaos/core where applicable
ENDOFFILE

write "packages/mycodexvantaos-knowledge-model/src/index.ts" << 'ENDOFFILE'
/**
 * @mycodexvantaos/mycodexvantaos-knowledge-model
 * Knowledge model - document, chunk, collection, retrieval receipt, answer trace, issue, repair
 */

// Re-export from core constitution
export * from '@mycodexvantaos/core/knowledge-model';
ENDOFFILE

# memory-model (NEW - no re-export from core)
write "packages/mycodexvantaos-memory-model/package.json" << 'ENDOFFILE'
{
  "name": "@mycodexvantaos/mycodexvantaos-memory-model",
  "version": "0.1.0",
  "description": "Memory model - memory item, candidate, relation, conflict, dream run, dream action, dream report",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \"TODO: add tests\" && exit 0"
  },
  "keywords": ["mycodexvantaos", "memory-model"],
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
ENDOFFILE

write "packages/mycodexvantaos-memory-model/tsconfig.json" << 'ENDOFFILE'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
ENDOFFILE

write "packages/mycodexvantaos-memory-model/README.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-memory-model

Memory model - memory item, candidate, relation, conflict, dream run, dream action, dream report

## Core Types

- `MemoryItem`
- `MemoryCandidate`
- `MemoryRelation`
- `MemoryConflict`
- `MemoryDreamRun`
- `MemoryDreamAction`
- `MemoryDreamReport`

## Status

🚧 Skeleton - typed interfaces with TODO markers for implementation.
ENDOFFILE

write "packages/mycodexvantaos-memory-model/CHANGELOG.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-memory-model

## 0.1.0 (2025-05-15)

- Initial skeleton with typed interfaces
ENDOFFILE

write "packages/mycodexvantaos-memory-model/src/index.ts" << 'ENDOFFILE'
/**
 * @mycodexvantaos/mycodexvantaos-memory-model
 * Memory model - memory item, candidate, relation, conflict, dream run, dream action, dream report
 */

export type MemoryStatus =
  | 'candidate'
  | 'active'
  | 'reinforced'
  | 'merged'
  | 'deprecated'
  | 'orphaned'
  | 'archived'
  | 'rejected';

export type ActiveMemoryStatus = 'active' | 'reinforced';

export type PassiveMemoryStatus = 'candidate' | 'merged' | 'deprecated' | 'orphaned' | 'archived' | 'rejected';

export interface MemoryItem {
  memoryId: string;
  content: string;
  tags: string[];
  relatedEntities: string[];
  temporalExpressions: string[];
  memoryType: 'observation' | 'reflection' | 'decision' | 'event' | 'fact' | 'opinion' | 'plan' | 'system';
  status: MemoryStatus;
  conflictsWith: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryCandidate {
  candidateId: string;
  content: string;
  source: string;
  tags: string[];
  status: 'candidate';
  promotedTo?: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface MemoryRelation {
  relationId: string;
  fromMemoryId: string;
  toMemoryId: string;
  relationType: 'supports' | 'contradicts' | 'derived-from' | 'related-to' | 'temporal-successor';
  strength: number;
  createdAt: string;
}

export interface MemoryConflict {
  conflictId: string;
  memoryIds: string[];
  conflictType: 'factual' | 'temporal' | 'semantic';
  severity: 'low' | 'medium' | 'high';
  status: 'detected' | 'reviewing' | 'resolved';
  resolution?: string;
  detectedAt: string;
  resolvedAt?: string;
}

export interface MemoryDreamRun {
  dreamRunId: string;
  memoryItems: MemoryItem[];
  dryRun: boolean;
  proposalMode: boolean;
  autoApply: boolean;
  createdAt: string;
}

export interface MemoryDreamAction {
  actionType: 'merge' | 'resolve' | 'mark_orphan' | 'delete';
  targetMemoryId: string;
  relatedMemoryId?: string;
  reason: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface MemoryDreamReport {
  dreamRunId: string;
  processedAt: string;
  totalMemories: number;
  duplicatesFound: number;
  conflictsFound: number;
  orphansFound: number;
  actions: MemoryDreamAction[];
  statistics?: Record<string, unknown>;
}
ENDOFFILE

# runtime-model (NEW - no re-export from core)
write "packages/mycodexvantaos-runtime-model/package.json" << 'ENDOFFILE'
{
  "name": "@mycodexvantaos/mycodexvantaos-runtime-model",
  "version": "0.1.0",
  "description": "Runtime model - runtime definition, provider definition, adapter capability, health, portability",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \"TODO: add tests\" && exit 0"
  },
  "keywords": ["mycodexvantaos", "runtime-model"],
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
ENDOFFILE

write "packages/mycodexvantaos-runtime-model/tsconfig.json" << 'ENDOFFILE'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
ENDOFFILE

write "packages/mycodexvantaos-runtime-model/README.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-runtime-model

Runtime model - runtime definition, provider definition, adapter capability, health, portability

## Core Types

- `RuntimeDefinition`
- `ProviderDefinition`
- `AdapterCapability`
- `RuntimeHealth`
- `RuntimePortability`

## Status

🚧 Skeleton - typed interfaces with TODO markers for implementation.
ENDOFFILE

write "packages/mycodexvantaos-runtime-model/CHANGELOG.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-runtime-model

## 0.1.0 (2025-05-15)

- Initial skeleton with typed interfaces
ENDOFFILE

write "packages/mycodexvantaos-runtime-model/src/index.ts" << 'ENDOFFILE'
/**
 * @mycodexvantaos/mycodexvantaos-runtime-model
 * Runtime model - runtime definition, provider definition, adapter capability, health, portability
 */

export interface RuntimeDefinition {
  id: string;
  displayName: string;
  description: string;
  providers: ProviderDefinition[];
  supportedServices: string[];
  storageBackend: string;
  databaseBackend: string;
  queueBackend: string;
  aiProviderSupport: string[];
  selfHostable: boolean;
}

export interface ProviderDefinition {
  id: string;
  runtimeId: string;
  category: string;
  capabilities: AdapterCapability[];
}

export interface AdapterCapability {
  port: string;
  supported: boolean;
  limitations?: string[];
}

export interface RuntimeHealth {
  runtimeId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: string;
  components: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
}

export interface RuntimePortability {
  runtimeId: string;
  portable: boolean;
  constraints: string[];
  migrationNotes?: string;
}
ENDOFFILE

# contracts-sdk (NEW - no re-export from core)
write "packages/mycodexvantaos-contracts-sdk/package.json" << 'ENDOFFILE'
{
  "name": "@mycodexvantaos/mycodexvantaos-contracts-sdk",
  "version": "0.1.0",
  "description": "Contracts SDK - load, validate, and expose typed contract readers for YAML/JSON contracts",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \"TODO: add tests\" && exit 0"
  },
  "keywords": ["mycodexvantaos", "contracts-sdk"],
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
ENDOFFILE

write "packages/mycodexvantaos-contracts-sdk/tsconfig.json" << 'ENDOFFILE'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
ENDOFFILE

write "packages/mycodexvantaos-contracts-sdk/README.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-contracts-sdk

Contracts SDK - load, validate, and expose typed contract readers for YAML/JSON contracts

## Status

🚧 Skeleton - typed interfaces with TODO markers for implementation.
ENDOFFILE

write "packages/mycodexvantaos-contracts-sdk/CHANGELOG.md" << 'ENDOFFILE'
# @mycodexvantaos/mycodexvantaos-contracts-sdk

## 0.1.0 (2025-05-15)

- Initial skeleton with typed interfaces
ENDOFFILE

write "packages/mycodexvantaos-contracts-sdk/src/index.ts" << 'ENDOFFILE'
/**
 * @mycodexvantaos/mycodexvantaos-contracts-sdk
 * Contracts SDK - load, validate, and expose typed contract readers for YAML/JSON contracts
 */

export async function loadServiceDefinitions(dir?: string): Promise<Record<string, unknown>[]> {
  // TODO: implement YAML loading from contracts directory
  return [];
}

export async function loadResourceKinds(dir?: string): Promise<Record<string, unknown>[]> {
  // TODO: implement YAML loading from contracts directory
  return [];
}

export async function loadPolicyDefinitions(dir?: string): Promise<Record<string, unknown>[]> {
  // TODO: implement YAML loading from contracts directory
  return [];
}

export async function loadEventDefinitions(dir?: string): Promise<Record<string, unknown>[]> {
  // TODO: implement YAML loading from contracts directory
  return [];
}

export async function validateContract(schemaPath: string, data: unknown): Promise<{ valid: boolean; errors?: string[] }> {
  // TODO: implement schema validation
  return { valid: true };
}
ENDOFFILE

echo ""
echo "✅ §5 - All 8 TypeScript control plane packages (Created=$CREATED, Skipped=$SKIPPED)"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "§7 - Control Plane Services (12 missing services)"
echo "═══════════════════════════════════════════════════════"

# Create each service with proper class names
declare -A SERVICE_INFO
SERVICE_INFO[service-workspace]="WorkspaceService|Workspace service - workspace CRUD, membership, settings"
SERVICE_INFO[service-resource-registry]="ResourceRegistryService|Resource registry service - resource kind registration and lookup"
SERVICE_INFO[service-policy-engine]="PolicyEngineService|Policy engine service - policy evaluation and enforcement"
SERVICE_INFO[service-audit-log]="AuditLogService|Audit log service - immutable audit event recording and querying"
SERVICE_INFO[service-usage-meter]="UsageMeterService|Usage meter service - usage recording and rate limiting"
SERVICE_INFO[service-knowledge-store]="KnowledgeStoreService|Knowledge store service - document ingestion and chunk management"
SERVICE_INFO[service-knowledge-search]="KnowledgeSearchService|Knowledge search service - vector search and full-text search"
SERVICE_INFO[service-knowledge-trace]="KnowledgeTraceService|Knowledge trace service - answer trace and evidence tracking"
SERVICE_INFO[service-agent-chat]="AgentChatService|Agent chat service - AI-powered conversational agent"
SERVICE_INFO[service-model-byok]="ModelByokService|Model BYOK service - bring-your-own-key model endpoint management"
SERVICE_INFO[service-memory-store]="MemoryStoreService|Memory store service - memory item CRUD and relation management"
SERVICE_INFO[service-memory-capture]="MemoryCaptureService|Memory capture service - memory candidate creation from conversations"

for svc_name in "${!SERVICE_INFO[@]}"; do
    IFS='|' read -r class_name desc <<< "${SERVICE_INFO[$svc_name]}"
    svc_dir="services/mycodexvantaos-${svc_name}"
    
    write "$svc_dir/package.json" << ENDOFFILE
{
  "name": "@mycodexvantaos/${svc_name}",
  "version": "0.1.0",
  "description": "${desc}",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \"TODO: add tests\" && exit 0"
  },
  "keywords": ["mycodexvantaos", "${svc_name}"],
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  },
  "dependencies": {
    "@mycodexvantaos/core": "workspace:*"
  }
}
ENDOFFILE

    write "$svc_dir/tsconfig.json" << 'ENDOFFILE'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
ENDOFFILE

    write "$svc_dir/README.md" << ENDOFFILE
# @mycodexvantaos/${svc_name}

${desc}

## Status

🚧 Skeleton - typed interfaces with TODO markers for implementation.

## Responsibilities

- TODO: Define service responsibilities
- TODO: Define port dependencies
- TODO: Define API surface
ENDOFFILE

    write "$svc_dir/CHANGELOG.md" << ENDOFFILE
# @mycodexvantaos/${svc_name}

## 0.1.0 (2025-05-15)

- Initial skeleton
ENDOFFILE

    write "$svc_dir/src/index.ts" << ENDOFFILE
/**
 * @mycodexvantaos/${svc_name}
 * ${desc}
 *
 * TODO: Implement service logic
 * TODO: Define port dependencies (IDatabasePort, etc.)
 * TODO: Define API surface
 */

export class ${class_name} {
  // TODO: Implement service
}
ENDOFFILE

done

echo ""
echo "✅ §7 - All 12 missing TypeScript services (Created=$CREATED, Skipped=$SKIPPED)"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "§9-10 - Missing Service Definition Contracts"
echo "═══════════════════════════════════════════════════════"

write "contracts/service-definitions/resource-registry.yaml" << 'ENDOFFILE'
id: resource-registry
category: platform
display_name: Resource Registry
description: Central registry for all platform resource kinds
resource_types: []
permissions:
  - action: read
    roles: [workspace-viewer, workspace-member, workspace-owner, platform-admin]
  - action: write
    roles: [workspace-member, workspace-owner, platform-admin]
  - action: admin
    roles: [workspace-owner, platform-admin]
events: []
usage_metrics: []
runtime:
  portable: true
  supported:
    - cloudflare-workers
    - node-server
    - docker-container
audit:
  required: true
ENDOFFILE

write "contracts/service-definitions/policy-engine.yaml" << 'ENDOFFILE'
id: policy-engine
category: platform
display_name: Policy Engine
description: Policy evaluation and enforcement engine
resource_types: []
permissions:
  - action: read
    roles: [workspace-viewer, workspace-member, workspace-owner, platform-admin]
  - action: write
    roles: [workspace-member, workspace-owner, platform-admin]
  - action: admin
    roles: [workspace-owner, platform-admin]
events: []
usage_metrics: []
runtime:
  portable: true
  supported:
    - cloudflare-workers
    - node-server
    - docker-container
audit:
  required: true
ENDOFFILE

write "contracts/service-definitions/knowledge-trace.yaml" << 'ENDOFFILE'
id: knowledge-trace
category: knowledge
display_name: Knowledge Trace
description: Answer trace and evidence tracking for RAG pipelines
resource_types: []
permissions:
  - action: read
    roles: [workspace-viewer, workspace-member, workspace-owner, platform-admin]
  - action: write
    roles: [workspace-member, workspace-owner, platform-admin]
  - action: admin
    roles: [workspace-owner, platform-admin]
events: []
usage_metrics: []
runtime:
  portable: true
  supported:
    - cloudflare-workers
    - node-server
    - docker-container
audit:
  required: true
ENDOFFILE

write "contracts/service-definitions/memory-store.yaml" << 'ENDOFFILE'
id: memory-store
category: agent
display_name: Memory Store
description: Memory item CRUD and relation management
resource_types: []
permissions:
  - action: read
    roles: [workspace-viewer, workspace-member, workspace-owner, platform-admin]
  - action: write
    roles: [workspace-member, workspace-owner, platform-admin]
  - action: admin
    roles: [workspace-owner, platform-admin]
events: []
usage_metrics: []
runtime:
  portable: true
  supported:
    - cloudflare-workers
    - node-server
    - docker-container
audit:
  required: true
ENDOFFILE

write "contracts/service-definitions/memory-capture.yaml" << 'ENDOFFILE'
id: memory-capture
category: agent
display_name: Memory Capture
description: Memory candidate creation from conversations and events
resource_types: []
permissions:
  - action: read
    roles: [workspace-viewer, workspace-member, workspace-owner, platform-admin]
  - action: write
    roles: [workspace-member, workspace-owner, platform-admin]
  - action: admin
    roles: [workspace-owner, platform-admin]
events: []
usage_metrics: []
runtime:
  portable: true
  supported:
    - cloudflare-workers
    - node-server
    - docker-container
audit:
  required: true
ENDOFFILE

echo "✅ §10 - All 5 missing service definition contracts"
