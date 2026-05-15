/**
 * 📦 Native/Memory Vector Store (CapabilityBase-based)
 * 零依賴實現，適配 capabilities 層規範。
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface MemoryVectorStoreConfig {
  maxItems?: number;
}

export class MemoryVectorStore extends CapabilityBase<MemoryVectorStoreConfig> {
  private vectors: Map<string, number[]> = new Map();
  private maxItems: number;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<MemoryVectorStoreConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);
    this.maxItems = config.config.maxItems || 10000;
  }

  protected async doInitialize(): Promise<void> {
    this.log('info', 'Memory vector store (native) initialized');
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    return {
      isHealthy: true,
      status: ProviderHealthStatus.HEALTHY,
      checkTime: new Date().toISOString(),
      metrics: {},
    };
  }

  protected async doShutdown(): Promise<void> {
    this.vectors.clear();
    this.log('info', 'Memory vector store shutdown');
  }

  // 示例操作：增/查/刪（僅為說明，不包含完整向量邏輯）
  async put(key: string, vector: number[]): Promise<void> {
    if (this.vectors.size >= this.maxItems && !this.vectors.has(key)) {
      throw new Error('Max items reached');
    }
    this.vectors.set(key, vector);
  }

  async get(key: string): Promise<number[] | undefined> {
    return this.vectors.get(key);
  }

  async delete(key: string): Promise<boolean> {
    return this.vectors.delete(key);
  }

  async size(): Promise<number> {
    return this.vectors.size;
  }
}
