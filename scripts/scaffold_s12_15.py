#!/usr/bin/env python3
"""Generate §12 Event Contracts, §13 Policy Contracts, §14 JSON Schemas, §15 Migrations"""
import os, json

BASE = "/workspace/mycodexvantaos"
created = 0
skipped = 0

def write(path, content):
    global created, skipped
    full = os.path.join(BASE, path)
    if os.path.exists(full):
        skipped += 1
        return
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    created += 1
    print(f"  OK {path}")

# ═══════════════════════════════════════════════
# §12 - Event Contracts
# ═══════════════════════════════════════════════

events = {
    "audit-events": ("audit", [
        "audit.event-recorded", "audit.chain-verified", "audit.chain-violation-detected",
        "audit.event-queried", "audit.integrity-check-completed",
    ]),
    "knowledge-events": ("knowledge", [
        "knowledge.collection-created", "knowledge.collection-archived",
        "knowledge.document-uploaded", "knowledge.document-chunked",
        "knowledge.document-embedded", "knowledge.document-ingested",
        "knowledge.document-failed", "knowledge.search-performed",
        "knowledge.retrieval-completed", "knowledge.answer-trace-created",
        "knowledge.issue-detected", "knowledge.repair-initiated",
    ]),
    "memory-events": ("memory", [
        "memory.candidate-created", "memory.candidate-promoted", "memory.candidate-rejected",
        "memory.item-created", "memory.item-updated", "memory.item-reinforced",
        "memory.item-merged", "memory.item-deprecated", "memory.item-orphaned",
        "memory.conflict-detected", "memory.conflict-resolved",
        "memory.dream-started", "memory.dream-scan-completed",
        "memory.dream-merge-completed", "memory.dream-conflict-resolved",
        "memory.dream-orphan-cleaned", "memory.dream-completed",
        "memory.dream-failed", "memory.dream-rollback",
    ]),
    "agent-events": ("agent", [
        "agent.session-created", "agent.session-archived",
        "agent.message-sent", "agent.message-received",
        "agent.tool-invoked", "agent.tool-completed",
        "agent.generation-started", "agent.generation-completed",
    ]),
    "usage-events": ("usage", [
        "usage.api-call-recorded", "usage.token-usage-recorded",
        "usage.storage-bytes-recorded", "usage.rate-limit-checked",
        "usage.quota-warning", "usage.quota-exceeded",
    ]),
    "runtime-events": ("runtime", [
        "runtime.started", "runtime.stopped", "runtime.health-checked",
        "runtime.provider-connected", "runtime.provider-disconnected",
        "runtime.adapter-failed", "runtime.migration-applied",
    ]),
}

for filename, (category, event_list) in events.items():
    events_yaml = "\n".join(f"  - {e}" for e in event_list)
    write(f"contracts/events/{filename}.yaml",
          f"category: {category}\ndescription: Event contracts for {category} domain\nevents:\n{events_yaml}\n")

print(f"\nSection 12 done (created={created}, skipped={skipped})")

# ═══════════════════════════════════════════════
# §13 - Policy Contracts
# ═══════════════════════════════════════════════

policies = {
    "default-access-policy": {
        "id": "default-access-policy",
        "description": "Default access control policy for platform resources",
        "rules": [
            {"effect": "allow", "subject": {"roles": ["platform-admin"]}, "action": "*", "resource": "*"},
            {"effect": "allow", "subject": {"roles": ["workspace-owner"]}, "action": "*", "resource": "workspace/*"},
            {"effect": "allow", "subject": {"roles": ["workspace-member"]}, "action": "read,write", "resource": "workspace/*"},
            {"effect": "allow", "subject": {"roles": ["workspace-viewer"]}, "action": "read", "resource": "workspace/*"},
        ],
    },
    "knowledge-access-policy": {
        "id": "knowledge-access-policy",
        "description": "Access policy for knowledge store operations",
        "rules": [
            {"effect": "allow", "subject": {"roles": ["workspace-member", "workspace-owner"]}, "action": "knowledge:ingest", "resource": "knowledge/collections/*"},
            {"effect": "allow", "subject": {"roles": ["workspace-viewer", "workspace-member", "workspace-owner"]}, "action": "knowledge:search", "resource": "knowledge/collections/*"},
        ],
    },
    "memory-dream-policy": {
        "id": "memory-dream-policy",
        "description": "Policy for memory dream operations - architecture decisions require review",
        "rules": [
            {"effect": "require-review", "subject": {"service": "memory-dream"}, "action": "memory-item-deprecate,memory-item-merge", "resource": "memory-item", "condition": {"memory_type": "decision", "tags_contains": ["architecture"]}},
            {"effect": "allow", "subject": {"roles": ["workspace-owner", "platform-admin"]}, "action": "dream:run", "resource": "dream-run"},
            {"effect": "allow", "subject": {"service": "memory-dream"}, "action": "dream:execute", "resource": "dream-run", "condition": {"mode": "proposal"}},
        ],
    },
    "model-byok-policy": {
        "id": "model-byok-policy",
        "description": "Policy for BYOK model endpoint management",
        "rules": [
            {"effect": "allow", "subject": {"roles": ["workspace-owner"]}, "action": "model:register,model:delete", "resource": "model-endpoint"},
            {"effect": "allow", "subject": {"roles": ["workspace-member", "workspace-owner"]}, "action": "model:invoke", "resource": "model-endpoint"},
        ],
    },
    "audit-retention-policy": {
        "id": "audit-retention-policy",
        "description": "Audit event retention and integrity policy",
        "rules": [
            {"effect": "deny", "subject": "*", "action": "audit:delete", "resource": "audit-event"},
            {"effect": "allow", "subject": {"roles": ["platform-admin", "auditor"]}, "action": "audit:query,audit:verify", "resource": "audit-event"},
        ],
    },
}

