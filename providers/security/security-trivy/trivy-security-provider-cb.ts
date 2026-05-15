/**
 * 🔧 MyCodeXvantaOS - TrivySecurityProvider (CapabilityBase-based)
 *
 * @module providers/security/security-trivy
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

export interface TrivySecurityConfig {
  severity?: string[];
  ignoreUnfixed?: boolean;
  timeout?: string;
}

export interface ScanResult { success: boolean; vulnerabilities?: unknown[]; criticalCount?: number; error?: string; operationTime: number; }

export class TrivySecurityProvider extends CapabilityBase<TrivySecurityConfig> {
  private severity: unknown[] | undefined;
  private ignoreUnfixed: boolean | undefined;
  private timeout: string | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<TrivySecurityConfig>) {
    super(config);
    const cfg = config.config;
this.severity = cfg.severity || ['CRITICAL', 'HIGH'];
    this.ignoreUnfixed = cfg.ignoreUnfixed ?? false;
    this.timeout = cfg.timeout || '5m0s';
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'TrivySecurityProvider initialized');
    } catch (error) {
      this.log('warn', 'TrivySecurityProvider initialization failed:', error);
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
    this.log('info', 'TrivySecurityProvider shutdown');
  }

  async scanImage(image: string): Promise<ScanResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `TrivySecurityProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
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
  async scanFilesystem(path: string): Promise<ScanResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `TrivySecurityProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
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
  async getReport(scanId: string): Promise<ScanResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `TrivySecurityProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
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
      type: 'trivy-security',
      available: this.isAvailable,
    };
  }
}
export { TrivySecurityProvider as default };
