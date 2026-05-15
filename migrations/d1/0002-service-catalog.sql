-- MyCodeXvantaOS D1 Migration: 0002-service-catalog
-- Compatible: Cloudflare D1 (SQLite-based)

-- Service Catalog Tables
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

