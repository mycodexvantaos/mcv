-- MyCodeXvantaOS D1 Migration: 0008-memory-model
-- Compatible: Cloudflare D1 (SQLite-based)

-- Memory Model Tables
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

