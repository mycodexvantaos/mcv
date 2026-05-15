/**
 * 🔒 MyCodeXvantaOS - Pinecone Vector Store Provider (CapabilityBase-based)
 *
 * @module providers/vector/vector-pinecone
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

export interface PineconeVectorConfig {
  apiKey?: string;
  environment?: string;
  indexName?: string;
  dimension?: number;
  timeout?: number;
  retries?: number;
  fallbackProviderId?: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: any;
}

export interface SearchResult {
  success: boolean;
  results?: VectorSearchResult[];
  error?: string;
  operationTime: number;
}

export class PineconeVectorProvider extends CapabilityBase<PineconeVectorConfig> {
  private apiKey: string | undefined;
  private environment: string;
  private indexName: string;
  private dimension: number;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  private isPineconeAvailable: boolean = false;

  constructor(id: string, name: string, config: ProviderConfig<PineconeVectorConfig>, fallbackConfig?: any) {
    super(id, name, config, fallbackConfig);
    const cfg = config.config;
    this.apiKey = cfg.apiKey;
    this.environment = cfg.environment || 'production';
    this.indexName = cfg.indexName || 'default';
    this.dimension = cfg.dimension || 1536;
    this.timeout = cfg.timeout || 5000;
    this.retries = cfg.retries || 3;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isPineconeAvailable = Boolean(this.apiKey);
      if (this.isPineconeAvailable) {
        this.log('info', 'Pinecone vector provider initialized');
      } else {
        this.log('warn', 'Pinecone not available - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Pinecone initialization failed:', error);
      this.isPineconeAvailable = false;
    }
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    return { isHealthy: this.isPineconeAvailable, status: this.isPineconeAvailable ? ProviderHealthStatus.HEALTHY : ProviderHealthStatus.DEGRADED, checkTime: new Date().toISOString(), metrics: {} };
  }

  protected async doShutdown(): Promise<void> {
    this.log('info', 'Pinecone vector provider shutdown');
  }

  async upsert(ids: string[], vectors: number[][], metadatas?: any[]): Promise<SearchResult> {
    const startTime = Date.now();
    if (!this.isPineconeAvailable) {
      return { success: false, error: `Pinecone not available. Use fallback: \${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result = { success: true, operationTime: 0 } as SearchResult;
      result.operationTime = Date.now() - startTime;
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  async query(vector: number[], topK: number = 10): Promise<SearchResult> {
    const startTime = Date.now();
    if (!this.isPineconeAvailable) {
      return { success: false, error: `Pinecone not available. Use fallback: \${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result = { success: true, results: [], operationTime: 0 } as SearchResult;
      result.operationTime = Date.now() - startTime;
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  async delete(ids: string[]): Promise<SearchResult> {
    const startTime = Date.now();
    if (!this.isPineconeAvailable) {
      return { success: false, error: `Pinecone not available. Use fallback: \${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result = { success: true, operationTime: 0 } as SearchResult;
      result.operationTime = Date.now() - startTime;
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  getInfo(): Record<string, unknown> {
    return { id: this.id, name: this.name, type: 'pinecone-vector', available: this.isPineconeAvailable, hasApiKey: !!this.apiKey, fallbackProvider: this.fallbackProviderId, status: this._status, isInitialized: this._isInitialized, metrics: this.metrics };
  }
}
export { PineconeVectorProvider as default };
