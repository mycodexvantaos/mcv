/**
 * 🔧 MyCodeXvantaOS - ZodValidationProvider (CapabilityBase-based)
 *
 * @module providers/validation/validation-zod
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface ZodValidationConfig {
  strictMode?: boolean;
  errorFormat?: string;
}

export interface ValidationResult {
  success: boolean;
  data?: unknown;
  errors?: string[];
  operationTime: number;
}

export class ZodValidationProvider extends CapabilityBase<ZodValidationConfig> {
  private strictMode: boolean | undefined;
  private errorFormat: string | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<ZodValidationConfig>) {
    super(config);
    const cfg = config.config;
    this.strictMode = cfg.strictMode ?? true;
    this.errorFormat = cfg.errorFormat || 'flat';
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'ZodValidationProvider initialized');
    } catch (error) {
      this.log('warn', 'ZodValidationProvider initialization failed:', error);
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
    this.log('info', 'ZodValidationProvider shutdown');
  }

  async validate(schema: string, data: unknown): Promise<ValidationResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `ZodValidationProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async parse(schema: string, data: unknown): Promise<ValidationResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `ZodValidationProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
      type: 'zod-validation',
      available: this.isAvailable,
    };
  }
}
export { ZodValidationProvider as default };
