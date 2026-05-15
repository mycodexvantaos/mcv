/**
 * 📦 Native/Memory Cache (CapabilityBase-based)
 * 零依賴實現，適配 capabilities 層規範。
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface MemoryCacheConfig {
  maxSize?: number;
  ttlMs?: number;
}

interface CacheEntry {
  value: any;
  expireAt: number;
}

export class MemoryCache extends CapabilityBase<MemoryCacheConfig> {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private defaultTtl: number;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<MemoryCacheConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);
    this.maxSize = config.config.maxSize || 5000;
    this.defaultTtl = config.config.ttlMs || 60000;
  }

  protected async doInitialize(): Promise<void> {
    this.log('info', 'Memory cache (native) initialized');
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    return {
      isHealthy: true,
      status: ProviderHealthStatus.HEALTHY,
      checkTime: new Date().toISOString(),
      metrics: {},
    };
  }

  protected async doShutdown(): Promise<void> {
    this.cache.clear();
    this.log('info', 'Memory cache shutdown');
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // 簡單過期清理策略（隨機移除一個過期項）
      const now = Date.now();
      for (const [k, v] of this.cache) {
        if (v.expireAt <= now) {
          this.cache.delete(k);
          break;
        }
      }
      if (this.cache.size >= this.maxSize) {
        this.cache.delete(Array.from(this.cache.keys())[0]);
      }
    }
    const expireAt = Date.now() + (ttl ?? this.defaultTtl);
    this.cache.set(key, { value, expireAt });
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expireAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async del(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async size(): Promise<number> {
    return this.cache.size;
  }
}
