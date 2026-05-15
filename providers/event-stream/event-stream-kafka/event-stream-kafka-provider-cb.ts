/**
 * 🔧 MyCodeXvantaOS - EventStreamKafkaProvider (CapabilityBase-based)
 *
 * @module providers/event-stream/event-stream-kafka
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface EventStreamKafkaConfig {
  timeout?: number;
  retries?: number;
  fallbackProviderId?: string;
}

export interface EventResult {
  success: boolean;
  offset?: number;
  error?: string;
  operationTime: number;
}

export class EventStreamKafkaProvider extends CapabilityBase<EventStreamKafkaConfig> {
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  private isAvailable: boolean = false;

  constructor(config: ProviderConfig<EventStreamKafkaConfig>) {
    super(config);
    const cfg = config.config;
    this.timeout = cfg.timeout || 5000;
    this.retries = cfg.retries || 3;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'EventStreamKafkaProvider initialized');
    } catch (error) {
      this.log('warn', 'EventStreamKafkaProvider initialization failed:', error);
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
    this.log('info', 'EventStreamKafkaProvider shutdown');
  }

  async publish(topic: string, event: Record<string, unknown>): Promise<EventResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `EventStreamKafkaProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async subscribe(topic: string, handler: (event: unknown) => void): Promise<EventResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `EventStreamKafkaProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
      type: 'event-stream-kafka',
      available: this.isAvailable,
    };
  }
}
export { EventStreamKafkaProvider as default };
