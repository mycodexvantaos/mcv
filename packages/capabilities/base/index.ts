/**
 * 🏢 MyCodeXvantaOS - Capabilities Layer - Capability Base Interface
 *
 * 🎯 目的：
 * 提供統一的 Provider 抽象接口，確保所有 Provider 實現一致的生命週期管理
 * 支援 Runtime Mode 切換、健康檢查、自動 fallback 等核心特性
 *
 * 📌 設計原則：
 * - 所有 Provider 必須實現 CapabilityBase 接口
 * - Native Provider: 零外部依賴，完全離線運作
 * - External Provider: 需要外部 API，有 Native fallback
 * - Hybrid Provider: External first，自動 fallback 到 Native
 *
 * @module packages/capabilities/base
 * @version 1.0.0
 */

import { ProviderHealthStatus } from '../types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
  ProviderMetrics,
  FallbackConfig,
} from '../types';

/**
 * 🏛️ CapabilityBase<T> - Provider 抽象基類
 *
 * 所有 Provider 必須實現此接口，確保一致的生命週期管理。
 *
 * @template T - Provider 特定配置類型
 *
 * @example
 * ```typescript
 * class NativeVectorStore extends CapabilityBase<VectorStoreConfig> {
 *   async initialize(): Promise<void> {
 *     // 初始化邏輯
 *   }
 *
 *   async healthCheck(): Promise<ProviderHealthCheckResult> {
 *     // 健康檢查邏輯
 *   }
 *
 *   async shutdown(): Promise<void> {
 *     // 清理邏輯
 *   }
 * }
 * ```
 */
export abstract class CapabilityBase<T = unknown> {
  /**
   * 🔍 Provider 唯一標識符
   */
  protected readonly id: string;

  /**
   * 🏷️ Provider 名稱
   */
  protected readonly name: string;

  /**
   * ⚙️ Provider 配置
   */
  protected config: ProviderConfig<T>;

  /**
   * 💖 Provider 當前健康狀態
   */
  protected _status: ProviderHealthStatus = ProviderHealthStatus.UNKNOWN;

  /**
   * 📊 Provider 指標
   */
  protected metrics: ProviderMetrics = {
    invocationCount: 0,
    successCount: 0,
    failureCount: 0,
    fallbackCount: 0,
    avgLatency: 0,
    lastInvocation: '',
    lastProviderId: '',
  };

  /**
   * 🛡️ Fallback 配置
   */
  protected fallbackConfig?: FallbackConfig;

  /**
   * ✅ 是否已初始化
   */
  protected _isInitialized: boolean = false;

  /**
   * 🔌 是否正在初始化
   */
  protected _isInitializing: boolean = false;

  /**
   * 💥 是否正在關閉
   */
  protected _isShuttingDown: boolean = false;

  /**
   * 🕒 最後健康檢查時間
   */
  protected lastHealthCheckTime?: string;

  /**
   * 📈 連續錯誤計數（用於自動 fallback）
   */
  protected consecutiveFailureCount: number = 0;

  /**
   * 📊 自定義指標存儲
   */
  protected customMetrics: Map<string, number> = new Map();

  /**
   * 🏗️ 構造函數
   *
   * 支援兩種呼叫模式：
   * 1. 四參數模式：super(id, name, config, fallbackConfig) — P1/P2 風格
   * 2. 單參數模式：super(config) — P3 風格，從 ProviderConfig 中提取 id/name/fallback
   *
   * @param idOrConfig - Provider 唯一標識符 或 完整的 ProviderConfig
   * @param name - Provider 名稱（當第一個參數為 string 時使用）
   * @param config - Provider 配置（當第一個參數為 string 時使用）
   * @param fallbackConfig - （可選）Fallback 配置
   */
  constructor(
    idOrConfig: string | ProviderConfig<T>,
    name?: string,
    config?: ProviderConfig<T>,
    fallbackConfig?: FallbackConfig
  ) {
    if (typeof idOrConfig === 'string') {
      // P1/P2 風格：super(id, name, config, fallbackConfig)
      this.id = idOrConfig;
      this.name = name || idOrConfig;
      this.config = config!;
      this.fallbackConfig = fallbackConfig;
    } else {
      // P3 風格：super(config) — 從 ProviderConfig 中提取
      const providerConfig = idOrConfig;
      this.id = providerConfig.id;
      this.name = providerConfig.name || providerConfig.id;
      this.config = providerConfig;
      this.fallbackConfig = providerConfig.fallback || fallbackConfig;
    }
  }

