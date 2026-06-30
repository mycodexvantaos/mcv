/**
 * UsageMeterService — Multi-dimensional usage tracking, metering & rate-limit enforcement
 *
 * Implements the IUsagePort interface defined in ports/index.ts. Every billable action
 * on the platform flows through this service so that:
 *   1. Per-workspace quotas are enforced in real-time (rate-limiting)
 *   2. Usage records are persisted for billing & analytics
 *   3. Audit events are emitted for every metered action
 *   4. Tier-based limits (free / pro / enterprise) are respected
 *
 * Dependencies (injected via constructor):
 *   - IDatabasePort  → persist usage records, query aggregates
 *   - ICachePort     → sliding-window rate limit counters
 *   - IAuditPort     → emit usage-metered & rate-limit-exceeded events
 *   - IQueuePort     → async batch aggregation jobs
 */

import type {
  IDatabasePort,
  ICachePort,
  IAuditPort,
  IQueuePort,
  AuditEventInput,
  DatabaseStatement,
} from "../ports/index.js";

import type { UsageRecordSpec, Tier, Resource, AuditEventSpec } from "../core/index.js";

/* ──────────────────────────── Types ──────────────────────────── */

/** Dimension of metering — each maps to a separate counter & quota */
export type MeterDimension =
  | "api_calls"
  | "storage_bytes"
  | "search_queries"
  | "model_tokens_input"
  | "model_tokens_output"
  | "documents_ingested"
  | "chat_messages"
  | "audit_events";

/** A single usage record row */
export interface UsageRecord {
  id: string;
  workspace_id: string;
  subject_id: string;
  dimension: MeterDimension;
  quantity: number;
  unit: string;
  resource_urn: string;
  recorded_at: string; // ISO-8601
  billing_period: string; // YYYY-MM
  metadata?: Record<string, unknown>;
}

/** Rate-limit check result */
export interface RateLimitResult {
  allowed: boolean;
  dimension: MeterDimension;
  current: number;
  limit: number;
  remaining: number;
  reset_at: string; // ISO-8601 — when the window resets
  retry_after_ms?: number; // non-zero when allowed=false
}

/** Aggregated usage for a workspace in a billing period */
export interface UsageAggregate {
  workspace_id: string;
  billing_period: string;
  dimensions: Record<
    MeterDimension,
    {
      consumed: number;
      limit: number;
      unit: string;
      utilization_pct: number;
    }
  >;
  overage: MeterDimension[];
}

/** Tier-specific rate-limit configuration */
export interface TierLimits {
  tier: Tier;
  limits: Record<
    MeterDimension,
    {
      monthly: number;
      per_minute: number;
      burst?: number; // short burst allowance
    }
  >;
}

/** Constructor dependencies */
export interface UsageMeterServiceDeps {
  database: IDatabasePort;
  cache: ICachePort;
  audit: IAuditPort;
  queue: IQueuePort;
}

/* ──────────────── Tier Limits Configuration ─────────────────── */

const TIER_LIMITS: TierLimits[] = [
  {
    tier: "free",
    limits: {
      api_calls: { monthly: 10_000, per_minute: 30, burst: 50 },
      storage_bytes: { monthly: 1_073_741_824, per_minute: 10_485_760 }, // 1 GB / 10 MB min-1
      search_queries: { monthly: 5_000, per_minute: 15, burst: 25 },
      model_tokens_input: { monthly: 500_000, per_minute: 2_000 },
      model_tokens_output: { monthly: 200_000, per_minute: 1_000 },
      documents_ingested: { monthly: 100, per_minute: 5 },
      chat_messages: { monthly: 1_000, per_minute: 10 },
      audit_events: { monthly: 50_000, per_minute: 100 },
    },
  },
  {
    tier: "pro",
    limits: {
      api_calls: { monthly: 100_000, per_minute: 120, burst: 200 },
      storage_bytes: { monthly: 10_737_418_240, per_minute: 52_428_800 }, // 10 GB / 50 MB min-1
      search_queries: { monthly: 50_000, per_minute: 60, burst: 100 },
      model_tokens_input: { monthly: 5_000_000, per_minute: 10_000 },
      model_tokens_output: { monthly: 2_000_000, per_minute: 5_000 },
      documents_ingested: { monthly: 1_000, per_minute: 20 },
      chat_messages: { monthly: 10_000, per_minute: 30 },
      audit_events: { monthly: 500_000, per_minute: 500 },
    },
  },
  {
    tier: "enterprise",
    limits: {
      api_calls: { monthly: 1_000_000, per_minute: 600, burst: 1_000 },
      storage_bytes: { monthly: 107_374_182_400, per_minute: 262_144_000 }, // 100 GB / 250 MB min-1
      search_queries: { monthly: 500_000, per_minute: 300, burst: 500 },
      model_tokens_input: { monthly: 50_000_000, per_minute: 100_000 },
      model_tokens_output: { monthly: 20_000_000, per_minute: 50_000 },
      documents_ingested: { monthly: 10_000, per_minute: 100 },
      chat_messages: { monthly: 100_000, per_minute: 120 },
      audit_events: { monthly: 5_000_000, per_minute: 2_000 },
    },
  },
];

