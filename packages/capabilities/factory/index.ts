/**
 * 🏢 MyCodexVantaOS - Capabilities Layer - Provider Factory
 *
 * 🎯 目的：
 * 提供統一的 Provider 創建和選擇機制，支援 Runtime Mode 自動切換
 * 確保根據運行時環境選擇最合適的 Provider
 *
 * 📌 功能：
 * - 根據 RuntimeMode 自動選擇 Provider
 * - 支持 Native/External/Hybrid Provider 切換
 * - 自動 fallback 機制（External → Native）
 * - 網絡狀態檢測（AUTO 模式）
 * - 結構化日誌記錄
 *
 * @module packages/capabilities/factory
 * @version 1.0.0
 */

import { CapabilityBase } from '../base';
import { RuntimeMode, ProviderHealthStatus } from '../types';
import type { ProviderConfig, FallbackConfig, NetworkStatus } from '../types';

/**
 * 🏭 ProviderFactory - Provider 工廠類
 *
 * 負責創建和管理 Provider 實例：
 * - 根据 RuntimeMode 自動選擇 Provider
 * - 支持主 Provider 和 fallback Provider
 * - 自動處理 fallback 邏輯和日誌記錄
 * - 監控網絡狀態（AUTO 模式）
 *
 * @template T - Provider 類型
 */
export class ProviderFactory<T extends CapabilityBase> {
  /**
   * 🏷️ Factory 名稱
   */
  private readonly name: string;

  /**
   * 📋 註冊的 Provider 列表
   */
  private providers: Map<string, ProviderConfig>;

  /**
   * ♻️ 活躍的 Provider 實例
   */
  private activeProviders: Map<string, T>;

  /**
   * 🏷️ 當前 Runtime Mode
   */
  private currentMode: RuntimeMode;

  /**
   * 📡 當前網絡狀態
   */
  private networkStatus?: NetworkStatus;

  /**
   * 🔄 是否啟用自動 fallback
   */
  private enableAutoFallback: boolean;

  /**
   * ⏰ 健康檢查定時器
   */
  private healthCheckTimer?: NodeJS.Timeout;

  /**
   * ⏰ 網絡檢測定時器
   */
  private networkCheckTimer?: NodeJS.Timeout;

  /**
   * 🏗️ 構造函數
   *
   * @param name - Factory 名稱
   * @param mode - 初始 Runtime Mode
   * @param enableAutoFallback - 是否啟用自動 fallback
   */
  constructor(
    name: string,
    mode: RuntimeMode = RuntimeMode.AUTO,
    enableAutoFallback: boolean = true
  ) {
    this.name = name;
    this.providers = new Map();
    this.activeProviders = new Map();
    this.currentMode = mode;
    this.enableAutoFallback = enableAutoFallback;
  }

  /**
   * 🆔 註冊 Provider
   *
   * @param config - Provider 配置
   */
  registerProvider(config: ProviderConfig): void {
    const { id } = config;

    if (this.providers.has(id)) {
      throw new Error(`Provider ${id} is already registered`);
    }

    this.providers.set(id, config);
    this.log('info', `Provider ${id} registered in factory ${this.name}`);
  }