  /**
   * 🔍 獲取 Provider ID
   */
  get providerId(): string {
    return this.id;
  }

  /**
   * 🏷️ 獲取 Provider 名稱
   */
  get providerName(): string {
    return this.name;
  }

  /**
   * ⚙️ 獲取配置
   */
  getConfig(): ProviderConfig<T> {
    return this.config;
  }

  /**
   * ✅ 檢查是否已初始化
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 💥 檢查是否正在關閉
   */
  isShuttingDown(): boolean {
    return this._isShuttingDown;
  }

  /**
   * 💖 獲取當前健康狀態
   */
  get status(): ProviderHealthStatus {
    return this._status;
  }

  /**
   * 📊 獲取指標
   */
  getMetrics(): ProviderMetrics {
    return { ...this.metrics };
  }

  /**
   * 🔄 初始化 Provider
   *
   * 📌 生命周期：
   * 1. 檢查是否已初始化 → 如已初始化則跳過
   * 2. 設置 `_isInitializing` 標誌
   * 3. 調用 `doInitialize()` 實際初始化邏輯
   * 4. 更新狀態為 HEALTHY
   * 5. 清除 `_isInitializing` 標誌
   *
   * @throws 如果初始化失敗
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    if (this._isInitializing) {
      throw new Error(`Provider ${this.id} is already initializing`);
    }

    if (this._isShuttingDown) {
      throw new Error(`Provider ${this.id} is shutting down`);
    }

    this._isInitializing = true;

    try {
      await this.doInitialize();

      this._status = ProviderHealthStatus.HEALTHY;
      this._isInitialized = true;
      this.log('info', `Provider ${this.name} (${this.id}) initialized successfully`);
    } catch (error) {
      this._status = ProviderHealthStatus.UNHEALTHY;
      this.log('error', `Provider ${this.name} (${this.id}) initialization failed:`, error);
      throw error;
    } finally {
      this._isInitializing = false;
    }
  }

  /**
   * 🔍 執行健康檢查
   *
   * 📌 生命周期：
   * 1. 檢查是否已初始化
   * 2. 記錄檢查時間
   * 3. 調用 `doHealthCheck()` 實際檢查邏輯
   * 4. 更新健康狀態
   * 5. 返回檢查結果
   *
   * @returns 健康檢查結果
   */
  async healthCheck(): Promise<ProviderHealthCheckResult> {
    const checkTime = new Date().toISOString();
    let isHealthy = false;
    let status: ProviderHealthStatus = ProviderHealthStatus.UNKNOWN;

    try {
      if (!this._isInitialized) {
        throw new Error('Provider is not initialized');
      }

      if (this._isShuttingDown) {
        status = ProviderHealthStatus.DEGRADED;
        throw new Error('Provider is shutting down');
      }

      const result = await this.doHealthCheck();

      isHealthy = result.isHealthy;
      status = result.status;
      this._status = status;

      this.lastHealthCheckTime = checkTime;

      return {
        isHealthy,
        status,
        checkTime,
        metrics: {
          ...result.metrics,
          errorCount: this.metrics.failureCount,
        },
      };
    } catch (error) {
      isHealthy = false;
      status = ProviderHealthStatus.UNHEALTHY;
      this._status = status;
      this.lastHealthCheckTime = checkTime;

      this.log('warn', `Provider ${this.name} (${this.id}) health check failed:`, error);

      return {
        isHealthy,
        status,
        checkTime,
        metrics: {
          errorCount: this.metrics.failureCount,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * 💥 關閉 Provider
   *
   * 📌 生命周期：
   * 1. 設置 `_isShuttingDown` 標誌
   * 2. 停止健康檢查定時器
   * 3. 調用 `doShutdown()` 實際清理邏輯
   * 4. 更新狀態為 UNKNOWN
   *
   * @throws 如果關閉失敗
   */
  async shutdown(): Promise<void> {
    if (this._isShuttingDown) {
      return;
    }

    if (!this._isInitialized) {
      throw new Error(`Provider ${this.id} is not initialized`);
    }

    this._isShuttingDown = true;

    try {
      await this.doShutdown();

      this._status = ProviderHealthStatus.UNKNOWN;
      this._isInitialized = false;
      this.log('info', `Provider ${this.name} (${this.id}) shutdown successfully`);
    } catch (error) {
      this.log('error', `Provider ${this.name} (${this.id}) shutdown failed:`, error);
      throw error;
    } finally {
      this._isShuttingDown = false;
    }
  }

  /**
   * 🔄 記錄成功調用
   *
   * @param latency - 延遲（毫秒）
   */
  protected recordSuccess(latency: number): void {
    this.metrics.invocationCount++;
    this.metrics.successCount++;
    this.metrics.avgLatency = this.calculateAvgLatency(latency);
    this.metrics.lastInvocation = new Date().toISOString();
    this.metrics.lastProviderId = this.id;
    this.consecutiveFailureCount = 0;
  }

  /**
   * 💥 記錄失敗調用
   *
   * @param error - 錯誤對象
   */
  protected recordFailure(error: unknown): void {
    this.metrics.invocationCount++;
    this.metrics.failureCount++;
    this.metrics.lastInvocation = new Date().toISOString();
    this.metrics.lastProviderId = this.id;
    this.consecutiveFailureCount++;

    this.log('error', `Provider ${this.name} (${this.id}) invocation failed:`, error);
  }

  /**
   * 🔄 記錄 fallback 切換
   *
   * @param fromProvider - 源 Provider ID
   * @param toProvider - 目標 Provider ID
   */
  protected recordFallback(fromProvider: string, toProvider: string): void {
    this.metrics.fallbackCount++;
    this.metrics.lastInvocation = new Date().toISOString();
    this.metrics.lastProviderId = toProvider;

    this.log(
      'warn',
      `Fallback triggered: ${fromProvider} → ${toProvider}` +
        ` (consecutive failures: ${this.consecutiveFailureCount})`
    );
  }

  /**
   * 📊 記錄自定義指標
   *
   * 用於 Provider 特定的業務指標追蹤，例如：
   * - 上傳/下載位元組數
   * - TTS/STT 調用次數
   * - 圖像生成次數
   * - 聊天完成次數
   *
   * @param metricName - 指標名稱（如 'upload', 'tts', 'chat_complete'）
   * @param value - 指標值（通常為 1 計數或位元組大小）
   */
  protected recordMetric(metricName: string, value: number): void {
    const current = this.customMetrics.get(metricName) || 0;
    this.customMetrics.set(metricName, current + value);

    this.metrics.lastInvocation = new Date().toISOString();
    this.metrics.lastProviderId = this.id;
  }

  /**
   * 📊 獲取自定義指標
   *
   * @returns 自定義指標的快照
   */
  getCustomMetrics(): Record<string, number> {
    return Object.fromEntries(this.customMetrics);
  }

  /**
   * 📊 計算平均延遲
   *
   * @param newLatency - 新延遲值
   * @returns 平均延遲
   */
  private calculateAvgLatency(newLatency: number): number {
    const count = this.metrics.invocationCount;
    if (count === 1) {
      return newLatency;
    }

    const currentAvg = this.metrics.avgLatency || 0;
    return (currentAvg * (count - 1) + newLatency) / count;
  }

  /**
   * 🤔 應該觸發 fallback？
   *
   * @returns 是否應該觸發 fallback
   */
  shouldTriggerFallback(): boolean {
    if (!this.fallbackConfig || !this.fallbackConfig.enabled) {
      return false;
    }

    const threshold = this.fallbackConfig.retryCount || 3;
    return this.consecutiveFailureCount >= threshold;
  }

  /**
   * 🔍 執行健康檢查（子類實現）
   *
   * 子類必須實現此方法，返回 Provider 的當前健康狀態。
   *
   * @returns 健康檢查結果
   */
  protected abstract doHealthCheck(): Promise<ProviderHealthCheckResult>;

  /**
   * 🔄 初始化 Provider（子類實現）
   *
   * 子類必須實現此方法，執行 Provider 的初始化邏輯。
   */
  protected abstract doInitialize(): Promise<void>;

  /**
   * 💥 關閉 Provider（子類實現）
   *
   * 子類必須實現此方法，執行 Provider 的清理邏輯。
   */
  protected abstract doShutdown(): Promise<void>;

  /**
   * 📝 日誌輔助方法
   *
   * @param level - 日誌級別
   * @param message - 消息
   * @param data - 可選數據
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.id}]`;

    if (level === 'error') {
      console.error(prefix, message, data);
    } else if (level === 'warn') {
      console.warn(prefix, message, data);
    } else {
      console.log(prefix, message, data);
    }
  }
}

/**
 * ✨ Export CapabilityBase
 */
export { CapabilityBase as default };
