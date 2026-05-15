/**
 * 🔧 MyCodeXvantaOS - PrometheusProvider (CapabilityBase-based)
 *
 * @module providers/observability/observability-prometheus
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface PrometheusConfig {
  metricsPath?: string;
  port?: number;
  scrapeIntervalSeconds?: number;
}

export interface MetricResult {
  success: boolean;
  data?: unknown;
  error?: string;
  operationTime: number;
}

export class PrometheusProvider extends CapabilityBase<PrometheusConfig> {
  private metricsPath: string | undefined;
  private port: number | undefined;
  private scrapeIntervalSeconds: number | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<PrometheusConfig>) {
    super(config);
    const cfg = config.config;
    this.metricsPath = cfg.metricsPath || '/metrics';
    this.port = cfg.port || 9090;
    this.scrapeIntervalSeconds = cfg.scrapeIntervalSeconds || 15;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'PrometheusProvider initialized');
    } catch (error) {
      this.log('warn', 'PrometheusProvider initialization failed:', error);
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
    this.log('info', 'PrometheusProvider shutdown');
  }

  async query(promql: string): Promise<MetricResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `PrometheusProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async queryRange(
    promql: string,
    start: string,
    end: string,
    step: string
  ): Promise<MetricResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `PrometheusProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
      type: 'prometheus',
      available: this.isAvailable,
    };
  }
}
export { PrometheusProvider as default };
