-- MyCodeXvantaOS D1 Migration: 0004-policy-model
-- Compatible: Cloudflare D1 (SQLite-based)

-- Policy Model Tables
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

