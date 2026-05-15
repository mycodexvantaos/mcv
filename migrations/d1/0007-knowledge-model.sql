-- MyCodeXvantaOS D1 Migration: 0007-knowledge-model
-- Compatible: Cloudflare D1 (SQLite-based)

-- Knowledge Model Tables (extended from 001_initial_schema)
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

