# 🏢 MyCodeXvantaOS - Runtime Layer Guide

## 概述

Runtime Layer 提供兩層能力：

1. **Runtime Mode Management（Phase 0.5 新增）**
   - 四種 Runtime Mode：native/connected/hybrid/auto
   - 自動環境與網絡檢測
   - 動態模式切換與結構化日誌

2. **Runtime Adapter Support（原有功能，向後兼容）**
   - Cloudflare Workers / Docker / Kubernetes 適配器
   - 三階段啟動策略

---

## 一、Runtime Mode Management（新增）

### 1.1 四種模式

| 模式 | 描述 | 使用場景 |
|------|------|----------|
| `NATIVE` | 完全離線，零外部依賴 | 自託托管、air-gapped、本地開發 |
| `CONNECTED` | 優先使用 External Provider | 雲端部署、需要強大的外部能力 |
| `HYBRID` | External first，失敗自動回退 Native | 生產場景、高可用保障 |
| `AUTO` | 根據網絡與依賴自動選擇 | 動態環境、邊緣計算、開發調試 |

### 1.2 快速開始

```typescript
import { getRuntimeManager, RuntimeMode } from './runtimes';

// 初始化 Runtime Manager
const manager = getRuntimeManager({
  mode: RuntimeMode.AUTO,
  enableAutoFallback: true,
  logLevel: 'info',
});

// 查看當前模式
console.log('Current mode:', manager.getCurrentMode());

// AUTO 模式下執行檢測並自動切換
const result = await manager.performDetectionAndSwitch(true);
console.log('Recommended mode:', result.recommendedMode);
console.log('Reasons:', result.reasons);
console.log('Network status:', result.networkStatus);

// 手動切換模式
manager.setMode(RuntimeMode.NATIVE, 'user request');

// 查看模式切換歷史
console.log('Mode change history:', manager.getModeChangeHistory());
```

### 1.3 配置詳解

```typescript
interface RuntimeConfiguration {
  /** 當前 Runtime Mode */
  mode: RuntimeMode;
  /** 是否啟用自動 fallback */
  enableAutoFallback: boolean;
  /** 網絡檢測配置 */
  networkProbe?: {
    strategy: 'google' | 'custom' | 'dns' | 'system';
    customUrl?: string;
    timeout?: number;
  };
  /** 是否強制忽略缺失依賴（僅調試） */
  ignoreMissingDeps?: boolean;
  /** 日誌級別 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

### 1.4 網絡檢測

```typescript
const manager = getRuntimeManager();

// 觸發網絡檢測（AUTO 模式會自動切換）
const networkStatus = await manager.triggerNetworkProbe({
  strategy: 'google',
  timeout: 5000,
});

console.log('Online:', networkStatus.isOnline);
console.log('Latency:', networkStatus.latency);
```

---

## 二、Runtime Adapter Support（原有功能）

### 2.1 Cloudflare Workers

```typescript
import { bootstrapCloudflare, CloudflareRuntimeAdapter } from './runtimes';

// 在 wrangler.toml 或 .env 中定義環境變量
const env = {
  DB: ..., // D1 數據庫
  KV: ..., // KV 命名空間
};

// 啟動 Cloudflare 適配器
const adapter = new CloudflareRuntimeAdapter(env);
```

### 2.2 Docker / Node.js

```typescript
import { bootstrapDocker, DockerRuntimeAdapter } from './runtimes';

const env = {
  DATABASE_URL: 'postgresql://localhost:5432/mydb',
  REDIS_URL: 'redis://localhost:6379',
  MINIO_ENDPOINT: 'localhost:9000',
};

const adapter = new DockerRuntimeAdapter(env);
```

### 2.3 Kubernetes

```typescript
import { bootstrapKubernetes, mapKubernetesEnv } from './runtimes';

// Kubernetes 環境變量映射
const env = await mapKubernetesEnv();
```

---

## 三、結合使用

### 3.1 Cloudflare + AUTO Mode

```typescript
// Cloudflare Workers 環境下也可以使用 RuntimeMode.AUTO
// 當 Workers 網絡異常時可降級到 Native Provider
const manager = getRuntimeManager({
  mode: RuntimeMode.AUTO,
  enableAutoFallback: true,
});

const result = await manager.performDetectionAndSwitch(true);

if (result.recommendedMode === RuntimeMode.NATIVE) {
  console.log('Workers network error, fallback to native');
}
```

### 3.2 本地開發

```typescript
import { getRuntimeManager, RuntimeMode } from './runtimes';

// 本地開發通常使用 NATIVE 模式，避免 API key
const manager = getRuntimeManager({
  mode: RuntimeMode.NATIVE,
  enableAutoFallback: false,
  logLevel: 'debug',
});
```

---

## 四、日誌示例

```
[2024-05-15T10:00:00Z] [INFO] [RuntimeManager] Runtime config updated
[2024-05-15T10:00:01Z] [INFO] [RuntimeManager] Runtime mode switched: AUTO → CONNECTED (reason: network online, using connected mode)
[2024-05-15T10:05:00Z] [INFO] [RuntimeManager] Runtime mode switched: CONNECTED → NATIVE (reason: network offline, using native mode)
[2024-05-15T10:06:00Z] [INFO] [RuntimeManager] Runtime mode switched: NATIVE → CONNECTED (reason: network probe: online)
```

---

## 五、故障排查

### 5.1 模式未切換

- 檢查 `mode` 是否為 `AUTO`
- 檢查 `enableAutoFallback` 是否為 `true`
- 查看 `getModeChangeHistory()` 了解切換歷史

### 5.2 網絡檢測不正確

- 檢查 `networkProbe` 配置
- 嘗試不同策略（`google` / `custom`）
- 檢查防火牆/代理設置

### 5.3 依賴檢查失敗

- 查看日誌中的 `missing` 依賴列表
- 使用 `ignoreMissingDeps: true` 跳過（僅調試）

---

## 六、相關文檔

- Capability Layer 使用指南: `packages/capabilities/README.md`
- Provider 重構計劃: `providers/REFACTORING_PLAN.md`
- 平台架構: `PLATFORM_ARCHITECTURE.md`
- 架構驗證報告: `ARCHITECTURE_PRINCIPLES_VALIDATION.md`

---

## 七、版本歷史

- 1.0.0 (2024-05-15): 初始版本（Runtime Mode Management + Runtime Adapter Support）