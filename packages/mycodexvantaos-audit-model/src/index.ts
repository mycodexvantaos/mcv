/**
 * @mycodexvantaos/mycodexvantaos-audit-model
 * Audit model - audit events, actor, resource reference, trace context, integrity metadata
 */

// Re-export from core constitution
export * from "@mycodexvantaos/core/audit-model";

// Extended types for standalone package
export interface AuditActor {
  subjectId: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditResource {
  kind: string;
  id: string;
  urn: string;
}

export interface AuditContext {
  correlationId: string;
  parentEventId?: string;
  traceId?: string;
}

export interface AuditIntegrity {
  hash: string;
  previousHash?: string;
  chainIndex: number;
}
