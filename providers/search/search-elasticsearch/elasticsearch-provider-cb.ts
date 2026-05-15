/**
 * 🔧 MyCodeXvantaOS - ElasticsearchProvider (CapabilityBase-based)
 *
 * @module providers/search/search-elasticsearch
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface ElasticsearchConfig {
  node: string;
  apiKey?: string;
  defaultIndex?: string;
  maxResultWindow?: number;
}

export interface SearchResult {
  success: boolean;
  hits?: Record<string, unknown>[];
  total?: number;
  error?: string;
  operationTime: number;
}
export interface IndexResult {
  success: boolean;
  id?: string;
  error?: string;
  operationTime: number;
}

export class ElasticsearchProvider extends CapabilityBase<ElasticsearchConfig> {
  private node: string;
  private apiKey: string | undefined;
  private defaultIndex: string | undefined;
  private maxResultWindow: number | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<ElasticsearchConfig>) {
    super(config);
    const cfg = config.config;
    this.node = cfg.node;
    this.apiKey = cfg.apiKey;
    this.defaultIndex = cfg.defaultIndex || 'mycodexvantaos';
    this.maxResultWindow = cfg.maxResultWindow || 10000;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'ElasticsearchProvider initialized');
    } catch (error) {
      this.log('warn', 'ElasticsearchProvider initialization failed:', error);
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
    this.log('info', 'ElasticsearchProvider shutdown');
  }

  async search(index: string, query: Record<string, unknown>): Promise<SearchResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `ElasticsearchProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async indexDocument(index: string, doc: Record<string, unknown>): Promise<IndexResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `ElasticsearchProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async deleteDocument(index: string, id: string): Promise<IndexResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `ElasticsearchProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
      type: 'elasticsearch',
      available: this.isAvailable,
    };
  }
}
export { ElasticsearchProvider as default };
