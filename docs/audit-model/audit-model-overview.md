# Audit Model Overview

## Purpose

The Audit Model provides a comprehensive, immutable audit trail for all platform
operations. Every significant action is recorded with:

- Who performed the action (subject)
- What was acted upon (resource)
- What changed (before/after diff)
- When it happened (timestamp)
- Why it was allowed (policy reference)

## Architecture

- **Package**: `@mycodexvantaos/audit-model`
- **Core Types**: Re-exported from `@mycodexvantaos/core`
- **Contract**: `contracts/events/audit-events.yaml`
- **Schema**: `contracts/schemas/audit-event.schema.json`

## Event Categories

1. **Access Events**: Login, logout, token refresh
2. **Mutation Events**: Create, update, delete operations
3. **Policy Events**: Policy evaluations, decisions, violations
4. **System Events**: Service startup, health checks, errors
5. **Cross-Plane Events**: Job dispatch, completion, failure

## Query Interface

The audit log supports:
- Time-range queries with pagination
- Subject-based filtering (all actions by a user)
- Resource-based filtering (all changes to a document)
- Event-type filtering (all policy violations)
- Aggregation for dashboards (action counts by type)

## Retention and Compliance

- Audit events are append-only (no updates or deletes)
- Retention policies are configurable per workspace
- Export formats: JSON, CSV, Parquet
- Compliance templates: SOC2, GDPR, HIPAA
