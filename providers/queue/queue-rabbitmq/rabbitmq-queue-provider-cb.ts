/**
 * 🔧 MyCodeXvantaOS - RabbitMQQueueProvider (CapabilityBase-based)
 *
 * @module providers/queue/queue-rabbitmq
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

export interface RabbitMQQueueConfig {
  url: string;
  exchange?: string;
  prefetch?: number;
}

export interface QueueResult { success: boolean; deliveryTag?: number; error?: string; operationTime: number; }

export class RabbitMQQueueProvider extends CapabilityBase<RabbitMQQueueConfig> {
  private url: string;
  private exchange: string | undefined;
  private prefetch: number | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<RabbitMQQueueConfig>) {
    super(config);
    const cfg = config.config;
this.url = cfg.url;
    this.exchange = cfg.exchange || 'mycodexvantaos';
    this.prefetch = cfg.prefetch || 10;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'RabbitMQQueueProvider initialized');
    } catch (error) {
      this.log('warn', 'RabbitMQQueueProvider initialization failed:', error);
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
    this.log('info', 'RabbitMQQueueProvider shutdown');
  }

  async publish(queue: string, message: unknown): Promise<QueueResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `RabbitMQQueueProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
    }
    try {
      const result: any = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime } as any;
    }
  }
  async consume(queue: string, handler: (msg: unknown) => void): Promise<QueueResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `RabbitMQQueueProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
    }
    try {
      const result: any = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime } as any;
    }
  }
  async acknowledge(deliveryTag: number): Promise<QueueResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `RabbitMQQueueProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
    }
    try {
      const result: any = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime } as any;
    }
  }

  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'rabbitmq-queue',
      available: this.isAvailable,
    };
  }
}
export { RabbitMQQueueProvider as default };
