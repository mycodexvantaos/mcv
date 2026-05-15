-- MyCodeXvantaOS D1 Migration: 0009-memory-dream
-- Compatible: Cloudflare D1 (SQLite-based)

-- Memory Dream Tables
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

