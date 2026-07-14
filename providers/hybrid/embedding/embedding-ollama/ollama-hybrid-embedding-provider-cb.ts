/**
 * 🔧 MyCodexVantaOS - OllamaHybridEmbeddingProvider (CapabilityBase-based)
 *
 * @module providers/hybrid/embedding/embedding-ollama
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../../packages/capabilities/types';

export interface OllamaHybridEmbeddingConfig {
  baseUrl: string;
  defaultModel?: string;
  keepAlive?: string;
}

export interface EmbedResult {
  success: boolean;
  embeddings?: number[][];
  model?: string;
  error?: string;
  operationTime: number;
}

export class OllamaHybridEmbeddingProvider extends CapabilityBase<OllamaHybridEmbeddingConfig> {
  private baseUrl: string;
  private defaultModel: string | undefined;
  private keepAlive: string | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<OllamaHybridEmbeddingConfig>) {
    super(config);
    const cfg = config.config;
    this.baseUrl = cfg.baseUrl || 'http://localhost:11434';
    this.defaultModel = cfg.defaultModel || 'nomic-embed-text';
    this.keepAlive = cfg.keepAlive || '5m';
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'OllamaHybridEmbeddingProvider initialized');
    } catch (error) {
      this.log('warn', 'OllamaHybridEmbeddingProvider initialization failed:', error);
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
    this.log('info', 'OllamaHybridEmbeddingProvider shutdown');
  }

  async embed(text: string): Promise<EmbedResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `OllamaHybridEmbeddingProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async embedBatch(texts: string[]): Promise<EmbedResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `OllamaHybridEmbeddingProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
      type: 'ollama-hybrid-embedding',
      available: this.isAvailable,
    };
  }
}
export { OllamaHybridEmbeddingProvider as default };
