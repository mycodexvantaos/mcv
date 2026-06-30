/**
 * Audit Log Service — Application Layer
 *
 * Immutable, hash-chained audit event storage and query engine.
 * Implements SHA-256 hash-linking, tamper detection, and closed-loop verification.
 */

import type { IDatabasePort, IQueuePort } from "../ports/index";
import type { AuditEventSpec, AuditEventStatus, EventCategory, EventSeverity } from "../core/index";

export interface AuditLogServiceDeps {
  database: IDatabasePort;
  queue: IQueuePort;
}

export class AuditLogService {
  private deps: AuditLogServiceDeps;

  constructor(deps: AuditLogServiceDeps) {
    this.deps = deps;
  }

  async ingestEvent(event: {
    eventType: string;
    category: string;
    severity: string;
    subjectId: string;
    workspaceId?: string;
    resourceKind?: string;
    resourceId?: string;
    action: string;
    data?: Record<string, unknown>;
    correlationId: string;
    parentEventId?: string;
  }): Promise<{ eventId: string; hash: string; chainIndex: number }> {
    const eventId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Get the last event in the chain for hash linking
    const lastEvent = await this.deps.database.queryFirst<{ hash: string; chain_index: number }>(
      "SELECT hash, chain_index FROM audit_events ORDER BY chain_index DESC LIMIT 1"
    );

    const previousHash =
      lastEvent?.hash ?? "0000000000000000000000000000000000000000000000000000000000000000";
    const chainIndex = (lastEvent?.chain_index ?? 0) + 1;

    // Compute SHA-256 hash chain
    const hash = await this.computeHash(
      eventId,
      event.eventType,
      timestamp,
      previousHash,
      event.data
    );

    // Store the event
    await this.deps.database.execute(
      `INSERT INTO audit_events (
        id, event_type, category, severity, timestamp, subject_id, workspace_id,
        resource_kind, resource_id, action, data, correlation_id, parent_event_id,
        hash, previous_hash, chain_index, closed_loop_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
      [
        eventId,
        event.eventType,
        event.category,
        event.severity,
        timestamp,
        event.subjectId,
        event.workspaceId ?? null,
        event.resourceKind ?? null,
        event.resourceId ?? null,
        event.action,
        JSON.stringify(event.data ?? {}),
        event.correlationId,
        event.parentEventId ?? null,
        hash,
        previousHash,
        chainIndex,
        timestamp,
      ]
    );

    // Check for closed-loop completion
    await this.checkClosedLoopCompletion(event.eventType, event.correlationId);

    return { eventId, hash, chainIndex };
  }

  async ingestBatch(
    events: Array<Parameters<typeof this.ingestEvent>[0]>
  ): Promise<Array<{ eventId: string; hash: string; chainIndex: number }>> {
    const results = [];
    for (const event of events) {
      results.push(await this.ingestEvent(event));
    }
    return results;
  }

  async queryEvents(filter: {
    eventType?: string;
    category?: string;
    severity?: string;
    subjectId?: string;
    workspaceId?: string;
    fromTimestamp?: string;
    toTimestamp?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.eventType) {
      conditions.push("event_type = ?");
      params.push(filter.eventType);
    }
    if (filter.category) {
      conditions.push("category = ?");
      params.push(filter.category);
    }
    if (filter.severity) {
      conditions.push("severity = ?");
      params.push(filter.severity);
    }
    if (filter.subjectId) {
      conditions.push("subject_id = ?");
      params.push(filter.subjectId);
    }
    if (filter.workspaceId) {
      conditions.push("workspace_id = ?");
      params.push(filter.workspaceId);
    }
    if (filter.fromTimestamp) {
      conditions.push("timestamp >= ?");
      params.push(filter.fromTimestamp);
    }
    if (filter.toTimestamp) {
      conditions.push("timestamp <= ?");
      params.push(filter.toTimestamp);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filter.limit ?? 100;
    const offset = filter.offset ?? 0;

    return this.deps.database.query(
      `SELECT * FROM audit_events ${where} ORDER BY chain_index DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
  }

  async verifyIntegrity(
    fromTimestamp: string,
    toTimestamp: string
  ): Promise<{
    verified: boolean;
    violationsDetected: number;
    violations: Array<{ chainIndex: number; expectedHash: string; actualHash: string }>;
    checkedRange: { from: number; to: number };
  }> {
    const events = await this.deps.database.query<{
      id: string;
      event_type: string;
      timestamp: string;
      hash: string;
      previous_hash: string;
      chain_index: number;
      data: string;
    }>(
      `SELECT id, event_type, timestamp, hash, previous_hash, chain_index, data
       FROM audit_events
       WHERE timestamp >= ? AND timestamp <= ?
       ORDER BY chain_index ASC`,
      [fromTimestamp, toTimestamp]
    );

    const violations: Array<{ chainIndex: number; expectedHash: string; actualHash: string }> = [];

    for (let i = 1; i < events.length; i++) {
      const currentEvent = events[i];
      const previousEvent = events[i - 1];

      // Verify the previousHash matches the actual previous hash
      if (currentEvent.previous_hash !== previousEvent.hash) {
        violations.push({
          chainIndex: currentEvent.chain_index,
          expectedHash: previousEvent.hash,
          actualHash: currentEvent.previous_hash,
        });
        continue;
      }

      // Verify the hash computation
      const expectedHash = await this.computeHash(
        currentEvent.id,
        currentEvent.event_type,
        currentEvent.timestamp,
        currentEvent.previous_hash,
        JSON.parse(currentEvent.data)
      );

      if (currentEvent.hash !== expectedHash) {
        violations.push({
          chainIndex: currentEvent.chain_index,
          expectedHash,
          actualHash: currentEvent.hash,
        });
      }
    }

    if (violations.length > 0) {
      await this.deps.database.execute(
        `INSERT INTO integrity_violations (detected_at, violation_count, details)
         VALUES (?, ?, ?)`,
        [new Date().toISOString(), violations.length, JSON.stringify(violations)]
      );
    }

    return {
      verified: violations.length === 0,
      violationsDetected: violations.length,
      violations,
      checkedRange: {
        from: events[0]?.chain_index ?? 0,
        to: events[events.length - 1]?.chain_index ?? 0,
      },
    };
  }

  private async computeHash(
    eventId: string,
    eventType: string,
    timestamp: string,
    previousHash: string,
    data: Record<string, unknown> | undefined
  ): Promise<string> {
    const canonicalData = data ? this.canonicalJson(data) : "{}";
    const input = `${eventId}|${eventType}|${timestamp}|${previousHash}|${await this.hashString(canonicalData)}`;
    return this.hashString(input);
  }

  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private canonicalJson(data: Record<string, unknown>): string {
    // Canonical JSON: sorted keys, no whitespace
    const sortKeys = (obj: unknown): unknown => {
      if (obj === null || typeof obj !== "object") return obj;
      if (Array.isArray(obj)) return obj.map(sortKeys);
      return Object.keys(obj as Record<string, unknown>)
        .sort()
        .reduce((acc: Record<string, unknown>, key: string) => {
          acc[key] = sortKeys((obj as Record<string, unknown>)[key]);
          return acc;
        }, {});
    };
    return JSON.stringify(sortKeys(data));
  }

  private async checkClosedLoopCompletion(eventType: string, correlationId: string): Promise<void> {
    // Check if this event completes an open closed-loop pair
    // The closed-loop pairs are defined in audit-events.yaml
    const completionPairs: Record<string, string> = {
      "identity.session.created": "identity.subject.authenticated",
      "knowledge.document.ingestion.completed": "knowledge.document.uploaded",
      "knowledge.document.ingestion.failed": "knowledge.document.uploaded",
      "model.invocation.completed": "model.invocation.started",
      "model.invocation.failed": "model.invocation.started",
      "ai.chat.response.generated": "ai.chat.message.sent",
    };

    const requestEvent = completionPairs[eventType];
    if (requestEvent) {
      // Mark the request event as completed
      await this.deps.database.execute(
        `UPDATE audit_events SET closed_loop_status = 'completed', closed_at = ?
         WHERE correlation_id = ? AND event_type = ? AND closed_loop_status = 'open'`,
        [new Date().toISOString(), correlationId, requestEvent]
      );
    }
  }
}
