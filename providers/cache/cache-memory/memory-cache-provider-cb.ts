/**
 * 🔒 MyCodeXvantaOS - Memory Cache Provider (CapabilityBase-based)
 *
 * In-memory cache implementation with zero external dependencies.
 *
 * @module providers/cache/cache-memory
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import type { ProviderConfig, ProviderHealthCheckResult, ProviderHealthStatus } from '../../../packages/capabilities/types';

/**
 * Configuration for Memory Cache Provider
 */
export interface MemoryCacheConfig {
  /** Maximum number of items in cache */
  maxItems?: number;
  
  /** Default TTL in seconds */
  defaultTTL?: number;
  
  /** Key prefix */
  keyPrefix?: string;
  
  /** Enable automatic cleanup */
  autoCleanup?: boolean;
  
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number;
  
  /** Native fallback provider ID */
  fallbackProviderId?: string;
}

/**
 * Cache value with metadata
 */
export interface CacheValue<T = any> {
  /** Stored value */
  value: T;
  
  /** Expiration timestamp */
  expiresAt?: number;
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Last access timestamp */
  lastAccessedAt: number;
  
  /** Access count */
  accessCount: number;
}

/**
 * Cache options
 */
export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  
  /** Key prefix */
  prefix?: string;
}

/**
 * Get/Put result
 */
export interface CacheResult<T = any> {
  /** Success status */
  success: boolean;
  
  /** Cached value */
  value?: T;
  
  /** Cache hit/miss status */
  hit?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Operation time in milliseconds */
  operationTime: number;
}

/**
 * 🔒 Memory Cache Provider
 *
 * Native in-memory cache with zero external dependencies.
 */
