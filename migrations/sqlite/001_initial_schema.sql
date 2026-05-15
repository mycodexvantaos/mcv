──══════════════════════════════════════════════════════════════════════════
-- MyCodeXvantaOS — SQLite Initial Schema Migration
-- Version: 001
-- Description: Core tables for all 8 MVP services (generic SQLite)
-- Compatible: SQLite 3.38+ (for math functions, JSON, and FTS5)
-- Note: This is the portable SQLite version. D1-specific migration
--       lives in migrations/d1/. The schemas are identical.
──══════════════════════════════════════════════════════════════════════════

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Identity Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS identity_subjects (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  phase           TEXT NOT NULL DEFAULT 'active'
                    CHECK (phase IN ('registering', 'active', 'suspended', 'deactivated')),
  platform_role   TEXT NOT NULL DEFAULT 'workspace-viewer'
                    CHECK (platform_role IN ('platform-admin', 'workspace-owner', 'workspace-member', 'workspace-viewer', 'agent-service', 'auditor')),
  password_hash   TEXT NOT NULL,
  mfa_enabled     INTEGER NOT NULL DEFAULT 0,
  mfa_secret      TEXT,
  last_login_at   TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX idx_identity_subjects_email ON identity_subjects(email);
CREATE INDEX idx_identity_subjects_phase ON identity_subjects(phase);

CREATE TABLE IF NOT EXISTS identity_sessions (
  id              TEXT PRIMARY KEY,
  subject_id      TEXT NOT NULL REFERENCES identity_subjects(id),
  token_hash      TEXT NOT NULL,
  ip_address      TEXT,
  user_agent      TEXT,
  expires_at      TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at      TEXT
);

CREATE INDEX idx_identity_sessions_subject ON identity_sessions(subject_id);
CREATE INDEX idx_identity_sessions_expires ON identity_sessions(expires_at);

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Workspace Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspaces (
  id              TEXT PRIMARY KEY,
  display_name    TEXT NOT NULL,
  description     TEXT,
  tier            TEXT NOT NULL DEFAULT 'free'
                    CHECK (tier IN ('free', 'pro', 'enterprise')),
  phase           TEXT NOT NULL DEFAULT 'active'
                    CHECK (phase IN ('creating', 'active', 'suspended', 'deleted')),
  settings        TEXT NOT NULL DEFAULT '{}',
  quotas          TEXT NOT NULL DEFAULT '{}',
  owner_id        TEXT NOT NULL REFERENCES identity_subjects(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_tier ON workspaces(tier);
CREATE INDEX idx_workspaces_phase ON workspaces(phase);

CREATE TABLE IF NOT EXISTS workspace_memberships (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
  subject_id      TEXT NOT NULL REFERENCES identity_subjects(id),
  role            TEXT NOT NULL
                    CHECK (role IN ('workspace-owner', 'workspace-member', 'workspace-viewer')),
  added_by        TEXT NOT NULL REFERENCES identity_subjects(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  removed_at      TEXT,
  UNIQUE(workspace_id, subject_id)
);

CREATE INDEX idx_workspace_memberships_workspace ON workspace_memberships(workspace_id);
CREATE INDEX idx_workspace_memberships_subject ON workspace_memberships(subject_id);

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Knowledge Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_collections (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  dimension       INTEGER NOT NULL DEFAULT 1536,
  document_count  INTEGER NOT NULL DEFAULT 0,
  total_size_bytes INTEGER NOT NULL DEFAULT 0,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX idx_knowledge_collections_workspace ON knowledge_collections(workspace_id);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id              TEXT PRIMARY KEY,
  collection_id   TEXT NOT NULL REFERENCES knowledge_collections(id),
  title           TEXT NOT NULL,
  source_uri      TEXT,
  mime_type       TEXT,
  size_bytes      INTEGER NOT NULL DEFAULT 0,
  hash_sha256     TEXT NOT NULL,
  phase           TEXT NOT NULL DEFAULT 'pending'
                    CHECK (phase IN ('pending', 'chunking', 'embedding', 'ready', 'error', 'deleted')),
  error_message   TEXT,
  metadata        TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX idx_knowledge_documents_collection ON knowledge_documents(collection_id);
CREATE INDEX idx_knowledge_documents_phase ON knowledge_documents(phase);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id              TEXT PRIMARY KEY,
  document_id     TEXT NOT NULL REFERENCES knowledge_documents(id),
  collection_id   TEXT NOT NULL REFERENCES knowledge_collections(id),
  content         TEXT NOT NULL,
  chunk_index     INTEGER NOT NULL,
  token_count     INTEGER NOT NULL DEFAULT 0,
  page_number     INTEGER,
  section_title   TEXT,
  metadata        TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_knowledge_chunks_document ON knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_chunks_collection ON knowledge_chunks(collection_id);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_chunks_fts USING fts5(
  content,
  content='knowledge_chunks',
  content_rowid='rowid',
  tokenize='unicode61'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER knowledge_chunks_ai AFTER INSERT ON knowledge_chunks BEGIN
  INSERT INTO knowledge_chunks_fts(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER knowledge_chunks_ad AFTER DELETE ON knowledge_chunks BEGIN
  INSERT INTO knowledge_chunks_fts(knowledge_chunks_fts, rowid, content) VALUES('delete', old.rowid, old.content);
END;

CREATE TRIGGER knowledge_chunks_au AFTER UPDATE ON knowledge_chunks BEGIN
  INSERT INTO knowledge_chunks_fts(knowledge_chunks_fts, rowid, content) VALUES('delete', old.rowid, old.content);
  INSERT INTO knowledge_chunks_fts(rowid, content) VALUES (new.rowid, new.content);
END;

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Agent Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_sessions (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
  model_endpoint_id TEXT,
  system_prompt   TEXT,
  metadata        TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX idx_agent_sessions_workspace ON agent_sessions(workspace_id);

CREATE TABLE IF NOT EXISTS agent_messages (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL REFERENCES agent_sessions(id),
  role            TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content         TEXT NOT NULL,
  model_id        TEXT,
  prompt_tokens   INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  evidence_level  TEXT
                    CHECK (evidence_level IN ('knowledge-assisted', 'knowledge-verified', 'knowledge-grounded')),
  source_trace_ids TEXT NOT NULL DEFAULT '[]',
  metadata        TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_agent_messages_session ON agent_messages(session_id);

-- ──────────────────────────────────────────────────────────────────────────
-- 5. Model Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS model_endpoints (
  id              TEXT PRIMARY KEY,
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  endpoint_url    TEXT,
  api_key_ref     TEXT,
  capabilities    TEXT NOT NULL DEFAULT '{}',
  rate_limits     TEXT NOT NULL DEFAULT '{}',
  pricing         TEXT NOT NULL DEFAULT '{}',
  phase           TEXT NOT NULL DEFAULT 'active'
                    CHECK (phase IN ('registering', 'active', 'deprecated', 'disabled')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_model_endpoints_provider ON model_endpoints(provider);

-- ──────────────────────────────────────────────────────────────────────────
-- 6. Audit Service Tables (SHA-256 integrity chain)
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_events (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  subject_id      TEXT,
  resource_urn    TEXT,
  action          TEXT NOT NULL,
  payload         TEXT NOT NULL DEFAULT '{}',
  pair_id         TEXT,
  previous_hash   TEXT NOT NULL,
  hash            TEXT NOT NULL,
  timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
  metadata        TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_audit_events_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_subject ON audit_events(subject_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_events_pair ON audit_events(pair_id);

-- ──────────────────────────────────────────────────────────────────────────
-- 7. Usage Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_events (
  id              TEXT PRIMARY KEY,
  subject_id      TEXT NOT NULL,
  workspace_id    TEXT NOT NULL,
  usage_type      TEXT NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 1,
  metadata        TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_usage_events_subject ON usage_events(subject_id);
CREATE INDEX idx_usage_events_workspace ON usage_events(workspace_id);
CREATE INDEX idx_usage_events_type ON usage_events(usage_type);
CREATE INDEX idx_usage_events_created ON usage_events(created_at);

-- ──────────────────────────────────────────────────────────────────────────
-- 8. Automation Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS automation_jobs (
  id              TEXT PRIMARY KEY,
  job_type        TEXT NOT NULL,
  payload         TEXT NOT NULL DEFAULT '{}',
  priority        INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'dead')),
  max_retries     INTEGER NOT NULL DEFAULT 3,
  retry_count     INTEGER NOT NULL DEFAULT 0,
  leased_by       TEXT,
  leased_at       TEXT,
  result          TEXT,
  error           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at    TEXT
);

CREATE INDEX idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX idx_automation_jobs_type ON automation_jobs(job_type);
CREATE INDEX idx_automation_jobs_priority ON automation_jobs(priority DESC);

-- ──────────────────────────────────────────────────────────────────────────
-- Seed: Platform genesis audit event
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO audit_events (id, event_type, subject_id, resource_urn, action, payload, previous_hash, hash, timestamp)
VALUES (
  'audit-00000000-0000-0000-0000-000000000001',
  'platform.genesis',
  'system',
  'urn:mycodexvantaos:platform:genesis:00000000-0000-0000-0000-000000000001',
  'initialize',
  '{"version": "0.1.0", "description": "Platform genesis event"}',
  '0000000000000000000000000000000000000000000000000000000000000000',
  'GENESIS_PLACEHOLDER_SHA256',
  datetime('now')
);
