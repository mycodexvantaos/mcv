/**
 * MyCodexVantaOS Audit Logger
 * Provides comprehensive audit logging for compliance and security
 */

export interface AuditEvent {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  timestamp: number;
  metadata: Record<string, any>;
}

export class AuditLogger {
  private events: AuditEvent[] = [];

  async log(event: AuditEvent): Promise<void> {
    const fullEvent: AuditEvent = {
      ...event,
      id: `audit_${Date.now()}_${Math.random()}`,
      timestamp: event.timestamp || Date.now(),
    };

    this.events.push(fullEvent);
    console.log(`[AUDIT] ${event.action} on ${event.resource} by ${event.userId}`);
  }

  async query(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startTime?: number;
    endTime?: number;
  }): Promise<AuditEvent[]> {
    let results = [...this.events];

    if (filters.userId) {
      results = results.filter((e) => e.userId === filters.userId);
    }
    if (filters.action) {
      results = results.filter((e) => e.action === filters.action);
    }
    if (filters.resource) {
      results = results.filter((e) => e.resource === filters.resource);
    }
    if (filters.startTime) {
      results = results.filter((e) => e.timestamp >= filters.startTime!);
    }
    if (filters.endTime) {
      results = results.filter((e) => e.timestamp <= filters.endTime!);
    }

    return results;
  }

  async export(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(this.events, null, 2);
    }

    // CSV format
    const headers = 'id,userId,action,resource,result,timestamp,metadata';
    const rows = this.events.map(
      (e) =>
        `${e.id},${e.userId || ''},${e.action},${e.resource},${e.result},${e.timestamp},"${JSON.stringify(e.metadata)}"`
    );
    return [headers, ...rows].join('\n');
  }
}

export default AuditLogger;
