/**
 * 📦 Hybrid/Embedding Provider (CapabilityBase-based)
 * 支持外部（如 OpenAI 嵌入調用） + 本地 fallback（例如簡單的詞頻/哈希向量佔位）。
 * 作為如何實現 Hybrid fallback 的模板。
 */

import {
  CapabilityBase,
} from '../../../packages/capabilities/base';
import type {
  ProviderConfig, FallbackConfig,
  ProviderHealthCheckResult, ProviderHealthStatus
} from '../../../packages/capabilities/types';

export interface HybirdEmbeddingConfig {
  externalApiKey?: string;
  externalBaseUrl?: string;
  externalModel?: string;
  enableNativeFallback?: boolean;
}

// 這裡不引入具體嵌入庫，僅作結構示意
class NativeEmbeddingClient {
  // 簡單的偽向量實現（實際可使用本地的詞向量/哈希向量化）
  static async embed(text: string): Promise<number[]> {
    const arr = Array.from({ length: 128 }, () => Math.random());
    return arr;
  }
}

export class HybridEmbeddingProvider extends CapabilityBase<HybirdEmbeddingConfig> {
  private externalClient: any = null; // 若有 OpenAI 等 SDK 則在此初始化
  private enableNativeFallback: boolean;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<HybirdEmbeddingConfig>,
    fallbackConfig?: FallbackConfig
  ) {
    super(id, name, config, fallbackConfig);
    this.enableNativeFallback = config.config.enableNativeFallback ?? true;
  }

  protected async doInitialize(): Promise<void> {
    const cfg = this.config.config;
    if (!cfg.externalApiKey) {
      this.log('warn', 'External API key not provided, will fallback to native if enabled');
    }
    // TODO: 初始化外部客戶端（如 OpenAI 的嵌入端點）
    // this.externalClient = new OpenAI({ apiKey: cfg.externalApiKey, baseURL: cfg.externalBaseUrl });
    this.log('info', 'Hybrid embedding provider initialized');
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    if (!this.config.config.externalApiKey) {
      return {
        isHealthy: this.enableNativeFallback,
        status: this.enableNativeFallback ? ProviderHealthStatus.DEGRADED : ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: { lastError: 'External API key missing, native fallback available' },
      };
    }
    try {
      // TODO: 發起健康檢查
      // const start = Date.now();
      // await this.externalClient.embeddings.create({ input: 'health', model: this.config.config.externalModel });
      // const latency = Date.now() - start;
      // return { isHealthy: true, status: ProviderHealthStatus.HEALTHY, checkTime: new Date().toISOString(), metrics: { latency } };
      return {
        isHealthy: true,
        status: ProviderHealthStatus.HEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {},
      };
    } catch (e: any) {
      return {
        isHealthy: this.enableNativeFallback,
        status: this.enableNativeFallback ? ProviderHealthStatus.DEGRADED : ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: { lastError: String(e) },
      };
    }
  }

  protected async doShutdown(): Promise<void> {
    if (this.externalClient) {
      // TODO: 若 SDK 提供 cleanup 則調用
      // this.externalClient = null;
    }
    this.log('info', 'Hybrid embedding provider shutdown');
  }

  // 示例方法：嵌入文本（先 External，失敗按 fallback 配置回退 Native）
  async embed(text: string): Promise<number[]> {
    if (!this.externalClient || !this.config.config.externalApiKey) {
      if (this.enableNativeFallback) {
        this.log('warn', 'Falling back to native embedding (external unavailable)');
        return NativeEmbeddingClient.embed(text);
      }
      throw new Error('External embedding unavailable and native fallback disabled');
    }

    try {
      // TODO: 調用外部 API 進行嵌入
      // const start = Date.now();
      // const response = await this.externalClient.embeddings.create({ input: text, model: this.config.config.externalModel });
      // this.recordSuccess(Date.now() - start);
      // return response.data[0].embedding;
      this.recordSuccess(50); // 佔位
      return Array.from({ length: 128 }, () => 0.5); // 佔位
    } catch (error) {
      this.recordFailure(error);
      if (this.shouldTriggerFallback() && this.enableNativeFallback) {
        this.recordFallback(this.id, 'native-fallback-embedding');
        return NativeEmbeddingClient.embed(text);
      }
      throw error;
    }
  }
}