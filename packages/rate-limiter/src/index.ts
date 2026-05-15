/**
 * MyCodeXvantaOS Rate Limiter
 * Provides rate limiting for API endpoints and services
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private requests: Map<string, { count: number; resetTime: number }>;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.requests = new Map();
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const resetTime = now + this.config.windowMs;

    let record = this.requests.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime };
      this.requests.set(key, record);
    }

    record.count++;
    const remaining = Math.max(0, this.config.maxRequests - record.count);

    return {
      allowed: record.count <= this.config.maxRequests,
      remaining,
      resetTime: record.resetTime,
    };
  }

  async reset(key: string): Promise<void> {
    this.requests.delete(key);
  }
}

export default RateLimiter;
