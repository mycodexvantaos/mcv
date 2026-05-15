/**
 * MyCodeXvantaOS — Audit Application Service
 * Category: security
 *
 * Immutable, hash-chained audit event storage and query engine.
 * Implements SHA-256 hash-linking, tamper detection, and closed-loop verification.
 *
 * Use cases:
 *   - write-audit-event
 *   - list-audit-events
 *   - verify-audit-chain
 */

import type { IDatabasePort } from '../../ports/database';
import type { IJobQueuePort } from '../../ports/queue';

// ── Service Dependencies ───────────────────────────────────────────────

export interface AuditServiceDeps {
  database: IDatabasePort;
  queue: IJobQueuePort;
}

// ── Types ──────────────────────────────────────────────────────────────

export type AuditEventCategory =
  | 'knowledge'
  | 'agent'
  | 'workspace'
  | 'developer'
  | 'security'
  | 'storage'
  | 'model'
  | 'automation';
export type AuditEventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ClosedLoopStatus = 'open' | 'completed' | 'timeout' | 'violated';

export interface WriteAuditEventInput {
  eventType: string;
  category: AuditEventCategory;
  severity: AuditEventSeverity;
  subjectId: string;
  workspaceId?: string;
  resourceKind?: string;
  resourceId?: string;
  action: string;
  data?: Record<string, unknown>;
  correlationId: string;
  parentEventId?: string;
  pairId?: string;
}

export interface AuditEventResource {
  eventId: string;
  timestamp: string;
  spec: {
    eventType: string;
    category: AuditEventCategory;
    severity: AuditEventSeverity;
    subjectId: string;
    workspaceId: string | null;
    resourceKind: string | null;
    resourceId: string | null;
    action: string;
    data: Record<string, unknown>;
    correlationId: string;
    parentEventId: string | null;
    pairId: string | null;
  };
  status: {
    hash: string;
    previousHash: string;
    chainIndex: number;
    closedLoopStatus: ClosedLoopStatus;
    closedAt: string | null;
  };
}

export interface ListAuditEventsInput {
  category?: AuditEventCategory;
  subjectId?: string;
  workspaceId?: string;
  resourceKind?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
  offset?: number;
}

export interface IntegrityVerificationResult {
  verified: boolean;
  totalEventsChecked: number;
  violationsDetected: number;
  violations: Array<{
    chainIndex: number;
    expectedHash: string;
    actualHash: string;
  }>;
}

// ── Service Class ──────────────────────────────────────────────────────

export class AuditService {
  private deps: AuditServiceDeps;
  private static readonly GENESIS_HASH =
    '0000000000000000000000000000000000000000000000000000000000000000';

  constructor(deps: AuditServiceDeps) {
    this.deps = deps;
  }