  /**
   * 🗑️ 取消註冊 Provider
   *
   * @param id - Provider ID
   */
  unregisterProvider(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`Provider ${id} is not registered`);
    }

    // 先關閉活躍的實例
    const activeProvider = this.activeProviders.get(id);
    if (activeProvider) {
      activeProvider.shutdown().catch((error) => {
        this.log('error', `Failed to shutdown provider ${id}:`, error);
      });
      this.activeProviders.delete(id);
    }

    this.providers.delete(id);
    this.log('info', `Provider ${id} unregistered from factory ${this.name}`);
  }

  /**
   * 🔍 獲取 Provider 配置
   *
   * @param id - Provider ID
   * @returns Provider 配置
   */
  getProviderConfig(id: string): ProviderConfig | undefined {
    return this.providers.get(id);
  }

  /**
   * 📋 獲取所有 Provider 配置
   *
   * @returns Provider 配置列表
   */
  getAllProviderConfigs(): ProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * 🔄 切換 Runtime Mode
   *
   * @param mode - 新的 Runtime Mode
   */
  setRuntimeMode(mode: RuntimeMode): void {
    if (this.currentMode === mode) {
      return;
    }

    this.log('info', `Runtime mode switched: ${this.currentMode} → ${mode}`);
    this.currentMode = mode;

    // 清理活躍的 Provider 實例（因為選擇邏輯可能改變）
    this.activeProviders.forEach((provider, id) => {
      provider.shutdown().catch((error) => {
        this.log('error', `Failed to shutdown provider ${id} during mode switch:`, error);
      });
    });
    this.activeProviders.clear();
  }

  /**
   * 🎛️ 獲取當前 Runtime Mode
   *
   * @returns Runtime Mode
   */
  getRuntimeMode(): RuntimeMode {
    return this.currentMode;
  }

  /**
   * 📡 更新網絡狀態
   *
   * @param status - 網絡狀態
   */
  updateNetworkStatus(status: NetworkStatus): void {
    this.networkStatus = status;
    this.log('debug', `Network status updated: ${status.isOnline ? 'ONLINE' : 'OFFLINE'}`);

    // AUTO 模式下，根據網絡狀態自動切換 Provider
    if (this.currentMode === RuntimeMode.AUTO) {
      this.activeProviders.forEach((provider, id) => {
        provider.shutdown().catch((error) => {
          this.log(
            'error',
            `Failed to shutdown provider ${id} during network status update:`,
            error
          );
        });
      });
      this.activeProviders.clear();
    }
  }

  /**
   * 🏭 創建 Provider
   *
   * 根據 RuntimeMode 和配置選擇最合適的 Provider：
   * - NATIVE: 選擇 native Provider
   * - CONNECTED: 選擇 external Provider
   * - HYBRID: 選擇 external Provider（帶 fallback）
   * - AUTO: 根據網絡狀態選擇
   *
   * @param capabilityId - 能力 ID
   * @param providerConstructor - Provider 構造函數
   * @param fallbackConstructor - Fallback Provider 構造函數
   * @returns Provider 實例
   */
  async createProvider(
    capabilityId: string,
    providerConstructor: new (config: ProviderConfig, fallbackConfig?: FallbackConfig) => T,
    fallbackConstructor?: new (config: ProviderConfig) => T
  ): Promise<T> {
    const effectiveMode = this.getEffectiveMode();

    // 1. 根據模式選擇 Provider
    const selectedProviders = this.selectProviders(capabilityId, effectiveMode);

    if (selectedProviders.primary === undefined) {
      throw new Error(`No provider found for capability ${capabilityId} in mode ${effectiveMode}`);
    }

    // 2. 檢查是否已有活躍的實例
    const activeProvider = this.activeProviders.get(selectedProviders.primary.id);
    if (activeProvider) {
      return activeProvider;
    }

    // 3. 設置 fallback 配置
    const fallbackConfig: FallbackConfig | undefined = selectedProviders.fallback
      ? {
          enabled: this.enableAutoFallback,
          providerId: selectedProviders.fallback.id,
          retryCount:
            ((selectedProviders.fallback.config as Record<string, unknown>)
              .fallbackThreshold as number) || 3,
          retryDelay: 1000,
          logFallback: true,
        }
      : undefined;

    // 4. 創建 Provider 實例
    const providerInstance = new providerConstructor(selectedProviders.primary, fallbackConfig);

    // 5. 初始化 Provider
    await providerInstance.initialize();

    // 6. 註冊到活躍列表
    this.activeProviders.set(selectedProviders.primary.id, providerInstance);

    // 7. 啟動健康檢查定時器
    this.startHealthCheck(providerInstance);

    this.log(
      'info',
      `Provider created: ${selectedProviders.primary.id} ` +
        `(mode: ${effectiveMode}` +
        (selectedProviders.fallback ? `, fallback: ${selectedProviders.fallback.id}` : '') +
        ')'
    );

    return providerInstance;
  }

  /**
   * 🔍 獲取活躍的 Provider
   *
   * @param id - Provider ID
   * @returns Provider 實例
   */
  getActiveProvider(id: string): T | undefined {
    return this.activeProviders.get(id);
  }

  /**
   * 📋 獲取所有活躍的 Provider
   *
   * @returns Provider 實例列表
   */
  getActiveProviders(): T[] {
    return Array.from(this.activeProviders.values());
  }

  /**
   * 🛡️ 設置是否啟用自動 fallback
   *
   * @param enabled - 是否啟用
   */
  setAutoFallback(enabled: boolean): void {
    this.enableAutoFallback = enabled;
    this.log('info', `Auto fallback ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 🧹 關閉所有 Provider
   */
  async shutdown(): Promise<void> {
    // 停止定時器
    this.stopHealthCheck();
    this.stopNetworkCheck();

    // 關閉所有活躍的 Provider
    const shutdownPromises = Array.from(this.activeProviders.values()).map((provider) =>
      provider.shutdown()
    );

    await Promise.allSettled(shutdownPromises);

    this.activeProviders.clear();
    this.log('info', `Factory ${this.name} shutdown completed`);
  }

  /**
   * 🎯 獲取有效的 Runtime Mode
   *
   * @returns Runtime Mode
   */
  private getEffectiveMode(): RuntimeMode {
    if (this.currentMode === RuntimeMode.AUTO) {
      // 如果是 AUTO 模式，根據網絡狀態決定
      if (this.networkStatus?.isOnline) {
        return RuntimeMode.CONNECTED;
      } else {
        return RuntimeMode.NATIVE;
      }
    }

    return this.currentMode;
  }

  /**
   * 🔍選擇 Provider
   *
   * 根據 RuntimeMode 選擇主 Provider 和 fallback Provider：
   *
   * @param capabilityId - 能力 ID
   * @param mode - Runtime Mode
   * @returns 主 Provider 和 fallback Provider
   */
  private selectProviders(
    capabilityId: string,
    mode: RuntimeMode
  ): { primary?: ProviderConfig; fallback?: ProviderConfig } {
    // 根據 mode 選擇 Provider
    const candidates = Array.from(this.providers.values()).filter(
      (config) =>
        config.mode === mode ||
        config.mode === RuntimeMode.HYBRID ||
        config.mode === RuntimeMode.AUTO
    );

    // 選擇主 Provider
    let primary: ProviderConfig | undefined;
    let fallback: ProviderConfig | undefined;

    // NATIVE 模式：只能用 native Provider
    if (mode === RuntimeMode.NATIVE) {
      primary = candidates.find(
        (c) => (c.config as Record<string, unknown>).providerMode === 'native'
      );
    }
    // CONNECTED 模式：優先用 external，沒有就用 native
    else if (mode === RuntimeMode.CONNECTED) {
      primary = candidates.find(
        (c) => (c.config as Record<string, unknown>).providerMode === 'external'
      );
      if (!primary) {
        primary = candidates.find(
          (c) => (c.config as Record<string, unknown>).providerMode === 'native'
        );
      }
    }
    // HYBRID 模式：external first，native fallback
    else if (mode === RuntimeMode.HYBRID) {
      primary = candidates.find(
        (c) => (c.config as Record<string, unknown>).providerMode === 'external'
      );
      fallback = candidates.find(
        (c) => (c.config as Record<string, unknown>).providerMode === 'native'
      );
    }

    // AUTO 模式：根據網絡狀態切換
    else if (mode === RuntimeMode.AUTO) {
      if (this.networkStatus?.isOnline) {
        primary = candidates.find(
          (c) => (c.config as Record<string, unknown>).providerMode === 'external'
        );
        fallback = candidates.find(
          (c) => (c.config as Record<string, unknown>).providerMode === 'native'
        );
      } else {
        primary = candidates.find(
          (c) => (c.config as Record<string, unknown>).providerMode === 'native'
        );
      }
    }

    return { primary, fallback };
  }

  /**
   * ⏰ 啟動健康檢查定時器
   *
   * @param provider - Provider 實例
   */
  private startHealthCheck(provider: T): void {
    const interval = provider.getConfig().healthCheckInterval || 60000;

    const timer = setInterval(async () => {
      try {
        const result = await provider.healthCheck();

        if (!result.isHealthy && this.enableAutoFallback && provider.shouldTriggerFallback()) {
          this.log('warn', `Provider ${provider.providerId} is unhealthy, triggering fallback`);
          // TODO: 實現 fallback 切換邏輯
        }
      } catch (error) {
        this.log('error', `Health check failed for provider ${provider.providerId}:`, error);
      }
    }, interval);

    this.healthCheckTimer = timer;
  }

  /**
   * ⏹️ 停止健康檢查定時器
   */
  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * ⏰ 啟動網絡檢測定時器（AUTO 模式）
   */
  private startNetworkCheck(): void {
    if (this.currentMode !== RuntimeMode.AUTO) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const isOnline = await this.checkNetwork();

        this.updateNetworkStatus({
          isOnline,
          lastChecked: new Date().toISOString(),
          source: 'probe',
        });
      } catch (error) {
        this.log('error', 'Network check failed:', error);
      }
    }, 30000); // 30 秒檢查一次

    this.networkCheckTimer = timer;
  }

  /**
   * ⏹️ 停止網絡檢測定時器
   */
  private stopNetworkCheck(): void {
    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer);
      this.networkCheckTimer = undefined;
    }
  }

  /**
   * 📡 檢查網絡狀態
   *
   * @returns 是否在線
   */
  private async checkNetwork(): Promise<boolean> {
    // 簡單的網絡檢查實現
    // TODO: 根據實際需求實現更複雜的網絡檢測
    try {
      // 嘗試訪問一個可靠的端點
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 📝 日誌輔助方法
   *
   * @param level - 日誌級別
   * @param message - 消息
   * @param data - 可選數據
   */
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.name}]`;

    if (level === 'debug') {
      // 只在 debug 模式輸出
      if (process.env.DEBUG === 'true') {
        console.debug(prefix, message, data);
      }
    } else if (level === 'error') {
      console.error(prefix, message, data);
    } else if (level === 'warn') {
      console.warn(prefix, message, data);
    } else {
      console.log(prefix, message, data);
    }
  }
}

/**
 * ✨ Export ProviderFactory
 */
export { ProviderFactory as default };
