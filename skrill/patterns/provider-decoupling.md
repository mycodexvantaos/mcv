# Pattern: Provider Decoupling（Provider 解耦與抽象）

**Category**: Architecture
**Maturity**: Production
**Score**: 90/100
**Source**: MyCodexVantaOS Core Archive + Unified Architecture Patch

---

## Problem

應用邏輯直接依賴雲廠商 SDK（AWS、GCP、Azure、OpenAI）會導致：

- 無法進行本地測試（必須連接真實雲服務）
- 切換雲廠商需要大規模修改代碼
- 多雲或災備場景難以實作
- 不同團隊對同一雲服務的使用方式不一致

## Context

適用於：

- 任何使用雲服務（AWS/GCP/Azure/OpenAI）的應用
- 需要本地測試環境的服務
- 企業級多雲策略
- AI 系統需要切換不同 LLM provider

## Forces

| 張力 | 說明 |
|------|------|
| 直接使用 vs 抽象 | 直接使用 SDK 最快，但有強耦合 |
| 性能 vs 靈活 | 抽象層增加一點點延遲 |
| 完整功能 vs 通用 API | 通用 adapter 可能無法使用廠商特有功能 |

## Solution

使用 **Provider Registry + Adapter Pattern** 實現解耦：

```text
Provider Decoupling Framework
  ├── Abstract Provider Interface   — 定義統一的能力介面
  ├── AWS Adapter                   — 實作 AWS 版本
  ├── GCP Adapter                   — 實作 GCP 版本
  ├── Mock Adapter                  — 本地測試用
  ├── Provider Registry             — 管理所有 provider 實例
  ├── Health-based Provider Selector — 根據健康狀態選擇 provider
  └── Traceable Call Context        — 追蹤 provider 調用
```

**Canonical Capability ID 設計**：

```yaml
# 正確：capability-first 命名
providers:
  - id: llm-openai         # capability-vendor 格式
  - id: database-postgres
  - id: storage-s3
  - id: compute-lambda

# 錯誤：vendor-first 命名
providers:
  - id: openai-llm         # ✗ 不應以 vendor 開頭
  - id: postgres-database  # ✗
```

## Tradeoffs

| 優點 | 代價 |
|------|------|
| 本地測試無需雲連線 | 需要維護多個 adapter |
| 輕鬆切換雲廠商 | 抽象層可能無法使用廠商特有功能 |
| 多雲支援 | 初期建設成本較高 |
| 統一的監控和日誌 | 所有 adapter 必須維持相同 API |

## Implementation Guide

### Step 1: 定義 Provider Interface

```typescript
// providers/abstract/provider-interface.ts
interface StorageProvider {
  upload(key: string, data: Buffer): Promise<void>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

interface LLMProvider {
  complete(prompt: string, options?: LLMOptions): Promise<string>;
  embed(text: string): Promise<number[]>;
  health(): Promise<HealthStatus>;
}
```

### Step 2: 實作 Adapters

```typescript
// providers/aws/s3-adapter.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

class AWSS3Adapter implements StorageProvider {
  private client: S3Client;

  constructor(private bucket: string) {
    this.client = new S3Client({ region: process.env.AWS_REGION });
  }

  async upload(key: string, data: Buffer): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
    }));
  }
  // ... 其他方法
}
```

```typescript
// providers/mock/storage-mock-adapter.ts
class MockStorageAdapter implements StorageProvider {
  private store = new Map<string, Buffer>();

  async upload(key: string, data: Buffer): Promise<void> {
    this.store.set(key, data);
  }

  async download(key: string): Promise<Buffer> {
    const data = this.store.get(key);
    if (!data) throw new Error(`Key not found: ${key}`);
    return data;
  }
  // ...
}
```

### Step 3: Provider Registry

```typescript
// providers/registry/provider-registry.ts
class ProviderRegistry {
  private providers = new Map<string, Provider>();

  register(capabilityId: string, provider: Provider): void {
    this.providers.set(capabilityId, provider);
  }

  resolve<T extends Provider>(capabilityId: string): T {
    const provider = this.providers.get(capabilityId);
    if (!provider) {
      throw new Error(`No provider registered for: ${capabilityId}`);
    }
    return provider as T;
  }
}
```

### Step 4: Provider Manifest

```yaml
# providers/aws-s3/provider-manifest.yaml
id: storage-s3
type: provider
capability: storage
vendor_segment: s3
runtime_modes:
  - cloud
  - hybrid
health_contract:
  endpoint: /health
  timeout_ms: 5000
```

## CI Enforcement

```yaml
name: Provider Boundary Check
on:
  pull_request:
    paths:
      - 'services/**'
      - 'providers/**'

jobs:
  provider-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check direct vendor imports
        run: |
          # 確保 services/ 中沒有直接 import AWS/GCP SDK
          # 應只能在 providers/ 目錄下使用這些 SDK
          node ci/check-provider-boundary.ts
      - name: Validate provider manifests
        run: node ci/validate-provider-manifests.ts
      - name: Check capability ID format
        run: python scripts/validate-capability-ids.py
```

## Security Considerations

- Provider credentials 必須通過環境變數或 secrets manager 注入，不能 hardcode
- Mock adapter 只能在 test/local 環境使用，必須用 runtime mode 區分
- Provider registry 必須支援 health check，避免將請求發往不健康的 provider
- 所有 provider 調用必須有 timeout，防止無限等待

## Example Structure

```text
providers/
├── abstract/
│   ├── storage-provider.interface.ts
│   ├── llm-provider.interface.ts
│   └── compute-provider.interface.ts
├── aws/
│   ├── provider-manifest.yaml
│   ├── s3-adapter.ts
│   └── lambda-adapter.ts
├── gcp/
│   ├── provider-manifest.yaml
│   ├── gcs-adapter.ts
│   └── cloud-run-adapter.ts
├── openai/
│   ├── provider-manifest.yaml
│   └── openai-llm-adapter.ts
├── mock/
│   ├── storage-mock-adapter.ts
│   └── llm-mock-adapter.ts
└── registry/
    ├── provider-registry.ts
    └── health-selector.ts
```

## Migration Strategy

```text
Week 1: 掃描現有直接依賴
  - 找出所有直接 import AWS/GCP/OpenAI SDK 的位置
  - 建立遷移清單

Week 2-4: 建立抽象層
  - 定義 Provider Interface
  - 建立 Provider Registry
  - 建立 Mock Adapter

Week 5-8: 逐一遷移
  - 為每個直接依賴建立 Adapter
  - 將代碼切換到使用 Provider Registry
  - 確保 Mock Adapter 通過所有測試

Week 9+: CI 強制執行
  - 加入 provider-boundary-check.yml
  - 阻止新的直接廠商依賴
```

---

*Pattern Score: 90/100 | Priority: High | Related Skill: SM-04-A*
