# 🏢 MyCodeXvantaOS - Capabilities Layer

## 📋 概述

Capabilities Layer 是 MyCodeXvantaOS 的核心抽象層，提供統一的 Provider 管理和 Runtime Mode 自動切換能力。它確保平台在各種運行時環境下都能正常運作：

- **完全離線**（使用 Native Provider）
- **在線模式**（使用 External Provider）
- **混合模式**（External first，自動 fallback 到 Native）
- **自動模式**（根據網絡狀態動態切換）

## 🎯 設計目標

1. **Platform Independence**: 平台可完全獨立運行，零外部依賴
2. **Offline-First**: 優先保證離線可用性
3. **Flexible Runtime**: 支持四種 Runtime Mode 自動切換
4. **Automatic Fallback**: External 失敗時自動回退到 Native
5. **Structured Logging**: 所有關鍵事件都有結構化日誌
6. **Health Monitoring**: 內置健康檢查和指標收集

## 📁 目錄結構

```
packages/capabilities/
├── base/           # CapabilityBase 抽象基類
├── factory/        # ProviderFactory 工廠類
├── registry/       # Provider Registry（待實現）
├── types/          # 類型定義
├── index.ts        # 模塊主入口
└── README.md       # 本文件
```

## 🏛️ 核心組件

### 1. CapabilityBase<T>

Provider 抽象基類，所有 Provider 必須實現：

```typescript
abstract class CapabilityBase<T = unknown> {
  abstract doInitialize(): Promise<void>;
  abstract doHealthCheck(): Promise<ProviderHealthCheckResult>;
  abstract doShutdown(): Promise<void>;

  // 提供的功能：
  // - 生命周期管理 (initialize, healthCheck, shutdown)
  // - 健康狀態追蹤
  // - 指標收集 (invocation, success, failure, latency)
  // - 自動 fallback 觸發
  // - 結構化日誌
}
```

### 2. ProviderFactory<T>

Provider 工廠類，負責創建和管理 Provider：

```typescript
class ProviderFactory<T extends CapabilityBase> {
  // 註冊 Provider
  registerProvider(config: ProviderConfig): void;

  // 創建 Provider（根據 RuntimeMode 自動選擇）
  async createProvider(
    capabilityId: string,
    providerConstructor: new (config: ProviderConfig, fallbackConfig?: FallbackConfig) => T,
    fallbackConstructor?: new (config: ProviderConfig) => T
  ): Promise<T>;

  // 切換 Runtime Mode
  setRuntimeMode(mode: RuntimeMode): void;

  // 更新網絡狀態（AUTO 模式）
  updateNetworkStatus(status: NetworkStatus): void;
}
```

### 3. RuntimeMode

四種運行時模式：

- **`NATIVE`**: 完全離線模式，使用零依賴的 Native Provider
- **`CONNECTED`**: 在線模式，使用 External Provider（需要 API keys）
- **`HYBRID`**: 混合模式，External first，失敗時自動回退到 Native
- **`AUTO`**: 自動模式，根據網絡狀態動態選擇最佳模式

## 🚀 快速開始

### 步驟 1: 創建 Native Provider

```typescript
import { CapabilityBase, ProviderConfig, ProviderHealthStatus } from '@mycodexvantaos/capabilities';

interface NativeVectorStoreConfig {
  storageType: 'memory' | 'file';
}

class NativeVectorStore extends CapabilityBase<NativeVectorStoreConfig> {
  private vector: Map<string, number[]> = new Map();

  protected async doInitialize(): Promise<void> {
    // 零依賴初始化
    this.log('info', 'Native vector store initialized');
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    return {
      isHealthy: true,
      status: ProviderHealthStatus.HEALTHY,
      checkTime: new Date().toISOString(),
    };
  }

  protected async doShutdown(): Promise<void> {
    this.vector.clear();
  }
}
```

### 步驟 2: 創建 External Provider

```typescript
interface OpenAIVectorStoreConfig {
  apiKey: string;
}

class OpenAIVectorStore extends CapabilityBase<OpenAIVectorStoreConfig> {
  private client: any; // OpenAI 客戶端

  protected async doInitialize(): Promise<void> {
    this.client = new OpenAIClient({ apiKey: this.config.config.apiKey });
    this.log('info', 'OpenAI vector store initialized');
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    try {
      await this.client.ping();
      return {
        isHealthy: true,
        status: ProviderHealthStatus.HEALTHY,
        checkTime: new Date().toISOString(),
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  protected async doShutdown(): Promise<void> {
    this.client.close();
  }
}
```

### 步驟 3: 使用 ProviderFactory

```typescript
import { ProviderFactory, RuntimeMode } from '@mycodexvantaos/capabilities';

// 創建 Factory
const factory = new ProviderFactory('vector-store', RuntimeMode.AUTO);

// 註冊 Native Provider
factory.registerProvider({
  id: 'native-vector',
  mode: RuntimeMode.NATIVE,
  providerMode: ProviderMode.NATIVE,
  config: { storageType: 'memory' },
});

// 註冊 External Provider
factory.registerProvider({
  id: 'openai-vector',
  mode: RuntimeMode.HYBRID,
  providerMode: ProviderMode.EXTERNAL,
  config: {
    apiKey: process.env.OPENAI_API_KEY,
    fallbackThreshold: 3,
  },
});

// 創建 Hybrid Provider
const vectorStore = await factory.createProvider(
  'vector-store',
  OpenAIVectorStore,
  NativeVectorStore // fallback
);

// 使用 Provider
// ...

// 關閉
await factory.shutdown();
```

