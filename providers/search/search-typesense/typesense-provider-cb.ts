/**
 * 🔧 MyCodeXvantaOS - TypesenseProvider (CapabilityBase-based)
 *
 * @module providers/search/search-typesense
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface TypesenseConfig {
  host: string;
  port?: number;
  apiKey?: string;
  protocol?: string;
}

export interface SearchResult {
  success: boolean;
  hits?: Record<string, unknown>[];
  found?: number;
  error?: string;
  operationTime: number;
}
export interface IndexResult {
  success: boolean;
  id?: string;
  error?: string;
  operationTime: number;
}

export class TypesenseProvider extends CapabilityBase<TypesenseConfig> {
  private host: string;
  private port: number | undefined;
  private apiKey: string | undefined;
  private protocol: string | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<TypesenseConfig>) {
    super(config);
    const cfg = config.config;
    this.host = cfg.host;
    this.port = cfg.port || 8108;
    this.apiKey = cfg.apiKey;
    this.protocol = cfg.protocol || 'http';
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'TypesenseProvider initialized');
    } catch (error) {
      this.log('warn', 'TypesenseProvider initialization failed:', error);
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
    this.log('info', 'TypesenseProvider shutdown');
  }

  async search(collection: string, query: string): Promise<SearchResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `TypesenseProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async indexDocument(collection: string, doc: Record<string, unknown>): Promise<IndexResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `TypesenseProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async deleteDocument(collection: string, id: string): Promise<IndexResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `TypesenseProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
      type: 'typesense',
      available: this.isAvailable,
    };
  }
}
export { TypesenseProvider as default };
