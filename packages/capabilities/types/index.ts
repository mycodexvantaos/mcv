/**
 * 🏢 MyCodeXvantaOS - Capabilities Layer Type Definitions
 *
 * Platform Independence 支持的核心類型系統
 * 提供統一的 Runtime Mode 和 Provider 配置接口
 *
 * @module packages/capabilities/types
 * @version 1.0.0
 */

/**
 * 🎛️ Runtime Mode - 運行時模式枚舉
 *
 * 定義平台的四種運行時模式，確保在各種環境下都能正常運作：
 *
 * - **native**: 完全離線模式，使用零依賴的 Native Provider
 * - **connected**: 在線模式，優先使用 External Provider（需要 API keys）
 * - **hybrid**: 混合模式，External first，失敗時自動回退到 Native
 * - **auto**: 自動模式，根據網絡狀態和可用性動態選擇最佳模式
 *
 * @enum {string}
 */
export enum RuntimeMode {
  /** 完全離線模式 - 零外部依賴，適合自託管或隔離環境 */
  NATIVE = 'native',

  /** 在線模式 - 需要 API keys，使用 External Provider */
  CONNECTED = 'connected',

  /** 混合模式 - External first，失敗時自動回退到 Native */
  HYBRID = 'hybrid',

  /** 自動模式 - 根據網絡狀態和可用性動態選擇 */
  AUTO = 'auto',
}

/**
 * 📊 Provider Mode - Provider 類型枚舉
 *
 * 標識每個 Provider 的類型：
 * - Native: 零依賴，可完全離線運作
 * - External: 需要外部 API 調用（OpenAI, Cloudflare 等）
 * - Hybrid: 包含 Native fallback 的 External Provider
 *
 * @enum {string}
 */
export enum ProviderMode {
  /** Native Provider - 零外部依賴 */
  NATIVE = 'native',

  /** External Provider - 需要外部 API */
  EXTERNAL = 'external',

  /** Hybrid Provider - External with Native fallback */
  HYBRID = 'hybrid',
}

/**
 * 💖 Provider Health Status - Provider 健康狀態
 *
 * 用於監控和管理 Provider 的可用性：
 * - healthy: 正常運作
 * - degraded: 運作但性能下降
 * - unhealthy: 無法使用
 * - unknown: 狀態未知（未初始化）
 *
 * @enum {string}
 */
export enum ProviderHealthStatus {
  /** 健康狀態運作正常 */
  HEALTHY = 'healthy',

  /** 運作但性能下降（如高延遲、限流） */
  DEGRADED = 'degraded',

  /** 無法使用（如網絡故障、API 錯誤） */
  UNHEALTHY = 'unhealthy',

  /** 狀態未知（未曾檢查或初始化） */
  UNKNOWN = 'unknown',
}

/**
 * ⚙️ Provider Health Check Result - Provider 健康檢查結果
 *
 * 返回健康管理器和 ProviderFactory 使用：
 * ```typescript
 * {
 *   healthy: true,
 *   status: 'healthy',
 *   checkTime: '2024-05-15T10:00:00Z',
 *   metrics: { latency: 50, successRate: 0.99 }
 * }
 * ```
 */
export interface ProviderHealthCheckResult {
  /** 是否健康 */
  isHealthy: boolean;

  /** 健康狀態 */
  status: ProviderHealthStatus;

  /** 檢查時間（ISO 8601） */
  checkTime: string;

  /** 可選的監控指標 */
  metrics?: {
    /** 延遲（毫秒） */
    latency?: number;

    /** 成功率（0-1） */
    successRate?: number;

    /** 錯誤次數 */
    errorCount?: number;

    /** 最後錯誤消息 */
    lastError?: string;
  };
}

/**
 * 🎯 Provider Capability - Provider 能力描述
 *
 * 描述每個 Provider 支持的能力集合：
 * - capabilityId: 能力唯一標識符
 * - supportedModes: 支持的 RuntimeMode
 * - providerMode: Provider 類型（native/external/hybrid）
 * - dependencies: 外部依賴列表（Native 應為空）
 * - fallbackProvider: （可選）fallback Provider ID
 * - offlineCapable: 是否可以完全離線運作
 */
export interface ProviderCapability {
  /** 能力唯一標識符 */
  capabilityId: string;

  /** Provider 實現名稱 */
  providerName: string;

  /** 支持的 RuntimeMode 列表 */
  supportedModes: RuntimeMode[];

  /** Provider 類型 */
  providerMode: ProviderMode;

  /** 外部依賴列表（Native Provider 應為空） */
  dependencies: string[];

  /** （可選）fallback Provider ID */
  fallbackProviderId?: string;

  /** 是否可以完全離線運作 */
  offlineCapable: boolean;

  /** 版本信息 */
  version: string;

  /** 描述 */
  description: string;
}

