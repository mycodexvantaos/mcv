/**
 * 🔧 MyCodeXvantaOS - OpenTelemetryProvider (CapabilityBase-based)
 *
 * @module providers/observability/observability-opentelemetry
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface OpenTelemetryConfig {
  endpoint: string;
  serviceName?: string;
  samplingRate?: number;
  exporterProtocol?: string;
}

export interface TelemetryResult {
  success: boolean;
  traceId?: string;
  spanId?: string;
  error?: string;
  operationTime: number;
}

export class OpenTelemetryProvider extends CapabilityBase<OpenTelemetryConfig> {
  private endpoint: string;
  private serviceName: string | undefined;
  private samplingRate: number | undefined;
  private exporterProtocol: string | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<OpenTelemetryConfig>) {
    super(config);
    const cfg = config.config;
    this.endpoint = cfg.endpoint;
    this.serviceName = cfg.serviceName;
    this.samplingRate = cfg.samplingRate || 1.0;
    this.exporterProtocol = cfg.exporterProtocol || 'grpc';
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'OpenTelemetryProvider initialized');
    } catch (error) {
      this.log('warn', 'OpenTelemetryProvider initialization failed:', error);
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
    this.log('info', 'OpenTelemetryProvider shutdown');
  }

  async recordMetric(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): Promise<TelemetryResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `OpenTelemetryProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async traceSpan(name: string, fn: () => Promise<unknown>): Promise<unknown> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `OpenTelemetryProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async logEvent(name: string, data: Record<string, unknown>): Promise<TelemetryResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `OpenTelemetryProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
      type: 'opentelemetry',
      available: this.isAvailable,
    };
  }
}
export { OpenTelemetryProvider as default };