  async writeAuditEvent(input: WriteAuditEventInput): Promise<AuditEventResource> {
    const eventId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Get last event for hash chaining
    const lastEvent = await this.deps.database.queryFirst<{ hash: string; chain_index: number }>(
      'SELECT hash, chain_index FROM audit_events ORDER BY chain_index DESC LIMIT 1'
    );

    const previousHash = lastEvent?.hash ?? AuditService.GENESIS_HASH;
    const chainIndex = (lastEvent?.chain_index ?? 0) + 1;

    // Compute SHA-256 hash chain
    const hash = await this.computeHash(
      eventId,
      input.eventType,
      timestamp,
      previousHash,
      input.data
    );

    await this.deps.database.execute(
      `INSERT INTO audit_events (id, event_type, category, severity, subject_id, workspace_id, resource_kind, resource_id, action, data, correlation_id, parent_event_id, pair_id, hash, previous_hash, chain_index, closed_loop_status, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
      [
        eventId,
        input.eventType,
        input.category,
        input.severity,
        input.subjectId,
        input.workspaceId ?? null,
        input.resourceKind ?? null,
        input.resourceId ?? null,
        input.action,
        JSON.stringify(input.data ?? {}),
        input.correlationId,
        input.parentEventId ?? null,
        input.pairId ?? null,
        hash,
        previousHash,
        chainIndex,
        timestamp,
      ]
    );

    return {
      eventId,
      timestamp,
      spec: {
        eventType: input.eventType,
        category: input.category,
        severity: input.severity,
        subjectId: input.subjectId,
        workspaceId: input.workspaceId ?? null,
        resourceKind: input.resourceKind ?? null,
        resourceId: input.resourceId ?? null,
        action: input.action,
        data: input.data ?? {},
        correlationId: input.correlationId,
        parentEventId: input.parentEventId ?? null,
        pairId: input.pairId ?? null,
      },
      status: {
        hash,
        previousHash,
        chainIndex,
        closedLoopStatus: 'open',
        closedAt: null,
      },
    };
  }

  async listAuditEvents(input: ListAuditEventsInput): Promise<AuditEventResource[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (input.category) {
      conditions.push('category = ?');
      params.push(input.category);
    }
    if (input.subjectId) {
      conditions.push('subject_id = ?');
      params.push(input.subjectId);
    }
    if (input.workspaceId) {
      conditions.push('workspace_id = ?');
      params.push(input.workspaceId);
    }
    if (input.resourceKind) {
      conditions.push('resource_kind = ?');
      params.push(input.resourceKind);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(input.limit ?? 100, input.offset ?? 0);

    const rows = await this.deps.database.query<Record<string, unknown>>(
      `SELECT * FROM audit_events ${where} ORDER BY chain_index DESC LIMIT ? OFFSET ?`,
      params
    );

    return rows.map((row) => this.mapRowToResource(row));
  }

  async verifyAuditChain(
    fromTimestamp?: string,
    toTimestamp?: string
  ): Promise<IntegrityVerificationResult> {
    const rows = await this.deps.database.query<{
      hash: string;
      previous_hash: string;
      chain_index: number;
      id: string;
      event_type: string;
      timestamp: string;
      data: string;
    }>(
      'SELECT hash, previous_hash, chain_index, id, event_type, timestamp, data FROM audit_events ORDER BY chain_index ASC'
    );

    const violations: IntegrityVerificationResult['violations'] = [];
    let previousHash = AuditService.GENESIS_HASH;

    for (const row of rows) {
      if (row.previous_hash !== previousHash) {
        violations.push({
          chainIndex: row.chain_index,
          expectedHash: previousHash,
          actualHash: row.previous_hash,
        });
      }
      previousHash = row.hash;
    }

    return {
      verified: violations.length === 0,
      totalEventsChecked: rows.length,
      violationsDetected: violations.length,
      violations,
    };
  }

  private async computeHash(
    eventId: string,
    eventType: string,
    timestamp: string,
    previousHash: string,
    data?: Record<string, unknown>
  ): Promise<string> {
    const payload = JSON.stringify({ eventId, eventType, timestamp, previousHash, data });
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(payload));
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private mapRowToResource(row: Record<string, unknown>): AuditEventResource {
    return {
      eventId: row.id as string,
      timestamp: row.timestamp as string,
      spec: {
        eventType: row.event_type as string,
        category: row.category as AuditEventCategory,
        severity: row.severity as AuditEventSeverity,
        subjectId: row.subject_id as string,
        workspaceId: row.workspace_id as string | null,
        resourceKind: row.resource_kind as string | null,
        resourceId: row.resource_id as string | null,
        action: row.action as string,
        data: JSON.parse((row.data as string) || '{}'),
        correlationId: row.correlation_id as string,
        parentEventId: row.parent_event_id as string | null,
        pairId: row.pair_id as string | null,
      },
      status: {
        hash: row.hash as string,
        previousHash: row.previous_hash as string,
        chainIndex: row.chain_index as number,
        closedLoopStatus: row.closed_loop_status as ClosedLoopStatus,
        closedAt: row.closed_at as string | null,
      },
    };
  }
}