## 🎛️ Runtime Mode 選擇邏輯

### NATIVE 模式
- ✅ 僅使用 NATIVE Provider
- ❌ 不使用任何 External Provider
- 🌐 完全離線運作

### CONNECTED 模式
- ✅ 優先使用 EXTERNAL Provider
- ⚠️ 如果沒有 External Provider，降級到 Native
- 🌐 需要網絡連接

### HYBRID 模式
- ✅ 使用 EXTERNAL Provider（主）
- 🔄 失敗時自動回退到 NATIVE Provider（fallback）
- 🌐 最佳可用性保證

### AUTO 模式
- ✅ 根據網絡狀態自動切換
  - 在線 → CONNECTED 模式
  - 離線 → NATIVE 模式
- 🔄 每 30 秒檢測一次網絡狀態
- 🌐 適合動態環境

## 📊 監控和指標

### Provider 指標

每個 Provider 自動收集以下指標：

```typescript
{
  invocationCount: 100,      // 調用次數
  successCount: 95,          // 成功次數
  failureCount: 5,           // 失敗次數
  fallbackCount: 2,          // fallback 次數
  avgLatency: 50,            // 平均延遲（毫秒）
  lastInvocation: '2024-05-15T10:00:00Z',
  lastProviderId: 'openai-vector',
}
```

### 健康檢查結果

```typescript
{
  isHealthy: true,
  status: ProviderHealthStatus.HEALTHY,
  checkTime: '2024-05-15T10:00:00Z',
  metrics: {
    latency: 50,              // 延遲（毫秒）
    successRate: 0.95,        // 成功率（0-1）
    errorCount: 5,            // 錯誤次數
    lastError: undefined,     // 最後錯誤消息
  },
}
```

## 📝 日誌輸出

所有關鍵事件都有結構化日誌：

```
[2024-05-15T10:00:00Z] [INFO] [native-vector] Provider Native Vector Store initialized.
[2024-05-15T10:00:01Z] [INFO] [factory] Provider created: openai-vector (mode: AUTO, fallback: native-vector)
[2024-05-15T10:00:05Z] [WARN] [factory] Fallback triggered: openai-vector → native-vector (consecutive failures: 3)
[2024-05-15T10:01:00Z] [INFO] [native-vector] Provider shutdown completed.
```

## 🧪 測試

### 測試 Native Provider

```typescript
describe('NativeVectorStore', () => {
  it('should initialize and shutdown correctly', async () => {
    const provider = new NativeVectorStore(
      'test-native',
      'Test Native Vector Store',
      {
        id: 'test-native',
        mode: RuntimeMode.NATIVE,
        providerMode: ProviderMode.NATIVE,
        config: { storageType: 'memory' },
      }
    );

    await provider.initialize();
    expect(provider.isInitialized()).toBe(true);

    const healthCheck = await provider.healthCheck();
    expect(healthCheck.isHealthy).toBe(true);

    await provider.shutdown();
    expect(provider.isInitialized()).toBe(false);
  });
});
```

### 測試 External Provider + Fallback

```typescript
describe('HybridVectorStore', () => {
  it('should fallback to native on failure', async () => {
    const factory = new ProviderFactory('test', RuntimeMode.HYBRID);
    factory.registerProvider({ /* external config */ });
    factory.registerProvider({ /* native config */ });

    const hybridProvider = await factory.createProvider(
      'vector-store',
      MockFailingExternalProvider,
      MockNativeProvider
    );

    // 觸發 fallback
    await hybridProvider.methodCall();

    // 驗證 fallback 被觸發
    expect(hybridProvider.getMetrics().fallbackCount).toBeGreaterThan(0);
  });
});
```

## 📚 相關文檔

- [Platform Architecture](../../PLATFORM_ARCHITECTURE.md)
- [Architecture Principles Validation](../../ARCHITECTURE_PRINCIPLES_VALIDATION.md)
- [Runtime Mode Guide](../runtime-mode.md)（待創建）
- [Provider Development Guide](../provider-development.md)（待創建）

## 🚨 注意事項

1. **必須實現 CapabilityBase**: 所有 Provider 必須繼承 `CapabilityBase`
2. **Native Provider 零依賴**: Native Provider 不能有任何外部依賴
3. **External Provider 有 fallback**: External Provider 必須有 Native fallback
4. **健康檢查必須實現**: `doHealthCheck()` 不能返回默認值
5. **日誌必須結構化**: 使用 `this.log()` 方法記錄所有關鍵事件

## 🔗 相關模塊

- [`packages/ports`](..//packages/ports/) - Platform-neutral interfaces
- [`providers`](../../providers/) - Provider 實現目錄
- [`runtimes`](../../runtimes/) - Runtime configuration

## 📞 支持

- GitHub Issues: https://github.com/mycodexvantaos/mycodexvantaos/issues
- Documentation: `docs/`
- Architecture: `docs/architecture/`

## 📝 版本歷史

- **1.0.0** (2024-05-15): 初始版本
  - CapabilityBase 抽象基類
  - ProviderFactory 工廠類
  - 完整的類型系統
  - Runtime Mode 支持（native/connected/hybrid/auto）
  - 健康檢查和指標收集
  - 自動 fallback 邏輯