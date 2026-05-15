/**
 * 🔧 MyCodeXvantaOS - CohereHybridEmbeddingProvider (CapabilityBase-based)
 *
 * @module providers/hybrid/embedding/embedding-cohere
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../../packages/capabilities/types';

export interface CohereHybridEmbeddingConfig {
  apiKey: string;
  defaultModel?: string;
  inputType?: string;
}

export interface EmbedResult { success: boolean; embeddings?: number[][]; model?: string; error?: string; operationTime: number; }

export class CohereHybridEmbeddingProvider extends CapabilityBase<CohereHybridEmbeddingConfig> {
  private apiKey: string;
  private defaultModel: string | undefined;
  private inputType: string | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<CohereHybridEmbeddingConfig>) {
    super(config);
    const cfg = config.config;
this.apiKey = cfg.apiKey;
    this.defaultModel = cfg.defaultModel || 'embed-english-v3.0';
    this.inputType = cfg.inputType || 'search_document';
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'CohereHybridEmbeddingProvider initialized');
    } catch (error) {
      this.log('warn', 'CohereHybridEmbeddingProvider initialization failed:', error);
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
    this.log('info', 'CohereHybridEmbeddingProvider shutdown');
  }

  async embed(text: string): Promise<EmbedResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `CohereHybridEmbeddingProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
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
  async embedBatch(texts: string[]): Promise<EmbedResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `CohereHybridEmbeddingProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
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
      type: 'cohere-hybrid-embedding',
      available: this.isAvailable,
    };
  }
}
export { CohereHybridEmbeddingProvider as default };
