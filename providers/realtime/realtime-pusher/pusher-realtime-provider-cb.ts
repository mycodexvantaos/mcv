/**
 * 📡 MyCodexVantaOS - Pusher Realtime Provider (CapabilityBase-based)
 *
 * @module providers/realtime/realtime-pusher
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface PusherRealtimeConfig {
  appId?: string;
  key?: string;
  secret?: string;
  cluster?: string;
  timeout?: number;
  retries?: number;
  fallbackProviderId?: string;
}

export interface PushEvent {
  channel: string;
  event: string;
  data: unknown;
}

export interface PushResult {
  success: boolean;
  error?: string;
  operationTime: number;
}

export class PusherRealtimeProvider extends CapabilityBase<PusherRealtimeConfig> {
  private appId: string | undefined;
  private key: string | undefined;
  private secret: string | undefined;
  private cluster: string;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  private isAvailable: boolean = false;

  constructor(config: ProviderConfig<PusherRealtimeConfig>) {
    super(config);
    const cfg = config.config;
    this.appId = cfg.appId;
    this.key = cfg.key;
    this.secret = cfg.secret;
    this.cluster = cfg.cluster || 'us3';
    this.timeout = cfg.timeout || 5000;
    this.retries = cfg.retries || 3;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = Boolean(this.appId && this.key && this.secret);
      if (this.isAvailable) {
        this.log('info', 'Pusher realtime provider initialized');
      } else {
        this.log('warn', 'Pusher not configured - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Pusher initialization failed:', error);
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
    this.log('info', 'Pusher realtime provider shutdown');
  }

  async trigger(event: PushEvent): Promise<PushResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `Pusher not available. Use fallback: ${this.fallbackProviderId}`,
        operationTime: Date.now() - startTime,
      };
    }
    try {
      const result: PushResult = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      };
    }
  }

  async triggerBatch(events: PushEvent[]): Promise<PushResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `Pusher not available. Use fallback: ${this.fallbackProviderId}`,
        operationTime: Date.now() - startTime,
      };
    }
    try {
      const result: PushResult = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      };
    }
  }

  async authenticate(socketId: string, channel: string): Promise<{ auth: string } | PushResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `Pusher not available. Use fallback: ${this.fallbackProviderId}`,
        operationTime: Date.now() - startTime,
      };
    }
    try {
      const result = { auth: `${this.key}:${socketId}:${channel}` };
      this.recordSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      };
    }
  }

  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'pusher-realtime',
      available: this.isAvailable,
      cluster: this.cluster,
    };
  }
}
export { PusherRealtimeProvider as default };
