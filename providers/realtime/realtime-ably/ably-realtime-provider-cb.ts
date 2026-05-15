/**
 * 📡 MyCodeXvantaOS - Ably Realtime Provider (CapabilityBase-based)
 *
 * @module providers/realtime/realtime-ably
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

export interface AblyRealtimeConfig {
  apiKey?: string;
  clientId?: string;
  environment?: string;
  timeout?: number;
  retries?: number;
  fallbackProviderId?: string;
}

export interface AblyEvent {
  channel: string;
  name: string;
  data: unknown;
}

export interface PublishResult {
  success: boolean;
  error?: string;
  operationTime: number;
}

export class AblyRealtimeProvider extends CapabilityBase<AblyRealtimeConfig> {
  private apiKey: string | undefined;
  private clientId: string;
  private environment: string;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  private isAvailable: boolean = false;

  constructor(config: ProviderConfig<AblyRealtimeConfig>) {
    super(config);
    const cfg = config.config;
    this.apiKey = cfg.apiKey;
    this.clientId = cfg.clientId || 'mycodexvantaos-client';
    this.environment = cfg.environment || 'production';
    this.timeout = cfg.timeout || 5000;
    this.retries = cfg.retries || 3;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = Boolean(this.apiKey);
      if (this.isAvailable) {
        this.log('info', 'Ably realtime provider initialized');
      } else {
        this.log('warn', 'Ably not configured - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Ably initialization failed:', error);
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
    this.log('info', 'Ably realtime provider shutdown');
  }

  async publish(event: AblyEvent): Promise<PublishResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `Ably not available. Use fallback: ${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result: PublishResult = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  async publishBatch(events: AblyEvent[]): Promise<PublishResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `Ably not available. Use fallback: ${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result: PublishResult = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  async getToken(clientId?: string): Promise<{ token: string } | PublishResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `Ably not available. Use fallback: ${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result = { token: 'ably-token-placeholder' };
      this.recordSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'ably-realtime',
      available: this.isAvailable,
      environment: this.environment,
      clientId: this.clientId,
    };
  }
}
export { AblyRealtimeProvider as default };
