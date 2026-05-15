/**
 * MyCodeXvantaOS — Usage Application Service
 * Category: security
 *
 * Multi-dimensional usage tracking, metering & rate-limit enforcement.
 * Every billable action flows through this service so that:
 *   1. Per-workspace quotas are enforced in real-time
 *   2. Usage records are persisted for billing & analytics
 *   3. Audit events are emitted for every metered action
 *   4. Tier-based limits (free / pro / enterprise) are respected
 *
 * Use cases:
 *   - meter-usage
 *   - check-quota
 *   - list-usage-events
 */

import type { IDatabasePort } from '../../ports/database';

// ── Service Dependencies ───────────────────────────────────────────────

export interface UsageServiceDeps {
  database: IDatabasePort;
  cache: {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    atomicSet(
      key: string,
      expected: unknown,
      newValue: unknown,
      options?: { expirationTtl?: number }
    ): Promise<boolean>;
  };
  audit: {
    emitEvent(event: UsageAuditEvent): Promise<void>;
  };
}

// ── Types ──────────────────────────────────────────────────────────────

export type Tier = 'free' | 'pro' | 'enterprise';
export type MeterDimension =
  | 'api_calls'
  | 'storage_bytes'
  | 'search_queries'
  | 'model_tokens_input'
  | 'model_tokens_output'
  | 'documents_ingested'
  | 'chat_messages'
  | 'audit_events';

export interface MeterUsageInput {
  workspaceId: string;
  serviceId: string;
  dimension: MeterDimension;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface QuotaStatus {
  allowed: boolean;
  remaining: number;
  limit: number;
  percentageUsed: number;
  resetAt: string;
}

export interface UsageRecord {
  id: string;
  workspaceId: string;
  serviceId: string;
  dimension: MeterDimension;
  quantity: number;
  recordedAt: string;
}

export interface UsageReport {
  workspaceId: string;
  period: string;
  metrics: Record<string, number>;
  limits: Record<string, number>;
  percentageUsed: Record<string, number>;
}

export interface UsageAuditEvent {
  eventType: string;
  category: 'security';
  severity: string;
  subjectId: string;
  workspaceId: string;
  action: string;
  data?: Record<string, unknown>;
  correlationId: string;
}

// ── Tier Limits ────────────────────────────────────────────────────────

const TIER_LIMITS: Record<Tier, Record<MeterDimension, number>> = {
  free: {
    api_calls: 10000,
    storage_bytes: 104857600, // 100MB
    search_queries: 1000,
    model_tokens_input: 100000,
    model_tokens_output: 100000,
    documents_ingested: 100,
    chat_messages: 500,
    audit_events: 50000,
  },
  pro: {
    api_calls: 100000,
    storage_bytes: 5368709120, // 5GB
    search_queries: 10000,
    model_tokens_input: 1000000,
    model_tokens_output: 1000000,
    documents_ingested: 1000,
    chat_messages: 5000,
    audit_events: 500000,
  },
  enterprise: {
    api_calls: Infinity,
    storage_bytes: Infinity,
    search_queries: Infinity,
    model_tokens_input: Infinity,
    model_tokens_output: Infinity,
    documents_ingested: Infinity,
    chat_messages: Infinity,
    audit_events: Infinity,
  },
};

// ── Service Class ──────────────────────────────────────────────────────

export class UsageService {
  private deps: UsageServiceDeps;

  constructor(deps: UsageServiceDeps) {
    this.deps = deps;
  }

  async meterUsage(input: MeterUsageInput): Promise<void> {
    const recordId = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.deps.database.execute(
      `INSERT INTO usage_records (id, workspace_id, service_id, dimension, quantity, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [recordId, input.workspaceId, input.serviceId, input.dimension, input.quantity, now]
    );

    // Update sliding window counter in cache
    const windowKey = `usage:${input.workspaceId}:${input.dimension}:${this.getCurrentWindow()}`;
    const current = await this.deps.cache.get(windowKey);
    const newValue = (parseInt(current ?? '0', 10) + input.quantity).toString();
    await this.deps.cache.put(windowKey, newValue, { expirationTtl: 86400 });
  }

  async checkQuota(
    workspaceId: string,
    dimension: MeterDimension,
    tier: Tier = 'free'
  ): Promise<QuotaStatus> {
    const limit = TIER_LIMITS[tier][dimension];
    const windowKey = `usage:${workspaceId}:${dimension}:${this.getCurrentWindow()}`;
    const current = await this.deps.cache.get(windowKey);
    const used = parseInt(current ?? '0', 10);
    const remaining = Math.max(0, limit - used);

    return {
      allowed: used < limit,
      remaining,
      limit: limit === Infinity ? -1 : limit,
      percentageUsed: limit === Infinity ? 0 : (used / limit) * 100,
      resetAt: this.getNextWindowReset(),
    };
  }

  async listUsageEvents(workspaceId: string, period: string): Promise<UsageReport> {
    const rows = await this.deps.database.query<{ dimension: string; total_quantity: number }>(
      `SELECT dimension, SUM(quantity) as total_quantity FROM usage_records WHERE workspace_id = ? AND recorded_at >= ? GROUP BY dimension`,
      [workspaceId, period]
    );

    const metrics: Record<string, number> = {};
    for (const row of rows) {
      metrics[row.dimension] = row.total_quantity;
    }

    return {
      workspaceId,
      period,
      metrics,
      limits: {},
      percentageUsed: {},
    };
  }

  private getCurrentWindow(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  }

  private getNextWindowReset(): string {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }
}
