──══════════════════════════════════════════════════════════════════════════
-- MyCodeXvantaOS — PostgreSQL Initial Schema Migration
-- Version: 001
-- Description: Core tables for all 8 MVP services (PostgreSQL 15+)
-- Note: Uses PostgreSQL-specific features: UUID type, JSONB, TIMESTAMPTZ,
--       GENERATED columns, and pgvector for vector similarity search.
──══════════════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector" CASCADE;  -- pgvector for embeddings

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Identity Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS identity_subjects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  phase           TEXT NOT NULL DEFAULT 'active'
                    CHECK (phase IN ('registering', 'active', 'suspended', 'deactivated')),
  platform_role   TEXT NOT NULL DEFAULT 'workspace-viewer'
                    CHECK (platform_role IN ('platform-admin', 'workspace-owner', 'workspace-member', 'workspace-viewer', 'agent-service', 'auditor')),
  password_hash   TEXT NOT NULL,
  mfa_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret      TEXT,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_identity_subjects_email ON identity_subjects(email);
CREATE INDEX idx_identity_subjects_phase ON identity_subjects(phase);

CREATE TABLE IF NOT EXISTS identity_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id      UUID NOT NULL REFERENCES identity_subjects(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,
  ip_address      INET,
  user_agent      TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);

CREATE INDEX idx_identity_sessions_subject ON identity_sessions(subject_id);
CREATE INDEX idx_identity_sessions_expires ON identity_sessions(expires_at);

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Workspace Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspaces (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name    TEXT NOT NULL,
  description     TEXT,
  tier            TEXT NOT NULL DEFAULT 'free'
                    CHECK (tier IN ('free', 'pro', 'enterprise')),
  phase           TEXT NOT NULL DEFAULT 'active'
                    CHECK (phase IN ('creating', 'active', 'suspended', 'deleted')),
  settings        JSONB NOT NULL DEFAULT '{}'::jsonb,
  quotas          JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_id        UUID NOT NULL REFERENCES identity_subjects(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_tier ON workspaces(tier);
CREATE INDEX idx_workspaces_phase ON workspaces(phase);

CREATE TABLE IF NOT EXISTS workspace_memberships (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  subject_id      UUID NOT NULL REFERENCES identity_subjects(id) ON DELETE CASCADE,
  role            TEXT NOT NULL
                    CHECK (role IN ('workspace-owner', 'workspace-member', 'workspace-viewer')),
  added_by        UUID NOT NULL REFERENCES identity_subjects(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at      TIMESTAMPTZ,
  UNIQUE(workspace_id, subject_id)
);

CREATE INDEX idx_workspace_memberships_workspace ON workspace_memberships(workspace_id);
CREATE INDEX idx_workspace_memberships_subject ON workspace_memberships(subject_id);

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Knowledge Service Tables (with pgvector)
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_collections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  dimension       INTEGER NOT NULL DEFAULT 1536,
  document_count  INTEGER NOT NULL DEFAULT 0,
  total_size_bytes BIGINT NOT NULL DEFAULT 0,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_knowledge_collections_workspace ON knowledge_collections(workspace_id);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id   UUID NOT NULL REFERENCES knowledge_collections(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  source_uri      TEXT,
  mime_type       TEXT,
  size_bytes      BIGINT NOT NULL DEFAULT 0,
  hash_sha256     TEXT NOT NULL,
  phase           TEXT NOT NULL DEFAULT 'pending'
                    CHECK (phase IN ('pending', 'chunking', 'embedding', 'ready', 'error', 'deleted')),
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_knowledge_documents_collection ON knowledge_documents(collection_id);
CREATE INDEX idx_knowledge_documents_phase ON knowledge_documents(phase);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  collection_id   UUID NOT NULL REFERENCES knowledge_collections(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  chunk_index     INTEGER NOT NULL,
  token_count     INTEGER NOT NULL DEFAULT 0,
  page_number     INTEGER,
  section_title   TEXT,
  embedding       vector(1536),   -- pgvector: adjustable dimension
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_chunks_document ON knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_chunks_collection ON knowledge_chunks(collection_id);

-- pgvector HNSW index for fast similarity search
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Full-text search using PostgreSQL tsvector
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

CREATE INDEX idx_knowledge_chunks_search ON knowledge_chunks USING GIN (search_vector);

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Agent Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  model_endpoint_id TEXT,
  system_prompt   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_agent_sessions_workspace ON agent_sessions(workspace_id);

CREATE TABLE IF NOT EXISTS agent_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content         TEXT NOT NULL,
  model_id        TEXT,
  prompt_tokens   INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  evidence_level  TEXT
                    CHECK (evidence_level IN ('knowledge-assisted', 'knowledge-verified', 'knowledge-grounded')),
  source_trace_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_session ON agent_messages(session_id);

-- ──────────────────────────────────────────────────────────────────────────
-- 5. Model Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS model_endpoints (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  endpoint_url    TEXT,
  api_key_ref     TEXT,
  capabilities    JSONB NOT NULL DEFAULT '{}'::jsonb,
  rate_limits     JSONB NOT NULL DEFAULT '{}'::jsonb,
  pricing         JSONB NOT NULL DEFAULT '{}'::jsonb,
  phase           TEXT NOT NULL DEFAULT 'active'
                    CHECK (phase IN ('registering', 'active', 'deprecated', 'disabled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_model_endpoints_provider ON model_endpoints(provider);

-- ──────────────────────────────────────────────────────────────────────────
-- 6. Audit Service Tables (SHA-256 integrity chain)
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type      TEXT NOT NULL,
  subject_id      UUID,
  resource_urn    TEXT,
  action          TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  pair_id         UUID,
  previous_hash   TEXT NOT NULL,
  hash            TEXT NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_events_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_subject ON audit_events(subject_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_events_pair ON audit_events(pair_id);

-- ──────────────────────────────────────────────────────────────────────────
-- 7. Usage Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id      UUID NOT NULL,
  workspace_id    UUID NOT NULL,
  usage_type      TEXT NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 1,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_events_subject ON usage_events(subject_id);
CREATE INDEX idx_usage_events_workspace ON usage_events(workspace_id);
CREATE INDEX idx_usage_events_type ON usage_events(usage_type);
CREATE INDEX idx_usage_events_created ON usage_events(created_at);

-- ──────────────────────────────────────────────────────────────────────────
-- 8. Automation Service Tables
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS automation_jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type        TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority        INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'dead')),
  max_retries     INTEGER NOT NULL DEFAULT 3,
  retry_count     INTEGER NOT NULL DEFAULT 0,
  leased_by       TEXT,
  leased_at       TIMESTAMPTZ,
  result          JSONB,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX idx_automation_jobs_type ON automation_jobs(job_type);
CREATE INDEX idx_automation_jobs_priority ON automation_jobs(priority DESC);

-- ──────────────────────────────────────────────────────────────────────────
-- Seed: Platform genesis audit event
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO audit_events (id, event_type, subject_id, resource_urn, action, payload, previous_hash, hash, timestamp)
VALUES (
  uuid_generate_v4(),
  'platform.genesis',
  NULL,
  'urn:mycodexvantaos:platform:genesis:00000000-0000-0000-0000-000000000001',
  'initialize',
  '{"version": "0.1.0", "description": "Platform genesis event"}'::jsonb,
  '0000000000000000000000000000000000000000000000000000000000000000',
  'GENESIS_PLACEHOLDER_SHA256',
  NOW()
);
