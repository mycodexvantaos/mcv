/**
 * 🔒 MyCodeXvantaOS - Redis Cache Provider (CapabilityBase-based)
 *
 * Redis cache integration with native fallback.
 *
 * @module providers/cache/cache-redis
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

/**
 * Configuration for Redis Cache Provider
 */
export interface RedisCacheConfig {
  /** Redis connection URL */
  url?: string;

  /** Redis host */
  host?: string;

  /** Redis port */
  port?: number;

  /** Redis password */
  password?: string;

  /** Redis database number */
  db?: number;

  /** Key prefix */
  keyPrefix?: string;

  /** Default TTL in seconds */
  defaultTTL?: number;

  /** Connection timeout in milliseconds */
  timeout?: number;

  /** Number of retries on failure */
  retries?: number;

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
 * 🔒 Redis Cache Provider
 *
 * Redis cache integration with native fallback capability.
 */
export class RedisCacheProvider extends CapabilityBase<RedisCacheConfig> {
  private url: string;
  private host: string;
  private port: number;
  private password: string | undefined;
  private db: number;
  private keyPrefix: string;
  private defaultTTL: number;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';

  private isRedisAvailable: boolean = false;
  private client: any = null;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<RedisCacheConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);

    const cfg = config.config;
    this.url = cfg.url || '';
    this.host = cfg.host || 'localhost';
    this.port = cfg.port || 6379;
    this.password = cfg.password;
    this.db = cfg.db || 0;
    this.keyPrefix = cfg.keyPrefix || 'cache:';
    this.defaultTTL = cfg.defaultTTL || 3600;
    this.timeout = cfg.timeout || 5000;
    this.retries = cfg.retries || 3;
  }

  /**
   * Initialize the Redis cache provider
   */
  protected async doInitialize(): Promise<void> {
    if (!this.url && !this.password) {
      this.log('warn', 'Redis credentials not provided - will use native fallback');
      this.isRedisAvailable = false;
      return;
    }

    try {
      await this.checkRedisAvailability();

      if (this.isRedisAvailable) {
        this.log(
          'info',
          `Redis cache provider initialized at ${this.url || `${this.host}:${this.port}`}`
        );
      } else {
        this.log('warn', 'Redis connection failed - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Redis initialization failed:', error);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Check if Redis is available
   */
  private async checkRedisAvailability(): Promise<boolean> {
    try {
      // For now, we'll simulate availability check
      // In production, this would actually attempt to connect to Redis
      if (this.url || this.host) {
        this.isRedisAvailable = true;
        return true;
      }
      return false;
    } catch {
      this.isRedisAvailable = false;
      return false;
    }
  }

  /**
   * Health check for Redis cache provider
   */
  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    if (!this.url && !this.host) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.DEGRADED,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'Redis connection details not provided',
        },
      };
    }

    const available = await this.checkRedisAvailability();

    if (!available) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'Redis not available',
        },
      };
    }

    return {
      isHealthy: true,
      status: ProviderHealthStatus.HEALTHY,
      checkTime: new Date().toISOString(),
      metrics: {},
    };
  }

  /**
   * Shutdown the provider
   */
  protected async doShutdown(): Promise<void> {
    if (this.client) {
      try {
        // Close Redis connection
        this.client = null;
      } catch (error) {
        this.log('warn', 'Error closing Redis connection:', error);
      }
    }
    this.log('info', 'Redis cache provider shutdown');
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string, options?: CacheOptions): Promise<CacheResult<T>> {
    const startTime = Date.now();

    if (!this.isRedisAvailable) {
      const operationTime = Date.now() - startTime;
      return {
        success: false,
        error: `Redis not available. Use fallback provider: ${this.fallbackProviderId}`,
        hit: false,
        operationTime,
      };
    }

    try {
      const result = await this.getWithRetry(key, options);
      const operationTime = Date.now() - startTime;
      result.operationTime = operationTime;

      this.recordSuccess(operationTime);
      return result;
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
   * Get with retry logic
   */
  private async getWithRetry<T = any>(
    key: string,
    options?: CacheOptions
  ): Promise<CacheResult<T>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        return await this.doGet(key, options);
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Get attempt ${attempt}/${this.retries} failed:`, error);

        if (attempt < this.retries) {
          const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Unknown error during get');
  }

  /**
   * Actual get logic
   */
  private async doGet<T = any>(key: string, options?: CacheOptions): Promise<CacheResult<T>> {
    const fullKey = `${options?.prefix || this.keyPrefix}${key}`;

    // In production, this would call Redis GET command
    // For now, we'll simulate the behavior
    const value = await this.redisGet(fullKey);

    if (value === null) {
      return {
        success: true,
        hit: false,
        operationTime: 0,
      };
    }

    const cacheValue: CacheValue<T> = JSON.parse(value);

    // Check expiration
    if (cacheValue.expiresAt && cacheValue.expiresAt < Date.now()) {
      await this.redisDel(fullKey);
      return {
        success: true,
        hit: false,
        operationTime: 0,
      };
    }

    return {
      success: true,
      value: cacheValue.value,
      hit: true,
      operationTime: 0,
    };
  }

  /**
   * Set value in cache
   */
  async set<T = any>(key: string, value: T, options?: CacheOptions): Promise<CacheResult<void>> {
    const startTime = Date.now();

    if (!this.isRedisAvailable) {
      const operationTime = Date.now() - startTime;
      return {
        success: false,
        error: `Redis not available. Use fallback provider: ${this.fallbackProviderId}`,
        operationTime,
      };
    }

    try {
      const result = await this.setWithRetry(key, value, options);
      const operationTime = Date.now() - startTime;
      result.operationTime = operationTime;

      this.recordSuccess(operationTime);
      return result;
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
   * Set with retry logic
   */
  private async setWithRetry<T = any>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<CacheResult<void>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        return await this.doSet(key, value, options);
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Set attempt ${attempt}/${this.retries} failed:`, error);

        if (attempt < this.retries) {
          const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Unknown error during set');
  }

  /**
   * Actual set logic
   */
  private async doSet<T = any>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<CacheResult<void>> {
    const fullKey = `${options?.prefix || this.keyPrefix}${key}`;
    const ttl = options?.ttl || this.defaultTTL;

    const cacheValue: CacheValue<T> = {
      value,
      expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : undefined,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    };

    const serialized = JSON.stringify(cacheValue);
    await this.redisSet(fullKey, serialized, ttl);

    return {
      success: true,
      operationTime: 0,
    };
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<CacheResult<void>> {
    const startTime = Date.now();

    if (!this.isRedisAvailable) {
      const operationTime = Date.now() - startTime;
      return {
        success: false,
        error: `Redis not available. Use fallback provider: ${this.fallbackProviderId}`,
        operationTime,
      };
    }

    try {
      await this.deleteWithRetry(key, options);
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
   * Delete with retry logic
   */
  private async deleteWithRetry(key: string, options?: CacheOptions): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        await this.doDelete(key, options);
        return;
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Delete attempt ${attempt}/${this.retries} failed:`, error);

        if (attempt < this.retries) {
          const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Unknown error during delete');
  }

  /**
   * Actual delete logic
   */
  private async doDelete(key: string, options?: CacheOptions): Promise<void> {
    const fullKey = `${options?.prefix || this.keyPrefix}${key}`;
    await this.redisDel(fullKey);
  }

  /**
   * Clear all cache
   */
  async clear(options?: CacheOptions): Promise<CacheResult<void>> {
    const startTime = Date.now();

    if (!this.isRedisAvailable) {
      const operationTime = Date.now() - startTime;
      return {
        success: false,
        error: `Redis not available. Use fallback provider: ${this.fallbackProviderId}`,
        operationTime,
      };
    }

    try {
      await this.clearWithRetry(options);
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
   * Clear with retry logic
   */
  private async clearWithRetry(options?: CacheOptions): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        await this.doClear(options);
        return;
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Clear attempt ${attempt}/${this.retries} failed:`, error);

        if (attempt < this.retries) {
          const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Unknown error during clear');
  }

  /**
   * Actual clear logic
   */
  private async doClear(options?: CacheOptions): Promise<void> {
    const pattern = `${options?.prefix || this.keyPrefix}*`;
    // In production, this would use SCAN + DEL
    // For now, we'll simulate
  }

  /**
   * Simulated Redis operations (to be replaced with actual Redis client)
   */
  private async redisGet(key: string): Promise<string | null> {
    // Simulated - replace with actual Redis GET
    return null;
  }

  private async redisSet(key: string, value: string, ttl: number): Promise<void> {
    // Simulated - replace with actual Redis SETEX
  }

  private async redisDel(key: string): Promise<void> {
    // Simulated - replace with actual Redis DEL
  }

  /**
   * Get provider info
   */
  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'redis-cache',
      url: this.url || `${this.host}:${this.port}`,
      db: this.db,
      keyPrefix: this.keyPrefix,
      defaultTTL: this.defaultTTL,
      available: this.isRedisAvailable,
      hasCredentials: !!(this.url || this.password),
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
export { RedisCacheProvider as default };
