-- MyCodeXvantaOS D1 Migration: 0005-audit-log
-- Compatible: Cloudflare D1 (SQLite-based)

-- Audit Log Tables (extended from 001_initial_schema)
-- audit_events already created in 001, this adds indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_correlation ON audit_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_events(severity);

