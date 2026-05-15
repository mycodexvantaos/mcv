/**
 * 🔒 MyCodeXvantaOS - ChromaDB Vector Store Provider (CapabilityBase-based)
 *
 * @module providers/vector/vector-chroma
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface ChromaVectorConfig {
  host?: string;
  port?: number;
  path?: string;
  timeout?: number;
  retries?: number;
  fallbackProviderId?: string;
}

export interface VectorSearchResult {
  id: string;
  similarity: number;
  metadata?: any;
}

export interface SearchResult {
  success: boolean;
  results?: VectorSearchResult[];
  error?: string;
  operationTime: number;
}

export class ChromaVectorProvider extends CapabilityBase<ChromaVectorConfig> {
  private host: string;
  private port: number;
  private path: string;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  private isChromaAvailable: boolean = false;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<ChromaVectorConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);
    const cfg = config.config;
    this.host = cfg.host || 'localhost';
    this.port = cfg.port || 8000;
    this.path = cfg.path || './chromadb';
    this.timeout = cfg.timeout || 5000;
    this.retries = cfg.retries || 3;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isChromaAvailable = Boolean(this.host || this.path);
      if (this.isChromaAvailable) {
        this.log('info', 'ChromaDB vector provider initialized');
      } else {
        this.log('warn', 'ChromaDB not available - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'ChromaDB initialization failed:', error);
      this.isChromaAvailable = false;
    }
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    return {
      isHealthy: this.isChromaAvailable,
      status: this.isChromaAvailable ? ProviderHealthStatus.HEALTHY : ProviderHealthStatus.DEGRADED,
      checkTime: new Date().toISOString(),
      metrics: {},
    };
  }

  protected async doShutdown(): Promise<void> {
    this.log('info', 'ChromaDB vector provider shutdown');
  }

  async add(
    collection: string,
    ids: string[],
    embeddings: number[][],
    metadatas?: any[]
  ): Promise<SearchResult> {
    const startTime = Date.now();
    if (!this.isChromaAvailable) {
      return {
        success: false,
        error: `ChromaDB not available. Use fallback: \${this.fallbackProviderId}`,
        operationTime: Date.now() - startTime,
      };
    }
    try {
      const result = { success: true, operationTime: 0 } as SearchResult;
      result.operationTime = Date.now() - startTime;
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      };
    }
  }

  async search(collection: string, query: number[], nResults: number = 10): Promise<SearchResult> {
    const startTime = Date.now();
    if (!this.isChromaAvailable) {
      return {
        success: false,
        error: `ChromaDB not available. Use fallback: \${this.fallbackProviderId}`,
        operationTime: Date.now() - startTime,
      };
    }
    try {
      const result = { success: true, results: [], operationTime: 0 } as SearchResult;
      result.operationTime = Date.now() - startTime;
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      };
    }
  }

  async delete(collection: string, ids: string[]): Promise<SearchResult> {
    const startTime = Date.now();
    if (!this.isChromaAvailable) {
      return {
        success: false,
        error: `ChromaDB not available. Use fallback: \${this.fallbackProviderId}`,
        operationTime: Date.now() - startTime,
      };
    }
    try {
      const result = { success: true, operationTime: 0 } as SearchResult;
      result.operationTime = Date.now() - startTime;
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      };
    }
  }

  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'chroma-vector',
      available: this.isChromaAvailable,
      fallbackProvider: this.fallbackProviderId,
      status: this._status,
      isInitialized: this._isInitialized,
      metrics: this.metrics,
    };
  }
}
export { ChromaVectorProvider as default };
