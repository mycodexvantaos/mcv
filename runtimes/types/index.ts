/**
 * 🏢 MyCodexVantaOS - Runtime Layer Types
 *
 * 定義 Runtime Mode 相關類型、配置、檢測結果。
 */

import { RuntimeMode } from '../../packages/capabilities/types';

export type { RuntimeMode } from '../../packages/capabilities/types';

/**
 * 🌐 環境信息（用於 AUTO 模式的環境感知）
 */
export interface RuntimeEnvironment {
  /** 是否 Cloudflare Workers */
  isCloudflareWorkers: boolean;
  /** 是否 Docker */
  isDocker: boolean;
  /** 是否 Node.js */
  isNode: boolean;
  /** 是否可訪問文件系統 */
  hasFileSystem: boolean;
  /** 是否有多線程支持 */
  hasMultiThreading: boolean;
}

/**
 * 📡 網絡檢測策略
 */
export type NetworkProbeStrategy =
  | 'google' // 檢測 www.google.com
  | 'custom' // 自定義端點 URL
  | 'dns' // DNS 查詢檢測
  | 'system'; // 系統網絡狀態 API（瀏覽器/Workers）

export interface NetworkProbeConfig {
  /** 策略 */
  strategy: NetworkProbeStrategy;
  /** 自定義端點 URL（策略=custom 時使用） */
  customUrl?: string;
  /** 超時（毫秒） */
  timeout?: number;
}

/**
 * 🚀 Runtime 配置（全局單例）
 */
export interface RuntimeConfiguration {
  /** 當前 Runtime Mode */
  mode: RuntimeMode;
  /** 是否啟用自動 fallback */
  enableAutoFallback: boolean;
  /** 網絡檢測配置 */
  networkProbe?: NetworkProbeConfig;
  /** 是否強制忽略外部分依賴錯誤（僅用於調試） */
  ignoreMissingDeps?: boolean;
  /** 調試日誌級別 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 🎛️ Mode 檢測結果（供 AUTO 和 HYBRID 模式使用）
 */
export interface ModeDetectionResult {
  /** 推薦的 Runtime Mode */
  recommendedMode: RuntimeMode;
  /** 理由 */
  reasons: string[];
  /** 環境信息 */
  environment: RuntimeEnvironment;
  /** 網絡狀態 */
  networkStatus: {
    isOnline: boolean;
    latency?: number;
    lastChecked: string;
  };
  /** 依賴檢查結果（Native 依賴是否完整） */
  dependencyStatus: {
    satisfied: boolean;
    missing: string[];
  };
}