export class MemoryCacheProvider extends CapabilityBase<MemoryCacheConfig> {
  private cache: Map<string, CacheValue>;
  private maxItems: number;
  private defaultTTL: number;
  private keyPrefix: string;
  private autoCleanup: boolean;
  private cleanupInterval: number;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private fallbackProviderId: string;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<MemoryCacheConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);
    
    const cfg = config.config;
    this.cache = new Map();
    this.maxItems = cfg.maxItems || 1000;
    this.defaultTTL = cfg.defaultTTL || 3600;
    this.keyPrefix = cfg.keyPrefix || 'cache:';
    this.autoCleanup = cfg.autoCleanup ?? true;
    this.cleanupInterval = cfg.cleanupInterval || 60000; // 1 minute
    this.fallbackProviderId = cfg.fallbackProviderId || 'cache/memory-native';
  }

  /**
   * Initialize the memory cache provider
   */
  protected async doInitialize(): Promise<void> {
    try {
      if (this.autoCleanup) {
        this.startCleanup();
      }
      this.log('info', `Memory cache provider initialized (maxItems: ${this.maxItems})`);
    } catch (error) {
      this.log('error', 'Memory cache initialization failed:', error);
      throw error;
    }
  }

  /**
   * Health check for memory cache provider
   */
  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt && value.expiresAt < now) {
        expiredCount++;
      }
    }
    
    return {
      isHealthy: true,
      status: ProviderHealthStatus.HEALTHY,
      checkTime: new Date().toISOString(),
      metrics: {
        totalItems: this.cache.size,
        expiredItems: expiredCount,
        maxItems: this.maxItems,
        autoCleanup: this.autoCleanup,
        defaultTTL: this.defaultTTL,
      },
    };
  }

  /**
   * Shutdown the provider
   */
  protected async doShutdown(): Promise<void> {
    this.stopCleanup();
    this.cache.clear();
    this.log('info', 'Memory cache provider shutdown');
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string, options?: CacheOptions): Promise<CacheResult<T>> {
    const startTime = Date.now();
    
    try {
      const fullKey = `${options?.prefix || this.keyPrefix}${key}`;
      const cacheValue = this.cache.get(fullKey);
      
      if (!cacheValue) {
        const operationTime = Date.now() - startTime;
        return {
          success: true,
          hit: false,
          operationTime,
        };
      }
      
      // Check expiration
      const now = Date.now();
      if (cacheValue.expiresAt && cacheValue.expiresAt < now) {
        this.cache.delete(fullKey);
        const operationTime = Date.now() - startTime;
        return {
          success: true,
          hit: false,
          operationTime,
        };
      }
      
      // Update access metadata
      cacheValue.lastAccessedAt = now;
      cacheValue.accessCount++;
      
      const operationTime = Date.now() - startTime;
      this.recordSuccess(operationTime);
      
      return {
        success: true,
        value: cacheValue.value,
        hit: true,
        operationTime,
      };
    } catch (error) {
      const operationTime = Date.now() - startTime;
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        hit: false,
        operationTime,
      };
    }
  }

  /**
   * Set value in cache
   */
  async set<T = any>(key: string, value: T, options?: CacheOptions): Promise<CacheResult<void>> {
    const startTime = Date.now();
    
    try {
      const fullKey = `${options?.prefix || this.keyPrefix}${key}`;
      const ttl = options?.ttl || this.defaultTTL;
      
      const cacheValue: CacheValue<T> = {
        value,
        expiresAt: ttl > 0 ? Date.now() + (ttl * 1000) : undefined,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        accessCount: 0,
      };
      
      // Check if we need to evict items
      if (this.cache.size >= this.maxItems && !this.cache.has(fullKey)) {
        this.evictLRU();
      }
      
      this.cache.set(fullKey, cacheValue);
      
      const operationTime = Date.now() - startTime;
      this.recordSuccess(operationTime);
      
      return {
        success: true,
        operationTime,
      };
    } catch (error) {
      const operationTime = Date.now() - startTime;
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime,
      };
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<CacheResult<void>> {
    const startTime = Date.now();
    
    try {
      const fullKey = `${options?.prefix || this.keyPrefix}${key}`;
      const deleted = this.cache.delete(fullKey);
      
      const operationTime = Date.now() - startTime;
      this.recordSuccess(operationTime);
      
      return {
        success: deleted,
        operationTime,
      };
    } catch (error) {
      const operationTime = Date.now() - startTime;
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime,
      };
    }
  }

  /**
   * Clear all cache
   */
  async clear(options?: CacheOptions): Promise<CacheResult<void>> {
    const startTime = Date.now();
    
    try {
      const prefix = options?.prefix || this.keyPrefix;
      
      if (prefix) {
        // Clear only keys with prefix
        for (const key of this.cache.keys()) {
          if (key.startsWith(prefix)) {
            this.cache.delete(key);
          }
        }
      } else {
        // Clear all
        this.cache.clear();
      }
      
      const operationTime = Date.now() - startTime;
      this.recordSuccess(operationTime);
      
      return {
        success: true,
        operationTime,
      };
    } catch (error) {
      const operationTime = Date.now() - startTime;
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime,
      };
    }
  }

  /**
   * Get multiple values
   */
  async getMany<T = any>(keys: string[], options?: CacheOptions): Promise<Map<string, CacheResult<T>>> {
    const results = new Map<string, CacheResult<T>>();
    
    for (const key of keys) {
      const result = await this.get<T>(key, options);
      results.set(key, result);
    }
    
    return results;
  }

  /**
   * Set multiple values
   */
  async setMany<T = any>(items: Map<string, T>, options?: CacheOptions): Promise<CacheResult<void>> {
    const startTime = Date.now();
    let success = true;
    let lastError: string | undefined;
    
    try {
      for (const [key, value] of items.entries()) {
        const result = await this.set(key, value, options);
        if (!result.success) {
          success = false;
          lastError = result.error;
        }
      }
      
      const operationTime = Date.now() - startTime;
      return {
        success,
        error: lastError,
        operationTime,
      };
    } catch (error) {
      const operationTime = Date.now() - startTime;
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime,
      };
    }
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;
    const now = Date.now();
    
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt && value.expiresAt < now) {
        // Evict expired items first
        this.cache.delete(key);
        return;
      }
      
      if (value.lastAccessedAt < lruTime) {
        lruTime = value.lastAccessedAt;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      return;
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredItems();
    }, this.cleanupInterval);
  }

  /**
   * Stop automatic cleanup
   */
  private stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Cleanup expired items
   */
  private cleanupExpiredItems(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt && value.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.log('debug', `Cleaned up ${cleaned} expired items`);
    }
  }

  /**
   * Get provider info
   */
  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'memory-cache',
      totalItems: this.cache.size,
      maxItems: this.maxItems,
      defaultTTL: this.defaultTTL,
      keyPrefix: this.keyPrefix,
      autoCleanup: this.autoCleanup,
      cleanupInterval: this.cleanupInterval,
      fallbackProvider: this.fallbackProviderId,
      status: this._status,
      isInitialized: this._isInitialized,
      metrics: this.metrics,
    };
  }
}

/**
 * Default export
 */
export { MemoryCacheProvider as default };