/**
 * 🔧 Provider Configuration - Provider 配置接口
 *
 * 統一的 Provider 配置結構：
 * - id: Provider 唯一標識符
 * - mode: Runtime Mode
 * - config: Provider 特定配置
 * - healthCheckInterval: 健康檢查間隔（毫秒）
 * - fallbackThreshold: 切換到 fallback 的錯誤閾值
 * - initialization: 初始化配置
 */
export interface ProviderConfig<T = unknown> {
  /** Provider 唯一標識符 */
  id: string;

  /** Runtime Mode */
  mode: RuntimeMode;

  /** Provider 類型 */
  providerMode: ProviderMode;

  /** Provider 特定配置 */
  config: T;

  /** 健康檢查間隔（毫秒），默認 60000（1 分鐘） */
  healthCheckInterval?: number;

  /** 切換到 fallback 的錯誤閾值，默認 3 */
  fallbackThreshold?: number;

  /** 初始化配置 */
  initialization?: {
    /** 是否自動初始化 */
    autoInit: boolean;

    /** 初始化超時時間（毫秒） */
    initTimeout?: number;
  };
}

/**
 * 🔄 Fallback Configuration - Fallback 配置
 *
 * 用於 Hybrid Provider 的 fallback 邏輯：
 * - enabled: 是否啟用 fallback
 * - providerId: fallback Provider ID
 * - retryCount: 重試次數
 * - retryDelay: 重試延遲（毫秒）
 * - logFallback: 是否記錄 fallback 事件
 */
export interface FallbackConfig {
  /** 是否啟用 fallback */
  enabled: boolean;

  /** fallback Provider ID */
  providerId: string;

  /** 重試次數，默認 3 */
  retryCount?: number;

  /** 重試延遲（毫秒），默認 1000 */
  retryDelay?: number;

  /** 是否記錄 fallback 事件 */
  logFallback: boolean;

  /** fallback 觸發條件 */
  triggerConditions?: {
    /** 錯誤類型列表 */
    errorTypes?: string[];

    /** HTTP 狀態碼列表 */
    httpStatusCodes?: number[];

    /** 錯誤消息匹配模式 */
    errorPatterns?: string[];
  };
}

/**
 * 📡 Network Status - 網絡狀態
 *
 * 用於 Runtime Mode AUTO 的網絡檢測：
 * - isOnline: 是否在線
 * - latency: 網絡延遲（毫秒）
 * - lastChecked: 最後檢查時間
 * - source: 檢測來源
 */
export interface NetworkStatus {
  /** 是否在線 */
  isOnline: boolean;

  /** 網絡延遲（毫秒） */
  latency?: number;

  /** 最後檢查時間（ISO 8601） */
  lastChecked: string;

  /** 檢測來源 */
  source: 'system' | 'probe' | 'manual';
}

/**
 * 🎛️ Runtime Configuration - 運行時配置
 *
 * 全局運行時配置：
 * - mode: Runtime Mode
 * - networkStatus: 網絡狀態
 * - providers: 註冊的 Provider 列表
 * - enableAutoFallback: 是否啟用自動 fallback
 * - logLevel: 日誌級別
 */
export interface RuntimeConfig {
  /** Runtime Mode */
  mode: RuntimeMode;

  /** 網絡狀態（AUTO 模式使用） */
  networkStatus?: NetworkStatus;

  /** 註冊的 Provider 列表 */
  providers: ProviderConfig[];

  /** 是否啟用自動 fallback */
  enableAutoFallback: boolean;

  /** 日誌級別 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 📊 Provider Metrics - Provider 指標
 *
 * 用於監控和性能分析：
 * - invocationCount: 調用次數
 * - successCount: 成功次數
 * - failureCount: 失敗次數
 * - fallbackCount: fallback 次數
 * - avgLatency: 平均延遲（毫秒）
 * - lastInvocation: 最後調用時間
 */
export interface ProviderMetrics {
  /** 調用次數 */
  invocationCount: number;

  /** 成功次數 */
  successCount: number;

  /** 失敗次數 */
  failureCount: number;

  /** fallback 次數 */
  fallbackCount: number;

  /** 平均延遲（毫秒） */
  avgLatency: number;

  /** 最後調用時間 */
  lastInvocation: string;

  /** 最後調用的 Provider ID */
  lastProviderId: string;
}

/**
 * 🔍 Capability Query - Capability 查詢參數
 *
 * 用於 Provider Registry 查詢：
 * - capabilityId: 能力 ID
 * - mode: Runtime Mode 過濾
 * - providerMode: Provider 類型過濾
 * - offlineCapable: 是否需要離線能力
 */
export interface CapabilityQuery {
  /** 能力 ID */
  capabilityId?: string;

  /** Runtime Mode 過濾 */
  mode?: RuntimeMode;

  /** Provider 類型過濾 */
  providerMode?: ProviderMode;

  /** 是否需要離線能力 */
  offlineCapable?: boolean;
}

/**
 * ✨ Export All Types
 */
export type {
  ProviderConfig,
  FallbackConfig,
  NetworkStatus,
  RuntimeConfig,
  ProviderMetrics,
  CapabilityQuery,
  ProviderHealthCheckResult,
  ProviderCapability,
};