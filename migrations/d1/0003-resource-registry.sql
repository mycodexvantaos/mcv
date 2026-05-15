-- MyCodeXvantaOS D1 Migration: 0003-resource-registry
-- Compatible: Cloudflare D1 (SQLite-based)

-- Resource Registry Tables
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