def format_subject(s):
    if isinstance(s, str):
        return f" '{s}'"
    lines = "\n"
    for k, v in s.items():
        lines += f"      {k}: {v}\n"
    return lines.rstrip()

def format_condition(c):
    if not c:
        return ""
    lines = "\n    condition:\n"
    for k, v in c.items():
        lines += f"      {k}: {v}\n"
    return lines.rstrip()

for policy_id, cfg in policies.items():
    rules_yaml = ""
    for r in cfg["rules"]:
        cond = format_condition(r.get("condition"))
        subj = format_subject(r["subject"])
        rules_yaml += f"""
  - effect: {r['effect']}
    subject:{subj}
    action: {r['action']}
    resource: {r['resource']}{cond}
"""
    write(f"contracts/policies/{policy_id}.yaml",
          f"id: {cfg['id']}\ndescription: {cfg['description']}\nrules:{rules_yaml}\n")

print(f"\nSection 13 done (created={created}, skipped={skipped})")

# ═══════════════════════════════════════════════
# §14 - Missing JSON Schemas
# ═══════════════════════════════════════════════

schemas = {
    "policy.schema.json": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "https://mycodexvantaos.com/schemas/policy.schema.json",
        "title": "Policy",
        "description": "Policy definition for platform access control",
        "type": "object",
        "properties": {
            "id": {"type": "string", "description": "Policy identifier"},
            "description": {"type": "string"},
            "rules": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "effect": {"type": "string", "enum": ["allow", "deny", "require-review"]},
                        "subject": {"type": "object"},
                        "action": {"type": "string"},
                        "resource": {"type": "string"},
                        "condition": {"type": "object"}
                    },
                    "required": ["effect", "subject", "action", "resource"]
                }
            }
        },
        "required": ["id", "rules"]
    },
    "knowledge-model.schema.json": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "https://mycodexvantaos.com/schemas/knowledge-model.schema.json",
        "title": "Knowledge Model",
        "description": "Knowledge model types",
        "type": "object",
        "definitions": {
            "Document": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "collectionId": {"type": "string"},
                    "filename": {"type": "string"},
                    "contentType": {"type": "string"},
                    "phase": {"type": "string"}
                },
                "required": ["id", "collectionId", "filename"]
            },
            "DocumentChunk": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "documentId": {"type": "string"},
                    "content": {"type": "string"},
                    "tokenCount": {"type": "integer"}
                },
                "required": ["id", "documentId", "content"]
            },
            "KnowledgeCollection": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "displayName": {"type": "string"},
                    "embeddingModel": {"type": "string"},
                    "documentCount": {"type": "integer"}
                },
                "required": ["id", "displayName"]
            }
        }
    },
    "memory-model.schema.json": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "https://mycodexvantaos.com/schemas/memory-model.schema.json",
        "title": "Memory Model",
        "description": "Memory model types",
        "type": "object",
        "definitions": {
            "MemoryItem": {
                "type": "object",
                "properties": {
                    "memoryId": {"type": "string"},
                    "content": {"type": "string"},
                    "status": {"type": "string", "enum": ["candidate", "active", "reinforced", "merged", "deprecated", "orphaned", "archived", "rejected"]},
                    "memoryType": {"type": "string", "enum": ["observation", "reflection", "decision", "event", "fact", "opinion", "plan", "system"]},
                    "tags": {"type": "array", "items": {"type": "string"}},
                    "relatedEntities": {"type": "array", "items": {"type": "string"}},
                    "conflictsWith": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["memoryId", "content", "status"]
            },
            "MemoryCandidate": {
                "type": "object",
                "properties": {
                    "candidateId": {"type": "string"},
                    "content": {"type": "string"},
                    "source": {"type": "string"},
                    "status": {"type": "string", "enum": ["candidate"]}
                },
                "required": ["candidateId", "content", "source"]
            },
            "MemoryConflict": {
                "type": "object",
                "properties": {
                    "conflictId": {"type": "string"},
                    "memoryIds": {"type": "array", "items": {"type": "string"}},
                    "conflictType": {"type": "string", "enum": ["factual", "temporal", "semantic"]},
                    "severity": {"type": "string", "enum": ["low", "medium", "high"]}
                },
                "required": ["conflictId", "memoryIds", "conflictType"]
            }
        }
    },
    "runtime-adapter.schema.json": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "https://mycodexvantaos.com/schemas/runtime-adapter.schema.json",
        "title": "Runtime Adapter",
        "description": "Runtime and adapter definitions for multi-runtime support",
        "type": "object",
        "definitions": {
            "RuntimeDefinition": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "displayName": {"type": "string"},
                    "supportedServices": {"type": "array", "items": {"type": "string"}},
                    "selfHostable": {"type": "boolean"}
                },
                "required": ["id", "displayName"]
            },
            "ProviderDefinition": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "runtimeId": {"type": "string"},
                    "category": {"type": "string"}
                },
                "required": ["id", "runtimeId", "category"]
            }
        }
    },
}

