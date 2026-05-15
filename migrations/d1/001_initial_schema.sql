-- ═══════════════════════════════════════════════════════════════════
-- MyCodeXvantaOS — D1 Initial Schema Migration
-- Version: 001
-- Description: Core tables for all 8 MVP services
-- Compatible: Cloudflare D1 (SQLite-based)
-- ═══════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1. Identity Service Tables
-- ────────────────────────────────────────────────────────────────

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

-- Active sessions (cached in KV, persisted in D1 for audit)
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

-- ────────────────────────────────────────────────────────────────
-- 2. Workspace Service Tables
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspaces (
  id              TEXT PRIMARY KEY,
  display_name    TEXT NOT NULL,
  description     TEXT,
  tier            TEXT NOT NULL DEFAULT 'free'
                    CHECK (tier IN ('free', 'pro', 'enterprise')),
  phase           TEXT NOT NULL DEFAULT 'active'
                    CHECK (phase IN ('creating', 'active', 'suspended', 'deleted')),
  settings        TEXT NOT NULL DEFAULT '{}',  -- JSON: data_residency, retention_policy
  quotas          TEXT NOT NULL DEFAULT '{}',  -- JSON: per-dimension limits
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

-- ────────────────────────────────────────────────────────────────
-- 3. Knowledge Store Service Tables
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_collections (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
  display_name    TEXT NOT NULL,
  description     TEXT,
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  document_count  INTEGER NOT NULL DEFAULT 0,
  total_chunks    INTEGER NOT NULL DEFAULT 0,
  phase           TEXT NOT NULL DEFAULT 'active'
                    CHECK (phase IN ('creating', 'active', 'archived', 'deleted')),
  freshness_score REAL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX idx_knowledge_collections_workspace ON knowledge_collections(workspace_id);
CREATE INDEX idx_knowledge_collections_phase ON knowledge_collections(phase);

CREATE TABLE IF NOT EXISTS documents (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
  collection_id   TEXT NOT NULL REFERENCES knowledge_collections(id),
  filename        TEXT NOT NULL,
  content_type    TEXT NOT NULL,
  r2_key          TEXT NOT NULL,  -- R2 object key
  size_bytes      INTEGER NOT NULL DEFAULT 0,
  phase           TEXT NOT NULL DEFAULT 'uploaded'
                    CHECK (phase IN ('uploaded', 'validating', 'extracting', 'chunking',
                                     'embedding', 'indexing', 'verifying', 'ingested', 'failed')),
  chunk_count     INTEGER NOT NULL DEFAULT 0,
  chunking_strategy TEXT DEFAULT '{}',  -- JSON
  error_message   TEXT,
  owner_id        TEXT NOT NULL REFERENCES identity_subjects(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX idx_documents_workspace ON documents(workspace_id);
CREATE INDEX idx_documents_collection ON documents(collection_id);
CREATE INDEX idx_documents_phase ON documents(phase);

CREATE TABLE IF NOT EXISTS document_chunks (
  id              TEXT PRIMARY KEY,
  document_id     TEXT NOT NULL REFERENCES documents(id),
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
  collection_id   TEXT NOT NULL REFERENCES knowledge_collections(id),
  chunk_index     INTEGER NOT NULL,
  content         TEXT NOT NULL,
  token_count     INTEGER NOT NULL DEFAULT 0,
  embedding_id    TEXT,  -- Vectorize vector ID
  metadata        TEXT DEFAULT '{}',  -- JSON: page_number, section, etc.
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX idx_document_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_collection ON document_chunks(collection_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks(embedding_id);

-- Full-text search index for knowledge search (FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS document_chunks_fts USING fts5(
  content,
  content='document_chunks',
  content_rowid='rowid',
  tokenize='unicode61'
);

-- ────────────────────────────────────────────────────────────────
-- 4. AI Chat Service Tables
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_sessions (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
  subject_id      TEXT NOT NULL REFERENCES identity_subjects(id),
  title           TEXT,
  model_endpoint_id TEXT REFERENCES model_endpoints(id),
  collection_ids  TEXT DEFAULT '[]',  -- JSON array of collection IDs
  system_prompt   TEXT,
  message_count   INTEGER NOT NULL DEFAULT 0,
  phase           TEXT NOT NULL DEFAULT 'active'
                    CHECK (phase IN ('active', 'archived', 'deleted')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX idx_chat_sessions_workspace ON chat_sessions(workspace_id);
CREATE INDEX idx_chat_sessions_subject ON chat_sessions(subject_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL REFERENCES chat_sessions(id),
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
  role            TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content         TEXT NOT NULL,
  model           TEXT,
  evidence_level  TEXT
                    CHECK (evidence_level IN ('knowledge-assisted', 'knowledge-verified', 'knowledge-grounded')),
  source_chunk_ids TEXT DEFAULT '[]',  -- JSON array
  input_tokens    INTEGER DEFAULT 0,
  output_tokens   INTEGER DEFAULT 0,
  safety_flags    TEXT DEFAULT '[]',   -- JSON array
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- ────────────────────────────────────────────────────────────────
-- 5. Model BYOK Service Tables
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS model_endpoints (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
  display_name    TEXT NOT NULL,
  provider        TEXT NOT NULL
                    CHECK (provider IN ('openai', 'anthropic', 'google', 'ollama', 'custom')),
  model_id        TEXT NOT NULL,
  base_url        TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,  -- AES-256-GCM encrypted
  parameters      TEXT DEFAULT '{}',  -- JSON: temperature, max_tokens, top_p
  phase           TEXT NOT NULL DEFAULT 'active'
                    CHECK (phase IN ('registering', 'active', 'unhealthy', 'deleted')),
  last_health_check TEXT,
  health_status   TEXT DEFAULT 'unknown'
                    CHECK (health_status IN ('healthy', 'unhealthy', 'unknown')),
  owner_id        TEXT NOT NULL REFERENCES identity_subjects(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX idx_model_endpoints_workspace ON model_endpoints(workspace_id);
CREATE INDEX idx_model_endpoints_provider ON model_endpoints(provider);
CREATE INDEX idx_model_endpoints_phase ON model_endpoints(phase);

-- ────────────────────────────────────────────────────────────────
-- 6. Audit Log Service Tables
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_events (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  category        TEXT NOT NULL
                    CHECK (category IN ('identity', 'workspace', 'knowledge', 'ai', 'model', 'governance')),
  severity        TEXT NOT NULL
                    CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  subject_id      TEXT NOT NULL,
  workspace_id    TEXT NOT NULL,
  resource_urn    TEXT,
  data            TEXT NOT NULL DEFAULT '{}',  -- JSON
  timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
  correlation_id  TEXT,
  parent_event_id TEXT,
  -- Integrity chain fields
  hash            TEXT NOT NULL,  -- SHA-256 of this event
  previous_hash   TEXT,           -- SHA-256 of previous event (NULL for genesis)
  chain_index     INTEGER NOT NULL,
  -- Closed-loop fields
  pair_id         TEXT,
  pair_role       TEXT CHECK (pair_role IN ('request', 'completion', 'failure')),
  pair_timeout_at TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_events_workspace ON audit_events(workspace_id);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_category ON audit_events(category);
CREATE INDEX idx_audit_events_subject ON audit_events(subject_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_events_chain ON audit_events(chain_index);
CREATE INDEX idx_audit_events_pair ON audit_events(pair_id);

-- ────────────────────────────────────────────────────────────────
-- 7. Usage Meter Service Tables
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_records (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
  subject_id      TEXT NOT NULL REFERENCES identity_subjects(id),
  dimension       TEXT NOT NULL
                    CHECK (dimension IN ('api_calls', 'storage_bytes', 'search_queries',
                                         'model_tokens_input', 'model_tokens_output',
                                         'documents_ingested', 'chat_messages', 'audit_events')),
  quantity        REAL NOT NULL,
  unit            TEXT NOT NULL,
  resource_urn    TEXT NOT NULL,
  recorded_at     TEXT NOT NULL DEFAULT (datetime('now')),
  billing_period  TEXT NOT NULL,  -- YYYY-MM
  metadata        TEXT DEFAULT '{}',  -- JSON
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_usage_records_workspace ON usage_records(workspace_id);
CREATE INDEX idx_usage_records_dimension ON usage_records(dimension);
CREATE INDEX idx_usage_records_billing ON usage_records(billing_period);
CREATE INDEX idx_usage_records_workspace_dim_period ON usage_records(workspace_id, dimension, billing_period);
CREATE INDEX idx_usage_records_recorded ON usage_records(recorded_at);

-- ────────────────────────────────────────────────────────────────
-- 8. Migration Tracking
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS _migrations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  applied_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO _migrations (name) VALUES ('001_initial_schema');
