/**
 * 📦 External/OpenAI Model Provider (CapabilityBase-based)
 * 適配原有 packages/adapters/openai 至 capabilities 層範圍。
 * 本實現僅做結構適配，不影響既有業務邏輯。
 *
 * TODO：
 * - 接入真正的 OpenAI 交互邏輯（如 packages/adapters/openai/index.ts）
 * - 完成健康檢查與 shutdown 清理
 * - 添加指標收集與結構化日誌
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

export interface OpenAIModelConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  timeout?: number;
  fallbackThreshold?: number;
}

export class OpenAIModelProvider extends CapabilityBase<OpenAIModelConfig> {
  private client: any = null; // 實際類型按具體 SDK 注入

  constructor(config: ProviderConfig<OpenAIModelConfig>) {
    super(config);
  }

  protected async doInitialize(): Promise<void> {
    const cfg = this.config.config;
    if (!cfg.apiKey) {
      this.log('warn', 'OpenAI API key not provided (possibly using native fallback)');
    }
    // TODO: 初始化真實的 OpenAI 客戶端
    // this.client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL });
    this.log('info', 'OpenAI model provider initialized');
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    if (!this.config.config.apiKey) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.DEGRADED,
        checkTime: new Date().toISOString(),
        metrics: {},
      };
    }
    try {
      // TODO: 執行一個低成本的健康檢測調用（無需真實執行即可）
      // const start = Date.now();
      // await this.client.models.list();
      // const latency = Date.now() - start;
      // return {
      //   isHealthy: true,
      //   status: ProviderHealthStatus.HEALTHY,
      //   checkTime: new Date().toISOString(),
      //   metrics: { latency },
      // };

      // 佔位返回（直至實際實現）
      return {
        isHealthy: true,
        status: ProviderHealthStatus.HEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {},
      };
    } catch (e: any) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {},
      };
    }
  }

  protected async doShutdown(): Promise<void> {
    if (this.client) {
      // TODO: 若 SDK 提供 cleanup 則調用
      // this.client = null;
    }
    this.log('info', 'OpenAI model provider shutdown');
  }
}
