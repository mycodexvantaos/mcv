/**
 * MyCodexVantaOS Billing & Metering Service
 *
 * Service ID: mycodexvantaos-billing-metering
 * Foundation: Business Foundation
 * Capability: Usage metering, quota management, outcome-based billing
 *
 * Machine Identity: mycodexvantaos
 */

export const SERVICE_ID = 'mycodexvantaos-billing-metering';
export const SERVICE_VERSION = '1.0.0';

export type BillingUnit =
  | 'token'
  | 'request'
  | 'compute-second'
  | 'storage-gb'
  | 'embedding'
  | 'agent-run';
export type BillingTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface UsageEvent {
  eventId: string;
  workspaceId: string;
  serviceId: string;
  capability: string;
  unit: BillingUnit;
  quantity: number;
  metadata: Record<string, string>;
  timestamp: Date;
}

export interface QuotaLimit {
  workspaceId: string;
  tier: BillingTier;
  limits: Record<BillingUnit, number>;
  period: 'daily' | 'monthly';
  resetAt: Date;
}

export interface UsageSummary {
  workspaceId: string;
  period: { from: Date; to: Date };
  usage: Record<BillingUnit, number>;
  cost: Record<BillingUnit, number>;
  totalCost: number;
  currency: 'USD';
}

export interface PricingModel {
  tier: BillingTier;
  prices: Record<BillingUnit, number>; // Price per unit in USD
  includedUnits: Record<BillingUnit, number>; // Free units per period
}

/**
 * Pricing models for each tier.
 */
export const PRICING_MODELS: Record<BillingTier, PricingModel> = {
  free: {
    tier: 'free',
    prices: {
      token: 0,
      request: 0,
      'compute-second': 0,
      'storage-gb': 0,
      embedding: 0,
      'agent-run': 0,
    },
    includedUnits: {
      token: 100000,
      request: 1000,
      'compute-second': 3600,
      'storage-gb': 1,
      embedding: 1000,
      'agent-run': 100,
    },
  },
  starter: {
    tier: 'starter',
    prices: {
      token: 0.000002,
      request: 0.001,
      'compute-second': 0.0001,
      'storage-gb': 0.02,
      embedding: 0.0001,
      'agent-run': 0.01,
    },
    includedUnits: {
      token: 1000000,
      request: 10000,
      'compute-second': 36000,
      'storage-gb': 10,
      embedding: 10000,
      'agent-run': 1000,
    },
  },
  professional: {
    tier: 'professional',
    prices: {
      token: 0.0000015,
      request: 0.0008,
      'compute-second': 0.00008,
      'storage-gb': 0.015,
      embedding: 0.00008,
      'agent-run': 0.008,
    },
    includedUnits: {
      token: 10000000,
      request: 100000,
      'compute-second': 360000,
      'storage-gb': 100,
      embedding: 100000,
      'agent-run': 10000,
    },
  },
  enterprise: {
    tier: 'enterprise',
    prices: {
      token: 0.000001,
      request: 0.0005,
      'compute-second': 0.00005,
      'storage-gb': 0.01,
      embedding: 0.00005,
      'agent-run': 0.005,
    },
    includedUnits: {
      token: 100000000,
      request: 1000000,
      'compute-second': 3600000,
      'storage-gb': 1000,
      embedding: 1000000,
      'agent-run': 100000,
    },
  },
};

/**
 * Billing & Metering Engine
 * Tracks usage events and computes billing for workspaces.
 */
export class BillingMeteringEngine {
  private usageEvents: Map<string, UsageEvent[]> = new Map(); // workspaceId -> events
  private quotas: Map<string, QuotaLimit> = new Map();

  /**
   * Record a usage event for billing.
   */
  recordUsage(event: Omit<UsageEvent, 'eventId' | 'timestamp'>): UsageEvent {
    const fullEvent: UsageEvent = {
      ...event,
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
    };

    const events = this.usageEvents.get(event.workspaceId) ?? [];
    events.push(fullEvent);
    this.usageEvents.set(event.workspaceId, events);

    return fullEvent;
  }

  /**
   * Check if a workspace has exceeded its quota.
   */
  checkQuota(
    workspaceId: string,
    unit: BillingUnit,
    requestedQuantity: number
  ): {
    allowed: boolean;
    remaining: number;
    limit: number;
  } {
    const quota = this.quotas.get(workspaceId);
    if (!quota) {
      return { allowed: true, remaining: Infinity, limit: Infinity };
    }

    const currentUsage = this.getCurrentUsage(workspaceId, unit);
    const limit = quota.limits[unit] ?? Infinity;
    const remaining = Math.max(0, limit - currentUsage);

    return {
      allowed: currentUsage + requestedQuantity <= limit,
      remaining,
      limit,
    };
  }

  /**
   * Get current usage for a workspace and unit type.
   */
  private getCurrentUsage(workspaceId: string, unit: BillingUnit): number {
    const events = this.usageEvents.get(workspaceId) ?? [];
    return events.filter((e) => e.unit === unit).reduce((sum, e) => sum + e.quantity, 0);
  }

  /**
   * Generate a usage summary for a workspace.
   */
  generateUsageSummary(
    workspaceId: string,
    from: Date,
    to: Date,
    tier: BillingTier = 'starter'
  ): UsageSummary {
    const events = (this.usageEvents.get(workspaceId) ?? []).filter(
      (e) => e.timestamp >= from && e.timestamp <= to
    );

    const pricing = PRICING_MODELS[tier];
    const usage: Record<BillingUnit, number> = {
      token: 0,
      request: 0,
      'compute-second': 0,
      'storage-gb': 0,
      embedding: 0,
      'agent-run': 0,
    };

    for (const event of events) {
      usage[event.unit] = (usage[event.unit] ?? 0) + event.quantity;
    }

    const cost: Record<BillingUnit, number> = {} as Record<BillingUnit, number>;
    let totalCost = 0;

    for (const [unit, quantity] of Object.entries(usage) as [BillingUnit, number][]) {
      const included = pricing.includedUnits[unit] ?? 0;
      const billableQuantity = Math.max(0, quantity - included);
      const unitCost = billableQuantity * (pricing.prices[unit] ?? 0);
      cost[unit] = unitCost;
      totalCost += unitCost;
    }

    return {
      workspaceId,
      period: { from, to },
      usage,
      cost,
      totalCost: Math.round(totalCost * 100) / 100,
      currency: 'USD',
    };
  }

  /**
   * Set quota limits for a workspace.
   */
  setQuota(quota: QuotaLimit): void {
    this.quotas.set(quota.workspaceId, quota);
  }
}

export const billingEngine = new BillingMeteringEngine();
