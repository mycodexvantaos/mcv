/**
 * 🏢 MyCodexVantaOS - Runtime Mode Detector
 *
 * 負責檢測當前環境、網絡狀態與依賴完整性，推薦最適合的 Runtime Mode。
 */

import { RuntimeMode } from '../packages/capabilities/types';
import type {
  RuntimeEnvironment,
  NetworkProbeStrategy,
  NetworkProbeConfig,
  RuntimeConfiguration,
  ModeDetectionResult,
} from './types';

/**
 * 🧩 檢測環境
 */
function detectEnvironment(): RuntimeEnvironment {
  // 雲端平台判斷（示例）
  const isCloudflareWorkers =
    typeof caches !== 'undefined' &&
    typeof fetch === 'function' &&
    process.env.CF_PAGES !== undefined;
  const isDocker = process.env.DOCKER_CONTAINER === 'true' || fs.existsSync('/.dockerenv');
  const isNode = typeof process !== 'undefined' && process.versions && !!process.versions.node;
  const hasFileSystem = isNode && typeof require !== 'undefined';
  const hasMultiThreading = isNode && !!process.env.THREAD_POOL_SIZE; // 簡化判斷

  return {
    isCloudflareWorkers,
    isDocker,
    isNode,
    hasFileSystem,
    hasMultiThreading,
  };
}

/**
 * 📡 網絡檢測（根據策略）
 */
async function probeNetwork(
  config?: NetworkProbeConfig
): Promise<{ isOnline: boolean; latency?: number; lastChecked: string }> {
  const start = Date.now();
  const timeout = config?.timeout ?? 5000;
  let url: string;

  switch (config?.strategy ?? 'google') {
    case 'google':
      url = 'https://www.google.com';
      break;
    case 'custom':
      url = config.customUrl ?? 'https://www.google.com';
      break;
    case 'dns':
      // 暫只 HTTP/HTTPS 探測，DNS 探測需更專門的邏輯，暫用 google 請求做近似
      url = 'https://8.8.8.8'; // 會失敗，適合快速判斷離線
      break;
    case 'system':
      // TODO: 若在瀏覽器/Workers，使用 navigator.onLine 等
      url = 'https://www.google.com';
      break;
    default:
      url = 'https://www.google.com';
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const method = config?.strategy === 'dns' ? 'HEAD' : 'GET'; // DNS 佔位
    await fetch(url, { method, signal: controller.signal });
    clearTimeout(timer);
    const latency = Date.now() - start;
    return { isOnline: true, latency, lastChecked: new Date().toISOString() };
  } catch (error) {
    // DNS 策略失敗（因 8.8.8.8 走 HTTP），視為離線
    return { isOnline: false, latency: undefined, lastChecked: new Date().toISOString() };
  }
}

/**
 * 📦 Native 依賴檢查（檢查零依賴前提）
 */
function checkNativeDependencies(): { satisfied: boolean; missing: string[] } {
  // TODO: 按項目需求擴展。此處僅提供基礎佔位。
  // 例如檢查本地文件、內存可用、必需二進制等。
  // 可讀取清單檔案（如 runtimes/native-deps-checklist.json）逐一校驗。
  return { satisfied: true, missing: [] };
}

/**
 * 🧠 推薦 Runtime Mode
 */
export async function detectMode(config?: RuntimeConfiguration): Promise<ModeDetectionResult> {
  const env = detectEnvironment();
  const networkStatus = config?.networkProbe
    ? await probeNetwork(config.networkProbe)
    : { isOnline: true, lastChecked: new Date().toISOString() };
  const depStatus = checkNativeDependencies();

  const reasons: string[] = [];

  // AUTO 模式推薦邏輯
  let recommendedMode: RuntimeMode;

  if (!networkStatus.isOnline) {
    recommendedMode = RuntimeMode.NATIVE;
    reasons.push('network offline, using native mode');
  } else if (!depStatus.satisfied && !config?.ignoreMissingDeps) {
    recommendedMode = RuntimeMode.NATIVE;
    reasons.push('native dependencies not fully satisfied, falling back to native');
  } else {
    recommendedMode = RuntimeMode.CONNECTED;
    reasons.push('network online, using connected mode');
  }

  // 特殊平台優化
  if (env.isCloudflareWorkers) {
    reasons.push('running on Cloudflare Workers, connected preferred');
  } else if (env.isDocker) {
    reasons.push('running in Docker, support for local providers available');
  } else if (env.isNode) {
    reasons.push('running on Node.js, native providers fully available');
  }

  return {
    recommendedMode,
    reasons,
    environment: env,
    networkStatus,
    dependencyStatus: depStatus,
  };
}

/**
 * 🔧 加載 Runtime Configuration
 */
export function loadRuntimeConfig(cfg: Partial<RuntimeConfiguration>): RuntimeConfiguration {
  return {
    mode: cfg.mode ?? RuntimeMode.AUTO,
    enableAutoFallback: cfg.enableAutoFallback ?? true,
    networkProbe: cfg.networkProbe,
    ignoreMissingDeps: cfg.ignoreMissingDeps ?? false,
    logLevel: cfg.logLevel ?? 'info',
  };
}
