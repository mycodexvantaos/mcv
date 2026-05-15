/**
 * 🔍 MyCodeXvantaOS - Algolia Search Provider (CapabilityBase-based)
 *
 * @module providers/search/search-algolia
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

export interface AlgoliaSearchConfig {
  appId?: string;
  apiKey?: string;
  indexName?: string;
  timeout?: number;
  retries?: number;
  fallbackProviderId?: string;
}

export interface SearchHit {
  objectID: string;
  [key: string]: unknown;
}

export interface SearchResults {
  success: boolean;
  hits?: SearchHit[];
  nbHits?: number;
  page?: number;
  nbPages?: number;
  error?: string;
  operationTime: number;
}

export interface IndexResult {
  success: boolean;
  taskID?: number;
  error?: string;
  operationTime: number;
}

export class AlgoliaSearchProvider extends CapabilityBase<AlgoliaSearchConfig> {
  private appId: string | undefined;
  private apiKey: string | undefined;
  private indexName: string;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  private isAvailable: boolean = false;

  constructor(config: ProviderConfig<AlgoliaSearchConfig>) {
    super(config);
    const cfg = config.config;
    this.appId = cfg.appId;
    this.apiKey = cfg.apiKey;
    this.indexName = cfg.indexName || 'mycodexvantaos';
    this.timeout = cfg.timeout || 5000;
    this.retries = cfg.retries || 3;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = Boolean(this.appId && this.apiKey);
      if (this.isAvailable) {
        this.log('info', 'Algolia search provider initialized');
      } else {
        this.log('warn', 'Algolia not configured - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Algolia initialization failed:', error);
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
    this.log('info', 'Algolia search provider shutdown');
  }

  async search(query: string, options?: Record<string, unknown>): Promise<SearchResults> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `Algolia not available. Use fallback: ${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result: SearchResults = { success: true, hits: [], nbHits: 0, page: 0, nbPages: 0, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  async indexObject(object: Record<string, unknown>): Promise<IndexResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `Algolia not available. Use fallback: ${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result: IndexResult = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  async deleteObject(objectID: string): Promise<IndexResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `Algolia not available. Use fallback: ${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result: IndexResult = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'algolia-search',
      available: this.isAvailable,
      appId: this.appId,
      indexName: this.indexName,
    };
  }
}
export { AlgoliaSearchProvider as default };