/* ──────────────────────── Service Class ─────────────────────── */

export class UsageMeterService {
  private readonly db: IDatabasePort;
  private readonly cache: ICachePort;
  private readonly audit: IAuditPort;
  private readonly queue: IQueuePort;

  constructor(private readonly deps: UsageMeterServiceDeps) {
    this.db = deps.database;
    this.cache = deps.cache;
    this.audit = deps.audit;
    this.queue = deps.queue;
  }

  /* ─────────── Public API ─────────── */

  /**
   * Record a usage event. This is the primary entry point called by all
   * other services after performing a billable action.
   *
   * Flow: check rate-limit → if allowed, increment counters → persist record → emit audit
   */
  async record(input: {
    workspace_id: string;
    subject_id: string;
    dimension: MeterDimension;
    quantity: number;
    unit: string;
    resource_urn: string;
    tier: Tier;
    metadata?: Record<string, unknown>;
  }): Promise<{ recorded: boolean; rate_limit: RateLimitResult; record?: UsageRecord }> {
    const billingPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

    // 1. Check rate limit (sliding window per-minute)
    const rateLimit = await this.checkRateLimitInternal(
      input.workspace_id,
      input.dimension,
      input.tier
    );

    // 2. Check monthly quota
    const monthlyUsage = await this.getMonthlyUsage(
      input.workspace_id,
      billingPeriod,
      input.dimension
    );
    const tierConfig = this.getTierLimits(input.tier);
    const monthlyLimit = tierConfig.limits[input.dimension]?.monthly ?? Infinity;

    if (!rateLimit.allowed || monthlyUsage + input.quantity > monthlyLimit) {
      // Rate limit or quota exceeded — emit event & deny
      await this.audit.emitEvent({
        event_type: "usage.rate-limit-exceeded",
        category: "governance",
        severity: "warning",
        subject_id: input.subject_id,
        workspace_id: input.workspace_id,
        resource_urn: input.resource_urn,
        data: {
          dimension: input.dimension,
          requested: input.quantity,
          current_minute: rateLimit.current,
          per_minute_limit: rateLimit.limit,
          current_month: monthlyUsage,
          monthly_limit: monthlyLimit,
          reason: !rateLimit.allowed ? "per_minute_exceeded" : "monthly_quota_exceeded",
        },
      });

      return {
        recorded: false,
        rate_limit: {
          ...rateLimit,
          allowed: false,
          retry_after_ms: !rateLimit.allowed ? rateLimit.retry_after_ms : undefined,
        },
      };
    }

    // 3. Increment sliding-window counter (per-minute)
    const minuteKey = this.minuteKey(input.workspace_id, input.dimension);
    await this.cache.atomicSet(minuteKey, String(rateLimit.current + input.quantity), 120); // 2 min TTL

    // 4. Persist usage record
    const record: UsageRecord = {
      id: crypto.randomUUID(),
      workspace_id: input.workspace_id,
      subject_id: input.subject_id,
      dimension: input.dimension,
      quantity: input.quantity,
      unit: input.unit,
      resource_urn: input.resource_urn,
      recorded_at: new Date().toISOString(),
      billing_period: billingPeriod,
      metadata: input.metadata,
    };

    await this.db.execute(
      `INSERT INTO usage_records
         (id, workspace_id, subject_id, dimension, quantity, unit, resource_urn, recorded_at, billing_period, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.workspace_id,
        record.subject_id,
        record.dimension,
        record.quantity,
        record.unit,
        record.resource_urn,
        record.recorded_at,
        record.billing_period,
        JSON.stringify(record.metadata ?? {}),
      ]
    );

    // 5. Emit audit event
    await this.audit.emitEvent({
      event_type: "usage.metered",
      category: "governance",
      severity: "info",
      subject_id: input.subject_id,
      workspace_id: input.workspace_id,
      resource_urn: input.resource_urn,
      data: {
        record_id: record.id,
        dimension: record.dimension,
        quantity: record.quantity,
        unit: record.unit,
        billing_period: record.billing_period,
      },
    });

    // 6. If approaching 80% of monthly quota, queue an alert job
    const utilizationPct = (monthlyUsage + input.quantity) / monthlyLimit;
    if (utilizationPct >= 0.8) {
      await this.queue.send("USAGE_ALERT_QUEUE", {
        type: "quota-approaching",
        workspace_id: input.workspace_id,
        dimension: input.dimension,
        utilization_pct: Math.round(utilizationPct * 100),
        billing_period: billingPeriod,
      });
    }

    return {
      recorded: true,
      rate_limit: {
        ...rateLimit,
        current: rateLimit.current + input.quantity,
        remaining: rateLimit.remaining - input.quantity,
      },
      record,
    };
  }

  /**
   * Check rate limit for a specific dimension without recording usage.
   * Used for pre-flight checks before performing expensive operations.
   */
  async checkRateLimit(
    workspace_id: string,
    dimension: MeterDimension,
    tier: Tier
  ): Promise<RateLimitResult> {
    return this.checkRateLimitInternal(workspace_id, dimension, tier);
  }

  /**
   * Get aggregated usage for a workspace in a billing period.
   */
  async getUsage(
    workspace_id: string,
    billing_period: string,
    tier: Tier
  ): Promise<UsageAggregate> {
    const tierConfig = this.getTierLimits(tier);
    const dimensions: UsageAggregate["dimensions"] = {} as any;
    const overage: MeterDimension[] = [];

    for (const dim of Object.keys(tierConfig.limits) as MeterDimension[]) {
      const consumed = await this.getMonthlyUsage(workspace_id, billing_period, dim);
      const limit = tierConfig.limits[dim].monthly;
      const utilization_pct = limit > 0 ? Math.round((consumed / limit) * 10000) / 100 : 0;

      dimensions[dim] = {
        consumed,
        limit,
        unit: this.dimensionUnit(dim),
        utilization_pct,
      };

      if (consumed > limit) {
        overage.push(dim);
      }
    }

    return { workspace_id, billing_period, dimensions, overage };
  }

  /**
   * Get usage for a specific dimension in the current billing period.
   */
  async getMonthlyUsage(
    workspace_id: string,
    billing_period: string,
    dimension: MeterDimension
  ): Promise<number> {
    const result = await this.db.queryFirst(
      `SELECT COALESCE(SUM(quantity), 0) AS total
       FROM usage_records
       WHERE workspace_id = ? AND dimension = ? AND billing_period = ?`,
      [workspace_id, dimension, billing_period]
    );
    return (result as any)?.total ?? 0;
  }

  /**
   * Get usage trends for dashboards — daily buckets for a billing period.
   */
  async getUsageTrend(
    workspace_id: string,
    dimension: MeterDimension,
    billing_period: string
  ): Promise<Array<{ date: string; quantity: number }>> {
    const rows = await this.db.query(
      `SELECT DATE(recorded_at) AS date, SUM(quantity) AS quantity
       FROM usage_records
       WHERE workspace_id = ? AND dimension = ? AND billing_period = ?
       GROUP BY DATE(recorded_at)
       ORDER BY date`,
      [workspace_id, dimension, billing_period]
    );
    return (rows as any[]).map((r) => ({
      date: r.date,
      quantity: Number(r.quantity),
    }));
  }

  /**
   * Get the top-N resource consumers within a workspace for a dimension.
   */
  async getTopConsumers(
    workspace_id: string,
    dimension: MeterDimension,
    billing_period: string,
    limit: number = 10
  ): Promise<Array<{ subject_id: string; quantity: number }>> {
    const rows = await this.db.query(
      `SELECT subject_id, SUM(quantity) AS quantity
       FROM usage_records
       WHERE workspace_id = ? AND dimension = ? AND billing_period = ?
       GROUP BY subject_id
       ORDER BY quantity DESC
       LIMIT ?`,
      [workspace_id, dimension, billing_period, limit]
    );
    return (rows as any[]).map((r) => ({
      subject_id: r.subject_id,
      quantity: Number(r.quantity),
    }));
  }

  /* ─────────── Internal helpers ─────────── */

  private async checkRateLimitInternal(
    workspace_id: string,
    dimension: MeterDimension,
    tier: Tier
  ): Promise<RateLimitResult> {
    const tierConfig = this.getTierLimits(tier);
    const dimLimit = tierConfig.limits[dimension];
    if (!dimLimit) {
      // Unknown dimension — allow by default
      return {
        allowed: true,
        dimension,
        current: 0,
        limit: Infinity,
        remaining: Infinity,
        reset_at: new Date(Date.now() + 60_000).toISOString(),
      };
    }

    const minuteKey = this.minuteKey(workspace_id, dimension);
    const now = Date.now();
    const windowStart = Math.floor(now / 60_000) * 60_000; // current minute boundary
    const resetAt = new Date(windowStart + 60_000).toISOString();

    // Read current counter from cache
    const raw = await this.cache.get(minuteKey);
    const current = raw !== null ? Number(raw) : 0;
    const limit = dimLimit.burst ?? dimLimit.per_minute;
    const remaining = Math.max(0, limit - current);

    return {
      allowed: current < limit,
      dimension,
      current,
      limit,
      remaining,
      reset_at: resetAt,
      retry_after_ms: current >= limit ? windowStart + 60_000 - now : undefined,
    };
  }

  private getTierLimits(tier: Tier): TierLimits {
    const found = TIER_LIMITS.find((t) => t.tier === tier);
    if (!found) {
      // Default to free tier if unknown
      return TIER_LIMITS[0];
    }
    return found;
  }

  private minuteKey(workspace_id: string, dimension: MeterDimension): string {
    const minute = Math.floor(Date.now() / 60_000);
    return `ratelimit:${workspace_id}:${dimension}:${minute}`;
  }

  private dimensionUnit(dim: MeterDimension): string {
    const units: Record<MeterDimension, string> = {
      api_calls: "requests",
      storage_bytes: "bytes",
      search_queries: "queries",
      model_tokens_input: "tokens",
      model_tokens_output: "tokens",
      documents_ingested: "documents",
      chat_messages: "messages",
      audit_events: "events",
    };
    return units[dim];
  }
}
