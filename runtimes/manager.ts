/**
 * 🏢 MyCodexVantaOS - Runtime Configuration Manager
 *
 * 單例模式，管理 Runtime Configuration、模式切換並記錄關鍵日誌。
 */

import { RuntimeMode } from '../packages/capabilities/types';
import type {
  RuntimeConfiguration,
  RuntimeEnvironment,
  NetworkProbeStrategy,
  NetworkProbeConfig,
  ModeDetectionResult,
} from './types';
import { detectMode, loadRuntimeConfig as rawLoadConfig } from './detector';

/**
 * ✨ Runtime Manager（單例）
 */
export class RuntimeManager {
  private static instance: RuntimeManager;
  private config: RuntimeConfiguration;
  private currentMode: RuntimeMode;
  private lastDetection?: ModeDetectionResult;
  private modeChangeLog: Array<{
    timestamp: string;
    from: RuntimeMode;
    to: RuntimeMode;
    reason: string;
  }> = [];

  private constructor(config: RuntimeConfiguration) {
    this.config = config;
    this.currentMode = config.mode;
  }

  /** 獲取單例 */
  public static getInstance(config?: RuntimeConfiguration): RuntimeManager {
    if (!RuntimeManager.instance) {
      const effectiveConfig = config ? rawLoadConfig(config) : rawLoadConfig({});
      RuntimeManager.instance = new RuntimeManager(effectiveConfig);
    }
    return RuntimeManager.instance;
  }

  /** 獲取當前配置 */
  public getConfig(): RuntimeConfiguration {
    return this.config;
  }

  /** 獲取當前 Runtime Mode */
  public getCurrentMode(): RuntimeMode {
    return this.currentMode;
  }

  /** 更新配置（部分，不觸發重新檢測） */
  public updateConfig(updates: Partial<RuntimeConfiguration>): void {
    this.config = { ...this.config, ...updates };
    this.log('info', 'Runtime config updated');
  }

  /**
   * 切換 Runtime Mode（記錄日誌）
   */
  public setMode(mode: RuntimeMode, reason: string = 'manual'): void {
    if (mode === this.currentMode && reason !== 'manual') return;

    const from = this.currentMode;
    this.currentMode = mode;

    this.modeChangeLog.push({
      timestamp: new Date().toISOString(),
      from,
      to: mode,
      reason,
    });

    this.log('info', `Runtime mode switched: ${from} → ${mode} (reason: ${reason})`);
  }

  /** 獲取模式切換歷史 */
  public getModeChangeHistory(): Array<{
    timestamp: string;
    from: RuntimeMode;
    to: RuntimeMode;
    reason: string;
  }> {
    return [...this.modeChangeLog];
  }

  /** 執行模式檢測（AUTO/HYBRID）並自動切換（如設置） */
  public async performDetectionAndSwitch(autoSwitch: boolean = true): Promise<ModeDetectionResult> {
    const result = await detectMode(this.config);
    this.lastDetection = result;

    if (autoSwitch && this.config.mode === RuntimeMode.AUTO) {
      if (result.recommendedMode !== this.currentMode) {
        this.setMode(result.recommendedMode, result.reasons.join(', ') || 'automatic detection');
      }
    }

    return result;
  }

  /** 獲取最近一次檢測結果 */
  public getLastDetection(): ModeDetectionResult | undefined {
    return this.lastDetection;
  }

  /**
   * 觸發網絡檢測（立即生效，可由外部調用以響應網絡變化）
   */
  public async triggerNetworkProbe(
    config?: NetworkProbeConfig
  ): Promise<{ isOnline: boolean; latency?: number; lastChecked: string }> {
    const networkStatus = (
      await detectMode({
        ...this.config,
        networkProbe: config ?? this.config.networkProbe,
      })
    ).networkStatus;

    if (
      this.config.mode === RuntimeMode.AUTO &&
      (networkStatus.isOnline
        ? this.currentMode !== RuntimeMode.CONNECTED
        : this.currentMode !== RuntimeMode.NATIVE)
    ) {
      const newMode = networkStatus.isOnline ? RuntimeMode.CONNECTED : RuntimeMode.NATIVE;
      this.setMode(newMode, `network probe: ${networkStatus.isOnline ? 'online' : 'offline'}`);
    }

    return networkStatus;
  }

  /** 日誌輔助方法 */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [RuntimeManager]`;

    const enabled =
      this.config.logLevel === 'debug' ||
      (level === 'info' && this.config.logLevel === 'info') ||
      this.config.logLevel === 'warn' ||
      this.config.logLevel === 'error';
    if (!enabled) return;

    if (level === 'debug') {
      if (this.config.logLevel === 'debug') console.debug(prefix, message);
    } else if (level === 'error') {
      console.error(prefix, message);
    } else if (level === 'warn') {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
  }

  /** 重置單例（主要用於測試） */
  public static resetInstance(): void {
    RuntimeManager.instance = null!;
  }
}

/**
 * 🧩 暴露便捷函數
 */
export function getRuntimeManager(config?: RuntimeConfiguration): RuntimeManager {
  return RuntimeManager.getInstance(config);
}

export function loadRuntimeConfig(cfg: Partial<RuntimeConfiguration>): RuntimeConfiguration {
  return rawLoadConfig(cfg);
}
