/**
 * MyCodeXvantaOS — Audit Event Model
 * The "cannot lie" layer — tamper-evident SHA-256 integrity chain.
 * Every significant action produces an audit event.
 */

import type { ServiceCategory } from '../service-catalog/service-definition';

/** Event categories aligned with service categories */
export type AuditEventCategory =
  | 'knowledge'
  | 'agent'
  | 'workspace'
  | 'developer'
  | 'security'
  | 'storage'
  | 'model'
  | 'automation';

/** Event severity levels */
export type EventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** Closed-loop status for request→completion/failure pairing */
export type ClosedLoopStatus = 'open' | 'completed' | 'timeout' | 'violated';

/** Audit actor — who or what performed the action */
export interface AuditActor {
  type: 'user' | 'agent' | 'system' | 'cron';
  id: string;
  name?: string;
  role?: string;
}

/** Audited resource reference */
export interface AuditResourceRef {
  type: string;
  id: string;
  name?: string;
}

/** Audit context — workspace, tenant, session */
export interface AuditContext {
  tenantId: string;
  workspaceId: string | null;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
}

/** The core audit event */
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
  /** SHA-256 integrity chain */
  hash: string;
  previousHash: string;
  chainIndex: number;
  /** Closed-loop pairing: request ↔ completion/failure */
  pairId: string | null;
  closedLoopStatus: ClosedLoopStatus;
  closedAt: string | null;
}

/** Integrity verification report */
export interface IntegrityReport {
  fromTimestamp: string;
  toTimestamp: string;
  totalEvents: number;
  chainBreaks: number;
  gaps: Array<{
    afterEventId: string;
    expectedChainIndex: number;
  }>;
  tamperedEvents: Array<{
    eventId: string;
    expectedHash: string;
    actualHash: string;
  }>;
  openLoops: Array<{
    pairId: string;
    eventType: string;
    age: string;
  }>;
  passed: boolean;
  verifiedAt: string;
}

/** Standard audit event types per category */
export const STANDARD_AUDIT_EVENTS: Record<string, string[]> = {
  knowledge: [
    'knowledge.document.uploaded',
    'knowledge.document.parsed',
    'knowledge.document.indexed',
    'knowledge.search.requested',
    'knowledge.search.completed',
    'knowledge.search.failed',
  ],
  agent: [
    'agent.session.created',
    'agent.answer.created',
    'agent.answer.cited',
    'agent.answer.unverified',
  ],
  workspace: [
    'workspace.created',
    'workspace.updated',
    'workspace.member.added',
    'workspace.member.removed',
  ],
  security: [
    'identity.user.registered',
    'identity.session.created',
    'identity.session.revoked',
    'policy.denied',
    'policy.evaluated',
  ],
  model: [
    'model.endpoint.registered',
    'model.invocation.started',
    'model.invocation.completed',
    'model.invocation.failed',
  ],
  audit: [
    'governance.audit.event-ingested',
    'governance.audit.integrity-violation',
    'governance.audit.closed-loop-timeout',
  ],
  usage: ['governance.usage.quota-warning', 'governance.usage.rate-limit-exceeded'],
};
