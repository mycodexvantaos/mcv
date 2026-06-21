/**
 * Advanced Caching Strategy
 * Redis-based caching with invalidation and warming
 */

import Redis from 'ioredis';

export class CacheManager {
  private redis: Redis;
  private ttl: number = 3600; // 1 hour default

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.redis.setex(key, ttl || this.ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async warm(key: string, loader: () => Promise<any>): Promise<void> {
    const value = await loader();
    await this.set(key, value);
  }

  async getStats(): Promise<Record<string, any>> {
    const info = await this.redis.info('stats');
    return { info };
  }
}

export const cacheManager = new CacheManager(process.env.REDIS_URL || 'redis://localhost:6379');
