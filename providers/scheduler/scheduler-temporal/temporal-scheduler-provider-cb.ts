/**
 * 🔧 MyCodeXvantaOS - TemporalSchedulerProvider (CapabilityBase-based)
 *
 * @module providers/scheduler/scheduler-temporal
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

export interface TemporalSchedulerConfig {
  hostPort: string;
  namespace?: string;
  taskQueue?: string;
}

export interface ScheduleResult { success: boolean; workflowId?: string; status?: string; error?: string; operationTime: number; }

export class TemporalSchedulerProvider extends CapabilityBase<TemporalSchedulerConfig> {
  private hostPort: string;
  private namespace: string | undefined;
  private taskQueue: string | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<TemporalSchedulerConfig>) {
    super(config);
    const cfg = config.config;
this.hostPort = cfg.hostPort || 'localhost:7233';
    this.namespace = cfg.namespace || 'mycodexvantaos';
    this.taskQueue = cfg.taskQueue;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'TemporalSchedulerProvider initialized');
    } catch (error) {
      this.log('warn', 'TemporalSchedulerProvider initialization failed:', error);
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
    this.log('info', 'TemporalSchedulerProvider shutdown');
  }

  async scheduleWorkflow(workflowId: string, cron: string): Promise<ScheduleResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `TemporalSchedulerProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
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
  async cancelSchedule(workflowId: string): Promise<ScheduleResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `TemporalSchedulerProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
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
  async describeSchedule(workflowId: string): Promise<ScheduleResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `TemporalSchedulerProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
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
      type: 'temporal-scheduler',
      available: this.isAvailable,
    };
  }
}
export { TemporalSchedulerProvider as default };
