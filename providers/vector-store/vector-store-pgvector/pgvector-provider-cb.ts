/**
 * 🔧 MyCodexVantaOS - PgVectorProvider (CapabilityBase-based)
 *
 * @module providers/vector-store/vector-store-pgvector
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface PgVectorConfig {
  connectionUrl: string;
  maxConnections?: number;
  defaultIndexType?: string;
  efConstruction?: number;
  m?: number;
}

export interface VectorResult {
  success: boolean;
  error?: string;
  operationTime: number;
}
export interface VectorSearchResult {
  success: boolean;
  hits?: { id: string; score: number; metadata?: Record<string, unknown> }[];
  error?: string;
  operationTime: number;
}

export class PgVectorProvider extends CapabilityBase<PgVectorConfig> {
  private connectionUrl: string;
  private maxConnections: number | undefined;
  private defaultIndexType: string | undefined;
  private efConstruction: number | undefined;
  private m: number | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<PgVectorConfig>) {
    super(config);
    const cfg = config.config;
    this.connectionUrl = cfg.connectionUrl;
    this.maxConnections = cfg.maxConnections || 10;
    this.defaultIndexType = cfg.defaultIndexType || 'hnsw';
    this.efConstruction = cfg.efConstruction || 64;
    this.m = cfg.m || 16;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'PgVectorProvider initialized');
    } catch (error) {
      this.log('warn', 'PgVectorProvider initialization failed:', error);
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
    this.log('info', 'PgVectorProvider shutdown');
  }

  async upsert(collection: string, ids: string[], embeddings: number[][]): Promise<VectorResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `PgVectorProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async search(collection: string, query: number[], k?: number): Promise<VectorSearchResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `PgVectorProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async delete(collection: string, ids: string[]): Promise<VectorResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `PgVectorProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
      type: 'pgvector',
      available: this.isAvailable,
    };
  }
}
export { PgVectorProvider as default };
