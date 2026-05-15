-- MyCodeXvantaOS D1 Migration: 0006-usage-meter
-- Compatible: Cloudflare D1 (SQLite-based)

-- Usage Meter Tables (extended from 001_initial_schema)
-- usage_records already created in 001, this adds indexes
CREATE INDEX IF NOT EXISTS idx_usage_records_subject ON usage_records(subject_id);

