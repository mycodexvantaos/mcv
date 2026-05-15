/**
 * 🔧 MyCodeXvantaOS - OpenAIHybridEmbeddingProvider (CapabilityBase-based)
 *
 * @module providers/hybrid/embedding/embedding-openai
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../../packages/capabilities/types';

export interface OpenAIHybridEmbeddingConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  batchSize?: number;
}

export interface EmbedResult { success: boolean; embeddings?: number[][]; model?: string; error?: string; operationTime: number; }

export class OpenAIHybridEmbeddingProvider extends CapabilityBase<OpenAIHybridEmbeddingConfig> {
  private apiKey: string;
  private baseUrl: string | undefined;
  private defaultModel: string | undefined;
  private batchSize: number | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<OpenAIHybridEmbeddingConfig>) {
    super(config);
    const cfg = config.config;
this.apiKey = cfg.apiKey;
    this.baseUrl = cfg.baseUrl || 'https://api.openai.com/v1';
    this.defaultModel = cfg.defaultModel || 'text-embedding-3-small';
    this.batchSize = cfg.batchSize || 100;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'OpenAIHybridEmbeddingProvider initialized');
    } catch (error) {
      this.log('warn', 'OpenAIHybridEmbeddingProvider initialization failed:', error);
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
    this.log('info', 'OpenAIHybridEmbeddingProvider shutdown');
  }

  async embed(text: string): Promise<EmbedResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `OpenAIHybridEmbeddingProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
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
      return { success: false, error: `OpenAIHybridEmbeddingProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
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
      type: 'openai-hybrid-embedding',
      available: this.isAvailable,
    };
  }
}
export { OpenAIHybridEmbeddingProvider as default };