for schema_name, schema_data in schemas.items():
    write(f"contracts/schemas/{schema_name}", json.dumps(schema_data, indent=2) + "\n")

print(f"\nSection 14 done (created={created}, skipped={skipped})")

# ═══════════════════════════════════════════════
# §15 - D1 Migrations
# ═══════════════════════════════════════════════

migrations = {}

migrations["0002-service-catalog"] = """-- Service Catalog Tables
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
CREATE INDEX IF NOT EXISTS idx_service_definitions_category ON service_definitions(category);
"""

migrations["0003-resource-registry"] = """-- Resource Registry Tables
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
"""

migrations["0004-policy-model"] = """-- Policy Model Tables
CREATE TABLE IF NOT EXISTS policy_definitions (
  id              TEXT PRIMARY KEY,
  description     TEXT,
  rules           TEXT NOT NULL DEFAULT '[]',
  priority        INTEGER NOT NULL DEFAULT 0,
  phase           TEXT NOT NULL DEFAULT 'active',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_policy_definitions_phase ON policy_definitions(phase);
"""

migrations["0005-audit-log"] = """-- Audit Log Tables (extended from 001_initial_schema)
-- audit_events already created in 001, this adds indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_correlation ON audit_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_events(severity);
"""

migrations["0006-usage-meter"] = """-- Usage Meter Tables (extended from 001_initial_schema)
-- usage_records already created in 001, this adds indexes
CREATE INDEX IF NOT EXISTS idx_usage_records_subject ON usage_records(subject_id);
"""

migrations["0007-knowledge-model"] = """-- Knowledge Model Tables (extended from 001_initial_schema)
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
CREATE INDEX IF NOT EXISTS idx_knowledge_issues_collection ON knowledge_issues(collection_id);
"""

migrations["0008-memory-model"] = """-- Memory Model Tables
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
CREATE INDEX IF NOT EXISTS idx_memory_items_type ON memory_items(memory_type);
CREATE INDEX IF NOT EXISTS idx_memory_items_status ON memory_items(status);

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
CREATE INDEX IF NOT EXISTS idx_memory_relations_from ON memory_relations(from_memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_relations_to ON memory_relations(to_memory_id);

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
CREATE INDEX IF NOT EXISTS idx_memory_conflicts_status ON memory_conflicts(status);

CREATE TABLE IF NOT EXISTS memory_entity_references (
  entity_id       TEXT NOT NULL,
  memory_id       TEXT NOT NULL REFERENCES memory_items(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entity_id, memory_id)
);
CREATE INDEX IF NOT EXISTS idx_memory_entity_refs_entity ON memory_entity_references(entity_id);
"""

migrations["0009-memory-dream"] = """-- Memory Dream Tables
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
CREATE INDEX IF NOT EXISTS idx_memory_dream_runs_status ON memory_dream_runs(status);

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
CREATE INDEX IF NOT EXISTS idx_memory_dream_actions_run ON memory_dream_actions(dream_run_id);
CREATE INDEX IF NOT EXISTS idx_memory_dream_actions_status ON memory_dream_actions(status);
"""

for mig_name, sql in migrations.items():
    write(f"migrations/d1/{mig_name}.sql",
          f"-- MyCodeXvantaOS D1 Migration: {mig_name}\n-- Compatible: Cloudflare D1 (SQLite-based)\n\n{sql}\n")

print(f"\nSection 15 done (created={created}, skipped={skipped})")

print(f"\nTotal: created={created}, skipped={skipped}")
