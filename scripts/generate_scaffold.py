#!/usr/bin/env python3
"""
Platform Control Plane Expansion — Scaffold Generator
Generates all skeleton files for the bilingual architecture expansion.
"""

import os

BASE = "/workspace/mycodexvantaos"


def write(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    print(f"  ✅ {path}")


# ═══════════════════════════════════════════════════════════════
# Sec.5 — TypeScript Control Plane Packages (8 packages)
# ═══════════════════════════════════════════════════════════════

TS_PACKAGES = {
    "service-catalog": {
        "desc": "Service catalog model — service definitions, categories, capabilities, permissions, runtime metadata",
        "reexport": "service-catalog",
        "types": [
            "ServiceDefinition",
            "ServiceCategory",
            "ServiceCapability",
            "ServicePermission",
            "ServiceRuntimeSupport",
        ],
        "extra": """
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
""",
    },
    "resource-model": {
        "desc": "Resource model — resource kinds, metadata, spec, status, lifecycle, references",
        "reexport": "resource-model",
        "types": [
            "ResourceKind",
            "ResourceMetadata",
            "ResourceSpec",
            "ResourceStatus",
            "ResourceReference",
        ],
        "extra": """
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
""",
    },
    "policy-model": {
        "desc": "Policy model — subject, action, resource, condition, effect, evaluation result",
        "reexport": "policy-model",
        "types": [
            "PolicyDefinition",
            "PolicySubject",
            "PolicyAction",
            "PolicyResource",
            "PolicyCondition",
            "PolicyEffect",
            "PolicyEvaluationResult",
        ],
        "extra": """
// Extended types for standalone package
export type PolicyEffect = 'allow' | 'deny' | 'require-review';

export interface PolicyEvaluationResult {
  allowed: boolean;
  effect: PolicyEffect;
  matchedPolicies: string[];
  reason?: string;
}
""",
    },
    "audit-model": {
        "desc": "Audit model — audit events, actor, resource reference, trace context, integrity metadata",
        "reexport": "audit-model",
        "types": [
            "AuditEvent",
            "AuditActor",
            "AuditResource",
            "AuditContext",
            "AuditIntegrity",
        ],
        "extra": """
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
""",
    },
    "knowledge-model": {
        "desc": "Knowledge model — document, chunk, collection, retrieval receipt, answer trace, issue, repair",
        "reexport": "knowledge-model",
        "types": [
            "DocumentResource",
            "DocumentChunk",
            "KnowledgeCollection",
            "RetrievalReceipt",
            "AnswerTrace",
            "KnowledgeIssue",
            "KnowledgeRepair",
        ],
        "extra": "",
    },
    "memory-model": {
        "desc": "Memory model — memory item, candidate, relation, conflict, dream run, dream action, dream report",
        "reexport": None,  # no reexport from core — this is new
        "types": [
            "MemoryItem",
            "MemoryCandidate",
            "MemoryRelation",
            "MemoryConflict",
            "MemoryDreamRun",
            "MemoryDreamAction",
            "MemoryDreamReport",
        ],
        "extra": """
/**
 * Memory item statuses
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

/**
 * Memory types that may be actively injected into prompts by default
 */
export type ActiveMemoryStatus = 'active' | 'reinforced';

/**
 * Memory types that must NOT be actively injected into prompts
 */
export type PassiveMemoryStatus = 'candidate' | 'merged' | 'deprecated' | 'orphaned' | 'archived' | 'rejected';

/**
 * Memory item — the core unit of the memory system
 * Matches contracts/schemas/memory-item.schema.json
 */
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

/**
 * Memory candidate — a memory item pending promotion or rejection
 */
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

/**
 * Memory relation — links between memory items
 */
export interface MemoryRelation {
  relationId: string;
  fromMemoryId: string;
  toMemoryId: string;
  relationType: 'supports' | 'contradicts' | 'derived-from' | 'related-to' | 'temporal-successor';
  strength: number;
  createdAt: string;
}

/**
 * Memory conflict — detected conflict between memories
 */
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

/**
 * Dream run — a dream processing execution
 * Matches contracts/schemas/dream-run.schema.json
 */
export interface MemoryDreamRun {
  dreamRunId: string;
  memoryItems: MemoryItem[];
  dryRun: boolean;
  proposalMode: boolean;
  autoApply: boolean;
  createdAt: string;
}

/**
 * Dream action — suggested action from a dream run
 * Matches contracts/schemas/dream-action.schema.json
 */
export interface MemoryDreamAction {
  actionType: 'merge' | 'resolve' | 'mark_orphan' | 'delete';
  targetMemoryId: string;
  relatedMemoryId?: string;
  reason: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Dream report — output of a dream run
 * Matches contracts/schemas/dream-report.schema.json
 */
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
""",
    },
    "runtime-model": {
        "desc": "Runtime model — runtime definition, provider definition, adapter capability, health, portability",
        "reexport": None,
        "types": [
            "RuntimeDefinition",
            "ProviderDefinition",
            "AdapterCapability",
            "RuntimeHealth",
            "RuntimePortability",
        ],
        "extra": """
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
""",
    },
    "contracts-sdk": {
        "desc": "Contracts SDK — load, validate, and expose typed contract readers for YAML/JSON contracts",
        "reexport": None,
        "types": [],
        "extra": """
/**
 * Load service definitions from contracts/service-definitions/
 */
export async function loadServiceDefinitions(dir?: string): Promise<Record<string, unknown>[]> {
  // TODO: implement YAML loading from contracts directory
  return [];
}

/**
 * Load resource kinds from contracts/resource-kinds/
 */
export async function loadResourceKinds(dir?: string): Promise<Record<string, unknown>[]> {
  // TODO: implement YAML loading from contracts directory
  return [];
}

/**
 * Load policy definitions from contracts/policies/
 */
export async function loadPolicyDefinitions(dir?: string): Promise<Record<string, unknown>[]> {
  // TODO: implement YAML loading from contracts directory
  return [];
}

/**
 * Load event definitions from contracts/events/
 */
export async function loadEventDefinitions(dir?: string): Promise<Record<string, unknown>[]> {
  // TODO: implement YAML loading from contracts directory
  return [];
}

/**
 * Validate a contract against its JSON Schema
 */
export async function validateContract(schemaPath: string, data: unknown): Promise<{ valid: boolean; errors?: string[] }> {
  // TODO: implement schema validation
  return { valid: true };
}
""",
    },
}

for pkg_name, cfg in TS_PACKAGES.items():
    pkg_dir = f"packages/mycodexvantaos-{pkg_name}"

    # package.json
    write(
        f"{pkg_dir}/package.json",
        f"""{{
  "name": "@mycodexvantaos/mycodexvantaos-{pkg_name}",
  "version": "0.1.0",
  "description": "{cfg["desc"]}",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {{
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \\"TODO: add tests\\" && exit 0"
  }},
  "keywords": ["mycodexvantaos", "{pkg_name}"],
  "license": "MIT",
  "devDependencies": {{
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }},
  "dependencies": {{
    "@mycodexvantaos/core": "workspace:*"
  }}
}}
""",
    )

    # tsconfig.json
    write(
        f"{pkg_dir}/tsconfig.json",
        """{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
""",
    )

    # README.md
    types_list = "\n".join(f"- `{t}`" for t in cfg["types"])
    write(
        f"{pkg_dir}/README.md",
        f"""# @mycodexvantaos/mycodexvantaos-{pkg_name}

{cfg["desc"]}

## Core Types

{types_list}

## Usage

```typescript
import {{ {", ".join(cfg["types"][:3])} }} from '@mycodexvantaos/mycodexvantaos-{pkg_name}';
```

## Status

🚧 Skeleton — typed interfaces with TODO markers for implementation.
""",
    )

    # CHANGELOG.md
    write(
        f"{pkg_dir}/CHANGELOG.md",
        f"""# @mycodexvantaos/mycodexvantaos-{pkg_name}

## 0.1.0 (2025-05-15)

- Initial skeleton with typed interfaces
- Re-exports from @mycodexvantaos/core where applicable
""",
    )

    # src/index.ts
    reexport_line = ""
    if cfg.get("reexport"):
        reexport_line = f"\n// Re-export from core constitution\nexport * from '@mycodexvantaos/core/{cfg['reexport']}';\n"

    write(
        f"{pkg_dir}/src/index.ts",
        f"""/**
 * @mycodexvantaos/mycodexvantaos-{pkg_name}
 * {cfg["desc"]}
 */
{reexport_line}
{cfg["extra"]}
""",
    )

print("\n✅ Sec.5 — All 8 TypeScript control plane packages created")

# ═══════════════════════════════════════════════════════════════
# Sec.7 — Control Plane Services (12 missing services)
# ═══════════════════════════════════════════════════════════════

TS_SERVICES = {
    "service-workspace": (
        "Workspace service — workspace CRUD, membership, settings",
        "workspace",
    ),
    "service-resource-registry": (
        "Resource registry service — resource kind registration and lookup",
        "resource-registry",
    ),
    "service-policy-engine": (
        "Policy engine service — policy evaluation and enforcement",
        "policy-engine",
    ),
    "service-audit-log": (
        "Audit log service — immutable audit event recording and querying",
        "audit-log",
    ),
    "service-usage-meter": (
        "Usage meter service — usage recording and rate limiting",
        "usage-meter",
    ),
    "service-knowledge-store": (
        "Knowledge store service — document ingestion and chunk management",
        "knowledge-store",
    ),
    "service-knowledge-search": (
        "Knowledge search service — vector search and full-text search",
        "knowledge-search",
    ),
    "service-knowledge-trace": (
        "Knowledge trace service — answer trace and evidence tracking",
        "knowledge-trace",
    ),
    "service-agent-chat": (
        "Agent chat service — AI-powered conversational agent",
        "agent-chat",
    ),
    "service-model-byok": (
        "Model BYOK service — bring-your-own-key model endpoint management",
        "model-byok",
    ),
    "service-memory-store": (
        "Memory store service — memory item CRUD and relation management",
        "memory-store",
    ),
    "service-memory-capture": (
        "Memory capture service — memory candidate creation from conversations",
        "memory-capture",
    ),
}

for svc_name, (desc, short) in TS_SERVICES.items():
    svc_dir = f"services/mycodexvantaos-{svc_name}"

    write(
        f"{svc_dir}/package.json",
        f"""{{
  "name": "@mycodexvantaos/{svc_name}",
  "version": "0.1.0",
  "description": "{desc}",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {{
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \\"TODO: add tests\\" && exit 0"
  }},
  "keywords": ["mycodexvantaos", "{short}"],
  "license": "MIT",
  "devDependencies": {{
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }},
  "dependencies": {{
    "@mycodexvantaos/core": "workspace:*"
  }}
}}
""",
    )

    write(
        f"{svc_dir}/tsconfig.json",
        """{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
""",
    )

    write(
        f"{svc_dir}/README.md",
        f"""# @mycodexvantaos/{svc_name}

{desc}

## Status

🚧 Skeleton — typed interfaces with TODO markers for implementation.

## Responsibilities

- TODO: Define service responsibilities
- TODO: Define port dependencies
- TODO: Define API surface
""",
    )

    write(
        f"{svc_dir}/CHANGELOG.md",
        f"""# @mycodexvantaos/{svc_name}

## 0.1.0 (2025-05-15)

- Initial skeleton
""",
    )

    write(
        f"{svc_dir}/src/index.ts",
        f"""/**
 * @mycodexvantaos/{svc_name}
 * {desc}
 *
 * TODO: Implement service logic
 * TODO: Define port dependencies (IDatabasePort, etc.)
 * TODO: Define API surface
 */

export class {short.replace("-", "").title().replace("", "").replace("Workspace", "WorkspaceService").replace("Resourceregistry", "ResourceRegistryService").replace("Policyengine", "PolicyEngineService").replace("Auditlog", "AuditLogService").replace("Usagemeter", "UsageMeterService").replace("Knowledgestore", "KnowledgeStoreService").replace("Knowledgesearch", "KnowledgeSearchService").replace("Knowledgetrace", "KnowledgeTraceService").replace("Agentchat", "AgentChatService").replace("Modelbyok", "ModelByokService").replace("Memorystore", "MemoryStoreService").replace("Memorycapture", "MemoryCaptureService")} {{
  // TODO: Implement service
}}
""",
    )

print("\n✅ Sec.7 — All 12 missing TypeScript services created")

# ═══════════════════════════════════════════════════════════════
# Sec.9-10 — Missing Service Definition Contracts (5 YAML files)
# ═══════════════════════════════════════════════════════════════

MISSING_SERVICE_DEFS = {
    "resource-registry": (
        "platform",
        "Resource Registry",
        "Central registry for all platform resource kinds",
    ),
    "policy-engine": (
        "platform",
        "Policy Engine",
        "Policy evaluation and enforcement engine",
    ),
    "knowledge-trace": (
        "knowledge",
        "Knowledge Trace",
        "Answer trace and evidence tracking for RAG pipelines",
    ),
    "memory-store": (
        "agent",
        "Memory Store",
        "Memory item CRUD and relation management",
    ),
    "memory-capture": (
        "agent",
        "Memory Capture",
        "Memory candidate creation from conversations and events",
    ),
}

for svc_id, (cat, display, desc) in MISSING_SERVICE_DEFS.items():
    write(
        f"contracts/service-definitions/{svc_id}.yaml",
        f"""id: {svc_id}
category: {cat}
display_name: {display}
description: {desc}
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
""",
    )

print("\n✅ Sec.10 — All 5 missing service definition contracts created")

# ═══════════════════════════════════════════════════════════════
# Sec.11 — Resource Kind Contracts (16 YAML files)
# ═══════════════════════════════════════════════════════════════

RESOURCE_KINDS = {
    "tenant": ("Tenant", "Platform tenant for multi-tenancy"),
    "user": ("User", "Platform user / identity subject"),
    "workspace": ("Workspace", "Isolated workspace for teams"),
    "document": ("Document", "Uploaded document in knowledge store"),
    "document-chunk": ("DocumentChunk", "Chunked segment of a document"),
    "knowledge-collection": (
        "KnowledgeCollection",
        "Named collection for knowledge artifacts",
    ),
    "retrieval-receipt": (
        "RetrievalReceipt",
        "Receipt for knowledge retrieval operations",
    ),
    "answer-trace": ("AnswerTrace", "Trace of evidence for AI-generated answers"),
    "memory-item": ("MemoryItem", "Core memory unit in the memory system"),
    "memory-candidate": (
        "MemoryCandidate",
        "Candidate memory pending promotion or rejection",
    ),
    "memory-conflict": ("MemoryConflict", "Detected conflict between memory items"),
    "dream-run": ("DreamRun", "A dream processing execution"),
    "dream-action": ("DreamAction", "Suggested action from dream processing"),
    "audit-event": ("AuditEvent", "Immutable audit event"),
    "usage-event": ("UsageEvent", "Usage metering event"),
    "model-provider": ("ModelProvider", "BYOK model provider endpoint"),
}

for kind, (display, desc) in RESOURCE_KINDS.items():
    write(
        f"contracts/resource-kinds/{kind}.yaml",
        f"""kind: {kind}
api_version: mycodexvantaos.io/v1
metadata_schema:
  id:
    type: string
    required: true
  urn:
    type: string
    required: true
  labels:
    type: object
    additionalProperties:
      type: string
  annotations:
    type: object
    additionalProperties:
      type: string
  createdAt:
    type: string
    format: date-time
  updatedAt:
    type: string
    format: date-time
spec_schema: {{}}
status_schema: {{}}
lifecycle:
  - creating
  - active
  - updating
  - degraded
  - suspended
  - deleting
  - deleted
permissions:
  - action: read
    roles: [workspace-viewer, workspace-member, workspace-owner, platform-admin]
  - action: write
    roles: [workspace-member, workspace-owner, platform-admin]
  - action: delete
    roles: [workspace-owner, platform-admin]
audit_events:
  - {kind}.created
  - {kind}.updated
  - {kind}.deleted
""",
    )

print("\n✅ Sec.11 — All 16 resource kind contracts created")

# ═══════════════════════════════════════════════════════════════
# Sec.12 — Event Contracts (6 separate YAML files)
# ═══════════════════════════════════════════════════════════════

EVENT_CONTRACTS = {
    "audit-events": {
        "category": "audit",
        "events": [
            "audit.event-recorded",
            "audit.chain-verified",
            "audit.chain-violation-detected",
            "audit.event-queried",
            "audit.integrity-check-completed",
        ],
    },
    "knowledge-events": {
        "category": "knowledge",
        "events": [
            "knowledge.collection-created",
            "knowledge.collection-archived",
            "knowledge.document-uploaded",
            "knowledge.document-chunked",
            "knowledge.document-embedded",
            "knowledge.document-ingested",
            "knowledge.document-failed",
            "knowledge.search-performed",
            "knowledge.retrieval-completed",
            "knowledge.answer-trace-created",
            "knowledge.issue-detected",
            "knowledge.repair-initiated",
        ],
    },
    "memory-events": {
        "category": "memory",
        "events": [
            "memory.candidate-created",
            "memory.candidate-promoted",
            "memory.candidate-rejected",
            "memory.item-created",
            "memory.item-updated",
            "memory.item-reinforced",
            "memory.item-merged",
            "memory.item-deprecated",
            "memory.item-orphaned",
            "memory.conflict-detected",
            "memory.conflict-resolved",
            "memory.dream-started",
            "memory.dream-scan-completed",
            "memory.dream-merge-completed",
            "memory.dream-conflict-resolved",
            "memory.dream-orphan-cleaned",
            "memory.dream-completed",
            "memory.dream-failed",
            "memory.dream-rollback",
        ],
    },
    "agent-events": {
        "category": "agent",
        "events": [
            "agent.session-created",
            "agent.session-archived",
            "agent.message-sent",
            "agent.message-received",
            "agent.tool-invoked",
            "agent.tool-completed",
            "agent.generation-started",
            "agent.generation-completed",
        ],
    },
    "usage-events": {
        "category": "usage",
        "events": [
            "usage.api-call-recorded",
            "usage.token-usage-recorded",
            "usage.storage-bytes-recorded",
            "usage.rate-limit-checked",
            "usage.quota-warning",
            "usage.quota-exceeded",
        ],
    },
    "runtime-events": {
        "category": "runtime",
        "events": [
            "runtime.started",
            "runtime.stopped",
            "runtime.health-checked",
            "runtime.provider-connected",
            "runtime.provider-disconnected",
            "runtime.adapter-failed",
            "runtime.migration-applied",
        ],
    },
}

for filename, cfg in EVENT_CONTRACTS.items():
    events_yaml = "\n".join(f"  - {e}" for e in cfg["events"])
    write(
        f"contracts/events/{filename}.yaml",
        f"""category: {cfg["category"]}
description: Event contracts for {cfg["category"]} domain
events:
{events_yaml}
""",
    )

print("\n✅ Sec.12 — All 6 event contract files created")

# ═══════════════════════════════════════════════════════════════
# Sec.13 — Policy Contracts (5 YAML files)
# ═══════════════════════════════════════════════════════════════

POLICIES = {"default-access-policy": {"id": "default-access-policy",
                                      "description": "Default access control policy for platform resources",
                                      "rules": [{"effect": "allow",
                                                 "subject": {"roles": ["platform-admin"]},
                                                 "action": "*",
                                                 "resource": "*",
                                                 },
                                                {"effect": "allow",
                                                 "subject": {"roles": ["workspace-owner"]},
                                                 "action": "*",
                                                 "resource": "workspace/*",
                                                 },
                                                {"effect": "allow",
                                                 "subject": {"roles": ["workspace-member"]},
                                                 "action": "read,write",
                                                 "resource": "workspace/*",
                                                 },
                                                {"effect": "allow",
                                                 "subject": {"roles": ["workspace-viewer"]},
                                                 "action": "read",
                                                 "resource": "workspace/*",
                                                 },
                                                ],
                                      },
            "knowledge-access-policy": {"id": "knowledge-access-policy",
                                        "description": "Access policy for knowledge store operations",
                                        "rules": [{"effect": "allow",
                                                   "subject": {"roles": ["workspace-member",
                                                                         "workspace-owner"]},
                                                   "action": "knowledge:ingest",
                                                   "resource": "knowledge/collections/*",
                                                   },
                                                  {"effect": "allow",
                                                   "subject": {"roles": ["workspace-viewer",
                                                                         "workspace-member",
                                                                         "workspace-owner"]},
                                                   "action": "knowledge:search",
                                                   "resource": "knowledge/collections/*",
                                                   },
                                                  ],
                                        },
            "memory-dream-policy": {"id": "memory-dream-policy",
                                    "description": "Policy for memory dream operations — architecture decisions require review",
                                    "rules": [{"effect": "require-review",
                                               "subject": {"service": "memory-dream"},
                                               "action": "memory-item-deprecate,memory-item-merge",
                                               "resource": "memory-item",
                                               "condition": {"memory_type": "decision",
                                                             "tags_contains": ["architecture"],
                                                             },
                                               },
                                              {"effect": "allow",
                                               "subject": {"roles": ["workspace-owner",
                                                                     "platform-admin"]},
                                               "action": "dream:run",
                                               "resource": "dream-run",
                                               },
                                              {"effect": "allow",
                                               "subject": {"service": "memory-dream"},
                                               "action": "dream:execute",
                                               "resource": "dream-run",
                                               "condition": {"mode": "proposal"},
                                               },
                                              ],
                                    },
            "model-byok-policy": {"id": "model-byok-policy",
                                  "description": "Policy for BYOK model endpoint management",
                                  "rules": [{"effect": "allow",
                                             "subject": {"roles": ["workspace-owner"]},
                                             "action": "model:register,model:delete",
                                             "resource": "model-endpoint",
                                             },
                                            {"effect": "allow",
                                             "subject": {"roles": ["workspace-member",
                                                                   "workspace-owner"]},
                                             "action": "model:invoke",
                                             "resource": "model-endpoint",
                                             },
                                            ],
                                  },
            "audit-retention-policy": {"id": "audit-retention-policy",
                                       "description": "Audit event retention and integrity policy",
                                       "rules": [{"effect": "deny",
                                                  "subject": "*",
                                                  "action": "audit:delete",
                                                  "resource": "audit-event",
                                                  },
                                                 {"effect": "allow",
                                                  "subject": {"roles": ["platform-admin",
                                                                        "auditor"]},
                                                  "action": "audit:query,audit:verify",
                                                  "resource": "audit-event",
                                                  },
                                                 ],
                                       },
            }

for policy_id, cfg in POLICIES.items():
    rules_yaml = ""
    for r in cfg["rules"]:
        cond = ""
        if "condition" in r:
            cond = "\n    condition:\n" + "\n".join(
                f"      {k}: {v}" for k, v in r["condition"].items()
            )
        rules_yaml += f"""
  - effect: {r["effect"]}
    subject: {r["subject"]}
    action: {r["action"]}
    resource: {r["resource"]}{cond}
"""
    write(
        f"contracts/policies/{policy_id}.yaml",
        f"""id: {cfg["id"]}
description: {cfg["description"]}
rules:{rules_yaml}
""",
    )

print("\n✅ Sec.13 — All 5 policy contracts created")

# ═══════════════════════════════════════════════════════════════
# Sec.14 — Missing JSON Schemas
# ═══════════════════════════════════════════════════════════════

write(
    "contracts/schemas/policy.schema.json",
    """{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://mycodexvantaos.com/schemas/policy.schema.json",
  "title": "Policy",
  "description": "Policy definition for platform access control",
  "type": "object",
  "properties": {
    "id": { "type": "string", "description": "Policy identifier" },
    "description": { "type": "string" },
    "rules": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "effect": { "type": "string", "enum": ["allow", "deny", "require-review"] },
          "subject": { "type": "object" },
          "action": { "type": "string" },
          "resource": { "type": "string" },
          "condition": { "type": "object" }
        },
        "required": ["effect", "subject", "action", "resource"]
      }
    }
  },
  "required": ["id", "rules"]
}""",
)

write(
    "contracts/schemas/knowledge-model.schema.json",
    """{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://mycodexvantaos.com/schemas/knowledge-model.schema.json",
  "title": "Knowledge Model",
  "description": "Knowledge model types — document, chunk, collection, receipt, trace",
  "type": "object",
  "definitions": {
    "Document": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "collectionId": { "type": "string" },
        "filename": { "type": "string" },
        "contentType": { "type": "string" },
        "phase": { "type": "string" }
      },
      "required": ["id", "collectionId", "filename"]
    },
    "DocumentChunk": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "documentId": { "type": "string" },
        "content": { "type": "string" },
        "tokenCount": { "type": "integer" }
      },
      "required": ["id", "documentId", "content"]
    },
    "KnowledgeCollection": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "displayName": { "type": "string" },
        "embeddingModel": { "type": "string" },
        "documentCount": { "type": "integer" }
      },
      "required": ["id", "displayName"]
    }
  }
}""",
)

write(
    "contracts/schemas/memory-model.schema.json",
    """{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://mycodexvantaos.com/schemas/memory-model.schema.json",
  "title": "Memory Model",
  "description": "Memory model types — item, candidate, relation, conflict",
  "type": "object",
  "definitions": {
    "MemoryItem": {
      "type": "object",
      "properties": {
        "memoryId": { "type": "string" },
        "content": { "type": "string" },
        "status": { "type": "string", "enum": ["candidate", "active", "reinforced", "merged", "deprecated", "orphaned", "archived", "rejected"] },
        "memoryType": { "type": "string", "enum": ["observation", "reflection", "decision", "event", "fact", "opinion", "plan", "system"] },
        "tags": { "type": "array", "items": { "type": "string" } },
        "relatedEntities": { "type": "array", "items": { "type": "string" } },
        "conflictsWith": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["memoryId", "content", "status"]
    },
    "MemoryCandidate": {
      "type": "object",
      "properties": {
        "candidateId": { "type": "string" },
        "content": { "type": "string" },
        "source": { "type": "string" },
        "status": { "type": "string", "enum": ["candidate"] }
      },
      "required": ["candidateId", "content", "source"]
    },
    "MemoryConflict": {
      "type": "object",
      "properties": {
        "conflictId": { "type": "string" },
        "memoryIds": { "type": "array", "items": { "type": "string" } },
        "conflictType": { "type": "string", "enum": ["factual", "temporal", "semantic"] },
        "severity": { "type": "string", "enum": ["low", "medium", "high"] }
      },
      "required": ["conflictId", "memoryIds", "conflictType"]
    }
  }
}""",
)

write(
    "contracts/schemas/runtime-adapter.schema.json",
    """{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://mycodexvantaos.com/schemas/runtime-adapter.schema.json",
  "title": "Runtime Adapter",
  "description": "Runtime and adapter definitions for multi-runtime support",
  "type": "object",
  "definitions": {
    "RuntimeDefinition": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "displayName": { "type": "string" },
        "supportedServices": { "type": "array", "items": { "type": "string" } },
        "selfHostable": { "type": "boolean" }
      },
      "required": ["id", "displayName"]
    },
    "ProviderDefinition": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "runtimeId": { "type": "string" },
        "category": { "type": "string" }
      },
      "required": ["id", "runtimeId", "category"]
    }
  }
}""",
)

print("\n✅ Sec.14 — All 4 missing JSON schemas created")

# ═══════════════════════════════════════════════════════════════
# Sec.15 — D1 Migrations (8 new migration files)
# ═══════════════════════════════════════════════════════════════

MIGRATIONS = {
    "0002-service-catalog": """-- Service Catalog Tables
CREATE TABLE IF NOT EXISTS service_definitions (
  id              TEXT PRIMARY KEY,
  category        TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  description     TEXT,
  phase           TEXT NOT NULL DEFAULT 'active',
  runtime_support TEXT NOT NULL DEFAULT '{}',
  permissions     TEXT NOT NULL DEFAULT '[]',
  events          TEXT NOT NULL DEFAULT '[]',
  usage_metrics   TEXT NOT NULL DEFAULT '[]',
  audit_required  INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_service_definitions_category ON service_definitions(category);
""", "0003-resource-registry": """-- Resource Registry Tables
CREATE TABLE IF NOT EXISTS resource_kinds (
  kind            TEXT PRIMARY KEY,
  api_version     TEXT NOT NULL DEFAULT 'mycodexvantaos.io/v1',
  display_name    TEXT NOT NULL,
  description     TEXT,
  metadata_schema TEXT DEFAULT '{}',
  spec_schema     TEXT DEFAULT '{}',
  status_schema   TEXT DEFAULT '{}',
  lifecycle       TEXT DEFAULT '[]',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
""", "0004-policy-model": """-- Policy Model Tables
CREATE TABLE IF NOT EXISTS policy_definitions (
  id              TEXT PRIMARY KEY,
  description     TEXT,
  rules           TEXT NOT NULL DEFAULT '[]',
  priority        INTEGER NOT NULL DEFAULT 0,
  phase           TEXT NOT NULL DEFAULT 'active',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_policy_definitions_phase ON policy_definitions(phase);
""", "0005-audit-log": """-- Audit Log Tables (extended from 001_initial_schema)
-- audit_events already created in 001, this adds indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_correlation ON audit_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_events(severity);
""", "0006-usage-meter": """-- Usage Meter Tables (extended from 001_initial_schema)
-- usage_records already created in 001, this adds indexes
CREATE INDEX IF NOT EXISTS idx_usage_records_subject ON usage_records(subject_id);
""", "0007-knowledge-model": """-- Knowledge Model Tables (extended from 001_initial_schema)
-- knowledge_collections, documents, document_chunks already created in 001
CREATE TABLE IF NOT EXISTS knowledge_issues (
  id              TEXT PRIMARY KEY,
  collection_id   TEXT REFERENCES knowledge_collections(id),
  document_id     TEXT REFERENCES documents(id),
  issue_type      TEXT NOT NULL,
  severity        TEXT NOT NULL DEFAULT 'warning',
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'open',
  repair_id       TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_knowledge_issues_collection ON knowledge_issues(collection_id);
""", "0008-memory-model": """-- Memory Model Tables
CREATE TABLE IF NOT EXISTS memory_items (
  id              TEXT PRIMARY KEY,
  content         TEXT NOT NULL,
  memory_type     TEXT NOT NULL DEFAULT 'observation',
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('candidate', 'active', 'reinforced', 'merged', 'deprecated', 'orphaned', 'archived', 'rejected')),
  tags            TEXT NOT NULL DEFAULT '[]',
  related_entities TEXT NOT NULL DEFAULT '[]',
  temporal_expressions TEXT NOT NULL DEFAULT '[]',
  conflicts_with  TEXT NOT NULL DEFAULT '[]',
  metadata        TEXT DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);
CREATE INDEX idx_memory_items_type ON memory_items(memory_type);
CREATE INDEX idx_memory_items_status ON memory_items(status);

CREATE TABLE IF NOT EXISTS memory_candidates (
  id              TEXT PRIMARY KEY,
  content         TEXT NOT NULL,
  source          TEXT NOT NULL,
  tags            TEXT NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'candidate',
  promoted_to     TEXT,
  rejected_reason TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memory_relations (
  id              TEXT PRIMARY KEY,
  from_memory_id  TEXT NOT NULL REFERENCES memory_items(id),
  to_memory_id    TEXT NOT NULL REFERENCES memory_items(id),
  relation_type   TEXT NOT NULL,
  strength        REAL NOT NULL DEFAULT 1.0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_memory_relations_from ON memory_relations(from_memory_id);
CREATE INDEX idx_memory_relations_to ON memory_relations(to_memory_id);

CREATE TABLE IF NOT EXISTS memory_conflicts (
  id              TEXT PRIMARY KEY,
  memory_ids      TEXT NOT NULL DEFAULT '[]',
  conflict_type   TEXT NOT NULL,
  severity        TEXT NOT NULL DEFAULT 'medium',
  status          TEXT NOT NULL DEFAULT 'detected',
  resolution      TEXT,
  detected_at     TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at     TEXT
);
CREATE INDEX idx_memory_conflicts_status ON memory_conflicts(status);

CREATE TABLE IF NOT EXISTS memory_entity_references (
  entity_id       TEXT NOT NULL,
  memory_id       TEXT NOT NULL REFERENCES memory_items(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entity_id, memory_id)
);
CREATE INDEX idx_memory_entity_refs_entity ON memory_entity_references(entity_id);
""", "0009-memory-dream": """-- Memory Dream Tables
CREATE TABLE IF NOT EXISTS memory_dream_runs (
  id              TEXT PRIMARY KEY,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'rolled-back')),
  dry_run         INTEGER NOT NULL DEFAULT 1,
  proposal_mode   INTEGER NOT NULL DEFAULT 1,
  auto_apply      INTEGER NOT NULL DEFAULT 0,
  total_memories  INTEGER NOT NULL DEFAULT 0,
  duplicates_found INTEGER NOT NULL DEFAULT 0,
  conflicts_found INTEGER NOT NULL DEFAULT 0,
  orphans_found   INTEGER NOT NULL DEFAULT 0,
  statistics      TEXT DEFAULT '{}',
  error_message   TEXT,
  started_at      TEXT,
  completed_at    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_memory_dream_runs_status ON memory_dream_runs(status);

CREATE TABLE IF NOT EXISTS memory_dream_actions (
  id              TEXT PRIMARY KEY,
  dream_run_id    TEXT NOT NULL REFERENCES memory_dream_runs(id),
  action_type     TEXT NOT NULL
                    CHECK (action_type IN ('merge', 'resolve', 'mark_orphan', 'delete')),
  target_memory_id TEXT NOT NULL,
  related_memory_id TEXT,
  reason          TEXT NOT NULL,
  confidence      REAL NOT NULL DEFAULT 1.0,
  status          TEXT NOT NULL DEFAULT 'proposed'
                    CHECK (status IN ('proposed', 'approved', 'applied', 'rejected', 'failed')),
  applied_at      TEXT,
  metadata        TEXT DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_memory_dream_actions_run ON memory_dream_actions(dream_run_id);
CREATE INDEX idx_memory_dream_actions_status ON memory_dream_actions(status);
""", }

for mig_name, sql in MIGRATIONS.items():
    write(
        f"migrations/d1/{mig_name}.sql",
        f"""-- ═══════════════════════════════════════════════════════════════
-- MyCodeXvantaOS — D1 Migration: {mig_name}
-- Compatible: Cloudflare D1 (SQLite-based)
-- ═══════════════════════════════════════════════════════════════

{sql}
INSERT INTO _migrations (name) VALUES ('{mig_name}');
""",
    )

print("\n✅ Sec.15 — All 8 D1 migration files created")

# ═══════════════════════════════════════════════════════════════
# Sec.16 — Python Intelligence Plane (4 new packages + 2 new apps)
# ═══════════════════════════════════════════════════════════════

PYTHON_PACKAGES = {
    "mycodexvantaos-knowledge-pipeline": {
        "desc": "Knowledge Pipeline — Document parsing, embedding generation, semantic clustering",
        "deps": ["pydantic>=2.9.0", "pydantic-settings>=2.5.0"],
        "opt_deps": {
            "ml": [
                "scikit-learn>=1.5.0",
                "numpy>=2.0.0",
                "sentence-transformers>=3.0.0",
            ]
        },
        "types": [
            "DocumentInput",
            "ParsedDocument",
            "EmbeddingResult",
            "ClusterResult",
        ],
        "index": """\"\"\"
MyCodeXvantaOS Knowledge Pipeline
Document parsing, embedding generation, and semantic clustering.
\"\"\"

from mycodexvantaos_knowledge_pipeline.models import (
    DocumentInput,
    ParsedDocument,
    EmbeddingResult,
    ClusterResult,
)

__all__ = [
    "DocumentInput",
    "ParsedDocument",
    "EmbeddingResult",
    "ClusterResult",
]
""",
        "models": """\"\"\"
Knowledge Pipeline data models
Matches contracts/schemas/knowledge-model.schema.json
\"\"\"

from __future__ import annotations

from pydantic import BaseModel, Field


class DocumentInput(BaseModel):
    \"\"\"Input document for processing\"\"\"
    document_id: str
    filename: str
    content_type: str
    content: str
    metadata: dict[str, object] = Field(default_factory=dict)


class ParsedDocument(BaseModel):
    \"\"\"Parsed document with extracted chunks\"\"\"
    document_id: str
    chunks: list[str] = Field(default_factory=list)
    metadata: dict[str, object] = Field(default_factory=dict)


class EmbeddingResult(BaseModel):
    \"\"\"Embedding generation result\"\"\"
    document_id: str
    chunk_ids: list[str]
    embeddings: list[list[float]] = Field(default_factory=list)
    model: str = "text-embedding-3-small"
    total_tokens: int = 0


class ClusterResult(BaseModel):
    \"\"\"Semantic clustering result\"\"\"
    clusters: list[dict[str, object]] = Field(default_factory=list)
    total_documents: int = 0
    total_clusters: int = 0
""",
    },
    "mycodexvantaos-agent-worker": {
        "desc": "Agent Worker — AI-powered agent execution for RAG, tool use, and multi-step reasoning",
        "deps": ["pydantic>=2.9.0", "pydantic-settings>=2.5.0"],
        "opt_deps": {"llm": ["openai>=1.30.0", "anthropic>=0.25.0"]},
        "types": ["AgentTask", "AgentResult", "ToolInvocation"],
        "index": """\"\"\"
MyCodeXvantaOS Agent Worker
AI-powered agent execution for RAG, tool use, and multi-step reasoning.
\"\"\"

from mycodexvantaos_agent_worker.models import (
    AgentTask,
    AgentResult,
    ToolInvocation,
)

__all__ = [
    "AgentTask",
    "AgentResult",
    "ToolInvocation",
]
""",
        "models": """\"\"\"
Agent Worker data models
\"\"\"

from __future__ import annotations

from pydantic import BaseModel, Field


class AgentTask(BaseModel):
    \"\"\"A task for the agent worker to execute\"\"\"
    task_id: str
    session_id: str
    prompt: str
    collection_ids: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    max_steps: int = 10
    metadata: dict[str, object] = Field(default_factory=dict)


class ToolInvocation(BaseModel):
    \"\"\"Record of a tool invocation during agent execution\"\"\"
    tool_name: str
    arguments: dict[str, object] = Field(default_factory=dict)
    result: str | None = None
    error: str | None = None
    duration_ms: float = 0.0


class AgentResult(BaseModel):
    \"\"\"Result from agent execution\"\"\"
    task_id: str
    session_id: str
    response: str
    tool_invocations: list[ToolInvocation] = Field(default_factory=list)
    total_tokens: int = 0
    evidence_level: str = "knowledge-assisted"
    metadata: dict[str, object] = Field(default_factory=dict)
""",
    },
    "mycodexvantaos-vector-tools": {
        "desc": "Vector Tools — Similarity search, reranking, and vector utilities",
        "deps": ["pydantic>=2.9.0", "pydantic-settings>=2.5.0"],
        "opt_deps": {"ml": ["scikit-learn>=1.5.0", "numpy>=2.0.0"]},
        "types": ["VectorSearchQuery", "VectorSearchResult", "RerankResult"],
        "index": """\"\"\"
MyCodeXvantaOS Vector Tools
Similarity search, reranking, and vector utilities.
\"\"\"

from mycodexvantaos_vector_tools.models import (
    VectorSearchQuery,
    VectorSearchResult,
    RerankResult,
)

__all__ = [
    "VectorSearchQuery",
    "VectorSearchResult",
    "RerankResult",
]
""",
        "models": """\"\"\"
Vector Tools data models
\"\"\"

from __future__ import annotations

from pydantic import BaseModel, Field


class VectorSearchQuery(BaseModel):
    \"\"\"Vector similarity search query\"\"\"
    query_vector: list[float]
    top_k: int = 10
    filter: dict[str, object] | None = None
    namespace: str | None = None


class VectorSearchResult(BaseModel):
    \"\"\"Vector similarity search result\"\"\"
    id: str
    score: float
    metadata: dict[str, object] = Field(default_factory=dict)
    content: str | None = None


class RerankResult(BaseModel):
    \"\"\"Reranked search results\"\"\"
    results: list[VectorSearchResult]
    original_count: int = 0
    reranked_count: int = 0
    model: str = "default"
""",
    },
    "mycodexvantaos-evaluation": {
        "desc": "Evaluation — AI evaluation tools, metrics, and benchmarking",
        "deps": ["pydantic>=2.9.0", "pydantic-settings>=2.5.0"],
        "opt_deps": {},
        "types": ["EvaluationRun", "EvaluationMetric", "EvaluationReport"],
        "index": """\"\"\"
MyCodeXvantaOS Evaluation
AI evaluation tools, metrics, and benchmarking.
\"\"\"

from mycodexvantaos_evaluation.models import (
    EvaluationRun,
    EvaluationMetric,
    EvaluationReport,
)

__all__ = [
    "EvaluationRun",
    "EvaluationMetric",
    "EvaluationReport",
]
""",
        "models": """\"\"\"
Evaluation data models
\"\"\"

from __future__ import annotations

from pydantic import BaseModel, Field


class EvaluationMetric(BaseModel):
    \"\"\"A single evaluation metric\"\"\"
    name: str
    value: float
    threshold: float | None = None
    passed: bool | None = None
    description: str | None = None


class EvaluationRun(BaseModel):
    \"\"\"An evaluation run configuration\"\"\"
    run_id: str
    target_service: str
    metrics: list[str] = Field(default_factory=list)
    dataset: str | None = None
    metadata: dict[str, object] = Field(default_factory=dict)


class EvaluationReport(BaseModel):
    \"\"\"Evaluation report with results\"\"\"
    run_id: str
    target_service: str
    metrics: list[EvaluationMetric] = Field(default_factory=list)
    overall_passed: bool = True
    summary: str | None = None
    created_at: str | None = None
""",
    },
}

for pkg_name, cfg in PYTHON_PACKAGES.items():
    mod_name = pkg_name.replace("-", "_")
    pkg_dir = f"python/packages/{pkg_name}"

    opt_deps_str = ""
    if cfg.get("opt_deps"):
        opt_deps_str = "\n".join(
            f"  {k} = [\n    " + ",\n    ".join(f'"{v}"' for v in vs) + "\n  ]"
            for k, vs in cfg["opt_deps"].items()
        )
        opt_deps_str = f"\n[project.optional-dependencies]\n{opt_deps_str}\n"

    write(
        f"{pkg_dir}/pyproject.toml",
        f"""[project]
name = "{pkg_name}"
version = "0.1.0"
description = "{cfg["desc"]}"
readme = "README.md"
requires-python = ">=3.11"
license = {{text = "MIT"}}
authors = [
    {{name = "NinjaTeam AI", email = "ai-team@ninjatech.ai"}},
]
dependencies = [
{chr(10).join(f'    "{d}",' for d in cfg["deps"])}
]
{opt_deps_str}
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["{mod_name}"]

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.mypy]
python_version = "3.11"
strict = true
""",
    )

    types_list = "\n".join(f"- `{t}`" for t in cfg["types"])
    write(
        f"{pkg_dir}/README.md",
        f"""# {pkg_name}

{cfg["desc"]}

## Core Types

{types_list}

## Status

🚧 Skeleton — pydantic models with TODO markers for implementation.
""",
    )

    write(f"{pkg_dir}/{mod_name}/__init__.py", cfg["index"])
    write(f"{pkg_dir}/{mod_name}/models.py", cfg["models"])

# Python apps
PYTHON_APPS = {
    "knowledge-worker": {
        "desc": "Knowledge Worker CLI — Executes knowledge pipeline jobs (ingest, embed, cluster)",
        "pkg_dep": "mycodexvantaos-knowledge-pipeline",
    },
    "agent-worker": {
        "desc": "Agent Worker CLI — Executes agent tasks (RAG, tool use, reasoning)",
        "pkg_dep": "mycodexvantaos-agent-worker",
    },
}

for app_name, cfg in PYTHON_APPS.items():
    app_dir = f"python/apps/{app_name}"

    write(
        f"{app_dir}/pyproject.toml",
        f"""[project]
name = "{app_name}"
version = "0.1.0"
description = "{cfg["desc"]}"
readme = "README.md"
requires-python = ">=3.11"
license = {{text = "MIT"}}
authors = [
    {{name = "NinjaTeam AI", email = "ai-team@ninjatech.ai"}},
]
dependencies = [
    "pydantic>=2.9.0",
    "{cfg["pkg_dep"]}",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.mypy]
python_version = "3.11"
strict = true
""",
    )

    write(
        f"{app_dir}/README.md",
        f"""# {app_name}

{cfg["desc"]}

## Usage

```bash
# Run knowledge pipeline job
uv run python main.py --job-type ingest --input data.json

# Dry run
uv run python main.py --job-type ingest --input data.json --dry-run
```

## Status

🚧 Skeleton — CLI entry point with TODO markers.
""",
    )

    write(
        f"{app_dir}/main.py",
        f"""\"\"\"
{app_name} — {cfg["desc"]}
\"\"\"

import argparse
import json
import sys


def execute_job(job_type: str, input_path: str, dry_run: bool = False) -> dict:
    \"\"\"
    Execute a {app_name} job.

    In production, this would:
    1. Load job configuration from database (authorized by TS control plane)
    2. Execute the job using {cfg["pkg_dep"]}
    3. Write results back to database / artifact storage
    4. Audit log the completion

    For now, returns a placeholder result.
    \"\"\"
    with open(input_path) as f:
        input_data = json.load(f)

    result = {{
        "job_type": job_type,
        "status": "completed" if not dry_run else "dry-run",
        "input_count": len(input_data) if isinstance(input_data, list) else 1,
        "dry_run": dry_run,
        "message": "TODO: implement actual job execution",
    }}

    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="{cfg["desc"]}")
    parser.add_argument("--job-type", required=True, help="Type of job to execute")
    parser.add_argument("--input", required=True, help="Path to input JSON file")
    parser.add_argument("--dry-run", action="store_true", help="Only report what would be done")
    args = parser.parse_args()

    result = execute_job(args.job_type, args.input, args.dry_run)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
""",
    )


print("\n✅ Sec.16 — All 4 new Python packages + 2 new Python apps created")

# ═══════════════════════════════════════════════════════════════
# Sec.20 — runtimes/local/
# ═══════════════════════════════════════════════════════════════

write(
    "runtimes/local/README.md",
    """# Local Runtime

Runtime configuration for local development and testing.

## Supported Providers

- Database: SQLite (file-based)
- Cache: In-memory Map
- Storage: Local filesystem
- Queue: In-process (asyncio)
- AI: Ollama (optional)

## Supported Services

All platform services can run locally for development.

## Usage

```bash
# Start local API server
pnpm --filter @mycodexvantaos/api-node dev

# Run with Docker Compose (optional)
docker-compose -f infra/docker-compose/docker-compose.yml up
```

## Self-Hostable

Yes — the local runtime is the primary self-hostable configuration.
""",
)

write(
    "runtimes/local/runtime.yaml",
    """id: local
display_name: Local Development Runtime
description: Local development and testing runtime
supported_services:
  - identity
  - workspace
  - service-catalog
  - resource-registry
  - policy-engine
  - audit-log
  - usage-meter
  - knowledge-store
  - knowledge-search
  - agent-chat
  - model-byok
  - memory-store
  - memory-capture
  - memory-dream
storage_backend: filesystem
database_backend: sqlite
queue_backend: in-process
ai_provider_support:
  - ollama
  - openai
  - anthropic
self_hostable: true
""",
)

print("\n✅ Sec.20 — runtimes/local/ created")

# ═══════════════════════════════════════════════════════════════
# Sec.21 — Cloudflare Providers (5 providers)
# ═══════════════════════════════════════════════════════════════

CF_PROVIDERS = {
    "cloudflare-d1": (
        "Cloudflare D1 Provider",
        "SQLite-based database adapter for Cloudflare D1",
    ),
    "cloudflare-kv": (
        "Cloudflare KV Provider",
        "Key-value cache and session adapter for Cloudflare KV",
    ),
    "cloudflare-r2": (
        "Cloudflare R2 Provider",
        "Object storage adapter for Cloudflare R2",
    ),
    "cloudflare-workers-ai": (
        "Cloudflare Workers AI Provider",
        "Chat and embedding model adapter for Workers AI",
    ),
    "cloudflare-vectorize": (
        "Cloudflare Vectorize Provider",
        "Vector search adapter for Cloudflare Vectorize",
    ),
}

for prov_name, (display, desc) in CF_PROVIDERS.items():
    prov_dir = f"providers/mycodexvantaos-provider-{prov_name}"

    write(
        f"{prov_dir}/package.json",
        f"""{{
  "name": "@mycodexvantaos/provider-{prov_name}",
  "version": "0.1.0",
  "description": "{desc}",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {{
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \\"TODO: add tests\\" && exit 0"
  }},
  "keywords": ["mycodexvantaos", "provider", "{prov_name}"],
  "license": "MIT",
  "devDependencies": {{
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }},
  "dependencies": {{
    "@mycodexvantaos/core": "workspace:*",
    "@mycodexvantaos/ports": "workspace:*"
  }}
}}
""",
    )

    write(
        f"{prov_dir}/tsconfig.json",
        """{
  "extends": "../../tsconfig.providers.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
""",
    )

    write(
        f"{prov_dir}/README.md",
        f"""# @mycodexvantaos/provider-{prov_name}

{desc}

Part of the Cloudflare runtime provider set.

## Status

🚧 Skeleton — implements port interfaces with TODO markers.
""",
    )

    write(
        f"{prov_dir}/CHANGELOG.md",
        f"""# @mycodexvantaos/provider-{prov_name}

## 0.1.0 (2025-05-15)

- Initial skeleton
""",
    )

    write(
        f"{prov_dir}/src/index.ts",
        f"""/**
 * @mycodexvantaos/provider-{prov_name}
 * {desc}
 *
 * Implements port interfaces from @mycodexvantaos/ports
 * for the Cloudflare runtime.
 */

// TODO: Implement {display} adapter
// TODO: Import relevant port interface from @mycodexvantaos/ports
// TODO: Implement adapter class

export {{}};
""",
    )

print("\n✅ Sec.21 — All 5 Cloudflare providers created")

# ═══════════════════════════════════════════════════════════════
# Sec.22 — Missing Apps (api-node, admin-console)
# ═══════════════════════════════════════════════════════════════

write(
    "apps/api-node/package.json",
    """{
  "name": "@mycodexvantaos/api-node",
  "version": "0.1.0",
  "private": true,
  "description": "Node.js API server for self-hosted / Docker / Kubernetes runtime",
  "type": "module",
  "main": "index.ts",
  "scripts": {
    "dev": "npx tsx watch index.ts",
    "build": "npx tsup index.ts --format esm --outDir dist",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@mycodexvantaos/core": "workspace:*",
    "@mycodexvantaos/ports": "workspace:*",
    "@mycodexvantaos/application": "workspace:*",
    "@mycodexvantaos/adapters": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  },
  "license": "UNLICENSED"
}
""",
)

write(
    "apps/api-node/README.md",
    """# @mycodexvantaos/api-node

Node.js API server for self-hosted / Docker / Kubernetes runtime.

Shares the same route definitions as `api-worker` but runs on Node.js
instead of Cloudflare Workers.

## Status

🚧 Skeleton — route definitions with TODO markers.
""",
)

write(
    "apps/api-node/index.ts",
    """/**
 * @module apps/api-node
 * @description Node.js API server for self-hosted deployment.
 *
 * Shares route definitions with the Cloudflare Workers api-worker
 * but uses Node.js adapters (SQLite, filesystem, etc.) instead.
 */

// TODO: Import route definitions from shared config
// TODO: Wire up Node.js adapters (SQLite, filesystem, in-process queue)
// TODO: Start HTTP server

console.log('MyCodeXvantaOS API Node — TODO: implement');
""",
)

write(
    "apps/admin-console/package.json",
    """{
  "name": "@mycodexvantaos/admin-console",
  "version": "0.1.0",
  "private": true,
  "description": "Admin console for platform management",
  "type": "module",
  "scripts": {
    "dev": "echo \\"TODO: setup Next.js dev\\" && exit 0"
  },
  "license": "UNLICENSED"
}
""",
)

write(
    "apps/admin-console/README.md",
    """# @mycodexvantaos/admin-console

Admin console for platform management — user management, policy configuration, audit review, usage dashboards.

## Status

🚧 Placeholder — to be implemented.
""",
)

print("\n✅ Sec.22 — apps/api-node + apps/admin-console created")

print("\n" + "=" * 60)
print("✅ ALL SCAFFOLD FILES GENERATED SUCCESSFULLY")
print("=" * 60)
