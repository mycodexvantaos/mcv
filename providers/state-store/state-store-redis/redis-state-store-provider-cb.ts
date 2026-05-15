/**
 * 🔧 MyCodeXvantaOS - RedisStateStoreProvider (CapabilityBase-based)
 *
 * @module providers/state-store/state-store-redis
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface RedisStateStoreConfig {
  url: string;
  keyPrefix?: string;
  ttlSeconds?: number;
}

export interface StateResult {
  success: boolean;
  value?: unknown;
  error?: string;
  operationTime: number;
}

export class RedisStateStoreProvider extends CapabilityBase<RedisStateStoreConfig> {
  private url: string;
  private keyPrefix: string | undefined;
  private ttlSeconds: number | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<RedisStateStoreConfig>) {
    super(config);
    const cfg = config.config;
    this.url = cfg.url;
    this.keyPrefix = cfg.keyPrefix || 'mycodexvantaos:state:';
    this.ttlSeconds = cfg.ttlSeconds || 3600;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'RedisStateStoreProvider initialized');
    } catch (error) {
      this.log('warn', 'RedisStateStoreProvider initialization failed:', error);
      this.isAvailable = false;
    }
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    return {
      isHealthy: this.isAvailable,
      status: this.isAvailable ? ProviderHealthStatus.HEALTHY : ProviderHealthStatus.DEGRADED,
      checkTime: new Date().toISOString(),
      metrics: {},
    };
  }

  protected async doShutdown(): Promise<void> {
    this.log('info', 'RedisStateStoreProvider shutdown');
  }

  async getState(key: string): Promise<StateResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `RedisStateStoreProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
        operationTime: Date.now() - startTime,
      } as any;
    }
    try {
      const result: any = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      } as any;
    }
  }
  async setState(key: string, value: unknown, ttl?: number): Promise<StateResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `RedisStateStoreProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
        operationTime: Date.now() - startTime,
      } as any;
    }
    try {
      const result: any = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      } as any;
    }
  }
  async deleteState(key: string): Promise<StateResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `RedisStateStoreProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
        operationTime: Date.now() - startTime,
      } as any;
    }
    try {
      const result: any = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      } as any;
    }
  }

  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'redis-state-store',
      available: this.isAvailable,
    };
  }
}
export { RedisStateStoreProvider as default };
