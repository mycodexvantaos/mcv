/**
 * @mycodexvantaos/service-audit-log
 * Audit Log Runtime — records and queries audit events with SHA-256 integrity chain.
 *
 * MVP: In-memory storage with hash-chained events.
 * Production: Will use D1/SQLite for persistence.
 *
 * Data source: contracts/events/audit-events.yaml (via contracts-sdk)
 * Core types: packages/core/audit-model/audit-event.ts
 */

import { createHash } from 'node:crypto';
import {
  loadEventDefinitions,
} from '@mycodexvantaos/contracts-sdk';

// ─── Types (aligned with core/audit-model) ────────────────────────────────────

export type AuditEventCategory =
  | 'knowledge'
  | 'agent'
  | 'workspace'
  | 'developer'
  | 'security'
  | 'storage'
  | 'model'
  | 'automation'
  | 'audit';

export type EventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ClosedLoopStatus = 'open' | 'completed' | 'timeout' | 'violated';

export interface AuditActor {
  type: 'user' | 'agent' | 'system' | 'cron';
  id: string;
  name?: string;
  role?: string;
}

export interface AuditResourceRef {
  type: string;
  id: string;
  name?: string;
}

export interface AuditContext {
  tenantId: string;
  workspaceId: string | null;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
}

export interface AuditEvent {
  eventId: string;
  eventType: string;
  category: AuditEventCategory;
  severity: EventSeverity;
  actor: AuditActor;
  resource: AuditResourceRef;
  context: AuditContext;
  data: Record<string, unknown>;
  timestamp: string;
  hash: string;
  previousHash: string;
  chainIndex: number;
  pairId: string | null;
  closedLoopStatus: ClosedLoopStatus;
  closedAt: string | null;
}

// ─── Request/Response Types ───────────────────────────────────────────────────

export interface CreateAuditEventRequest {
  eventType: string;
  category: AuditEventCategory;
  severity?: EventSeverity;
  actor: AuditActor;
  resource: AuditResourceRef;
  context: AuditContext;
  data?: Record<string, unknown>;
  pairId?: string;
}

export interface CreateAuditEventResponse {
  event: AuditEvent;
}

export interface QueryAuditEventsRequest {
  eventType?: string;
  category?: AuditEventCategory;
  resourceType?: string;
  resourceId?: string;
  actorId?: string;
  tenantId?: string;
  workspaceId?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
  offset?: number;
}

export interface QueryAuditEventsResponse {
  events: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Internal State ───────────────────────────────────────────────────────────

const events: AuditEvent[] = [];
let chainIndex = 0;
let lastHash = '0000000000000000000000000000000000000000000000000000000000000000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `evt_${timestamp}_${random}`;
}

function computeHash(event: Omit<AuditEvent, 'hash'>): string {
  const payload = JSON.stringify({
    eventId: event.eventId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    previousHash: event.previousHash,
    chainIndex: event.chainIndex,
    actor: event.actor,
    resource: event.resource,
  });
  return createHash('sha256').update(payload).digest('hex');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record a new audit event with SHA-256 integrity chain
 */
export function recordEvent(req: CreateAuditEventRequest): CreateAuditEventResponse {
  const now = new Date().toISOString();
  const eventId = generateEventId();
  const idx = chainIndex++;

  const eventWithoutHash: Omit<AuditEvent, 'hash'> = {
    eventId,
    eventType: req.eventType,
    category: req.category,
    severity: req.severity ?? 'info',
    actor: req.actor,
    resource: req.resource,
    context: req.context,
    data: req.data ?? {},
    timestamp: now,
    previousHash: lastHash,
    chainIndex: idx,
    pairId: req.pairId ?? null,
    closedLoopStatus: 'open',
    closedAt: null,
  };

  const hash = computeHash(eventWithoutHash);
  const event: AuditEvent = { ...eventWithoutHash, hash };

  events.push(event);
  lastHash = hash;

  return { event };
}

/**
 * Query audit events with filters and pagination
 */
export function queryEvents(req: QueryAuditEventsRequest = {}): QueryAuditEventsResponse {
  let filtered = [...events];

  if (req.eventType) {
    filtered = filtered.filter((e) => e.eventType === req.eventType);
  }
  if (req.category) {
    filtered = filtered.filter((e) => e.category === req.category);
  }
  if (req.resourceType) {
    filtered = filtered.filter((e) => e.resource.type === req.resourceType);
  }
  if (req.resourceId) {
    filtered = filtered.filter((e) => e.resource.id === req.resourceId);
  }
  if (req.actorId) {
    filtered = filtered.filter((e) => e.actor.id === req.actorId);
  }
  if (req.tenantId) {
    filtered = filtered.filter((e) => e.context.tenantId === req.tenantId);
  }
  if (req.workspaceId) {
    filtered = filtered.filter((e) => e.context.workspaceId === req.workspaceId);
  }
  if (req.fromTimestamp) {
    filtered = filtered.filter((e) => e.timestamp >= req.fromTimestamp!);
  }
  if (req.toTimestamp) {
    filtered = filtered.filter((e) => e.timestamp <= req.toTimestamp!);
  }

  // Sort by timestamp descending (newest first)
  filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const total = filtered.length;
  const offset = req.offset ?? 0;
  const limit = req.limit ?? 50;
  const paged = filtered.slice(offset, offset + limit);

  return {
    events: paged,
    total,
    limit,
    offset,
  };
}

/**
 * Get a single audit event by ID
 */
export function getEvent(eventId: string): AuditEvent | null {
  return events.find((e) => e.eventId === eventId) ?? null;
}

/**
 * Verify the integrity chain of all recorded events
 */
export function verifyIntegrity(): { valid: boolean; chainBreaks: number; totalEvents: number } {
  if (events.length === 0) {
    return { valid: true, chainBreaks: 0, totalEvents: 0 };
  }

  let chainBreaks = 0;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    // Verify chain index
    if (event.chainIndex !== i) {
      chainBreaks++;
      continue;
    }

    // Verify previous hash linkage
    if (i === 0) {
      if (event.previousHash !== '0000000000000000000000000000000000000000000000000000000000000000') {
        chainBreaks++;
      }
    } else {
      if (event.previousHash !== events[i - 1].hash) {
        chainBreaks++;
      }
    }

    // Verify hash correctness
    const { hash: _, ...eventWithoutHash } = event;
    const expectedHash = computeHash(eventWithoutHash);
    if (event.hash !== expectedHash) {
      chainBreaks++;
    }
  }

  return {
    valid: chainBreaks === 0,
    chainBreaks,
    totalEvents: events.length,
  };
}

/**
 * Clear all events — useful for testing
 */
export function clearEvents(): void {
  events.length = 0;
  chainIndex = 0;
  lastHash = '0000000000000000000000000000000000000000000000000000000000000000';
}

/**
 * Get the loaded audit event definitions from contracts
 */
export function getAuditEventDefinitions(): string[] {
  const eventDefs = loadEventDefinitions();
  const auditDef = eventDefs.find((e) => e.metadata.name === 'audit');
  if (auditDef?.spec?.events && Array.isArray(auditDef.spec.events)) {
    return auditDef.spec.events as string[];
  }
  return [];
}
