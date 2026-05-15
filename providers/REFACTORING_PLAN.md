# Provider Directory Refactoring Plan

## 📋 Overview

統一 Provider 置於 `providers/` 目錄，按類型分類：

- `providers/native/` - Native Provider（零依賴，完全離線）
- `providers/external/` - External Provider（需要 API，需 fallback）
- `providers/hybrid/` - Hybrid Provider（External + Native Fallback）

## 🎯 Refactoring Goals

1. 統一 Provider 結構（所有 Provider 實現 CapabilityBase）
2. 按 Native/External/Hybrid 分類
3. 每個 External Provider 必須有 Native fallback
4. 保持向後兼容（不破壞既有業務邏輯）

## 📂 Directory Structure (Target)

```
providers/
├── native/                # 零依賴 Native Providers
│   ├── memory-vector-store/
│   ├── memory-cache/
│   ├── auth-jwt-native/   （已存在）
│   ├── event-stream-native-governance/ （已存在）
│   ├── secrets-k8s-native/ （已存在）
│   ├── deploy-native/     （已存在）
│   ├── ai-ethics-native-auditor/ （已存在）
│   ├── blockchain-native-ledger/ （已存在）
│   └── llm-native/        （已存在）
├── external/              # External Providers（需要 API，需 fallback）
│   ├── openai/
│   ├── openrouter/
│   ├── workers-ai/
│   └── cloudflare-*       （按需）
└── hybrid/                # Hybrid Providers（External + Native Fallback）
    ├── embedding/         （OpenAI → Native）
    ├── vector-store/      （OpenAI → Native Memory）
    └── model-provider/    （OpenAI → Native LLM）
```

## 📋 Migration Rules

### Rule 1: Native Provider Requirements

- ✅ 零外部依賴（不能調用外部 API / OAuth / 服務發現）
- ✅ 零初始化依賴（如需外部 DB/文件，須在本地落盤或降級處理）
- ✅ 可在 air-gapped 環境運作
- ✅ 必須實現 CapabilityBase

### Rule 2: External Provider Requirements

- ✅ 必須提供 API 配置（API key/endpoint/tokens）
- ✅ 必須提供健康檢查
- ✅ 必須標記為 `providerMode: external`
- ✅ 必須指定 Native fallback（在 Hybrid 模式下）

### Rule 3: Hybrid Provider Requirements

- ✅ 實現 External 主邏輯
- ✅ 實現 Native fallback 邏輯
- ✅ 使用 CapabilityBase 的 fallback 觸發
- ✅ 結構化日誌記錄 fallback 事件

## ✅ 已遷移項目（本階段示例）

| 原路徑                         | 新路徑                                 | 類型     | 狀態                                                         |
| ------------------------------ | -------------------------------------- | -------- | ------------------------------------------------------------ |
| `packages/adapters/openai`     | `providers/external/openai`            | External | ✅ 僅複製，業務邏輯尚未接入 CapabilityBase（示例代碼已提供） |
| `packages/adapters/workers-ai` | `providers/external/workers-ai`        | External | ✅ 僅複製，業務邏輯尚未接入 CapabilityBase                   |
| `providers/vector-store`       | `providers/native/memory-vector-store` | Native   | ✅ 已提供 CapabilityBase 適配示例                            |
| `providers/cache`              | `providers/native/memory-cache`        | Native   | ✅ 已提供 CapabilityBase 適配示例                            |
| `providers/embedding`          | `providers/hybrid/embedding`           | Hybrid   | ✅ 已提供 CapabilityBase 適配示例                            |

## 🔜 待遷移項目（後續階段）

### External 候選

- `packages/adapters/cloudflare-d1` → `providers/external/cloudflare-d1`
- `packages/adapters/cloudflare-kv` → `providers/external/cloudflare-kv`
- `packages/adapters/cloudflare-r2` → `providers/external/cloudflare-r2`
- `packages/adapters/d1-full-text-search` → `providers/external/d1-full-text-search`

### Native 候選（按架構驗證報告識別）

- `providers/auth` → `providers/native/auth-jwt-native`（如需）
- `providers/event-stream` → `providers/native/event-stream-native-governance`（如需）
- `providers/secrets` → `providers/native/secrets-k8s-native`（如需）
- `providers/deploy` → `providers/native/deploy-native`（如需）
- `providers/ai-ethics` → `providers/native/ai-ethics-native-auditor`（如需）
- `providers/blockchain` → `providers/native/blockchain-native-ledger`（如需）
- `providers/llm` → `providers/native/llm-native`（如需）

### Hybrid 候選

- 模型提供（OpenAI → Native LLM）
- Embedding（Workers AI → Native fallback）
- Vector Store（Pinecone/OpenAI → Native Memory）
- 搜索服務（External Search API → Native）

## 🧪 驗證檢查清單

- [ ] 所有 Provider 實現 CapabilityBase
- [ ] Native Provider 無外部 API 調用（grep "fetch\|axios\|http" 檢查）
- [ ] External Provider 提供 fallbackProviderId
- [ ] Hybrid Provider fallback 邏輯完整
- [ ] CI 合規性檢查過過
- [ ] 向後兼容性測試通過

## 📝 Migration Steps

1. **Step 1**: 復制源目錄到 `providers/{native|external|hybrid}/`
2. **Step 2**: 創建 CapabilityBase 適配文件（如 `*-cb.ts`）
3. **Step 3**: 更新 import 路徑（全局搜索替換）
4. **Step 4**: 運行測試套件驗證兼容性
5. **Step 5**: 更新 CI 配置檢查合規性
6. **Step 6**: 執行 `make lint` / npm test 驗證無 regressions
7. **Step 7**: 清理廢棄目錄 `packages/adapters/*`（確認無引用）

## ⚠️ Breaking Changes Migration

如果現有業務依賴 `packages/adapters/*`，請更新導入：

```diff
- import { OpenAIAdapter } from 'packages/adapters/openai';
+ import { OpenAIModelProvider } from 'providers/external/openai/openai-model-provider-cb';
```

## 📚 References

- ARCHITECTURE_PRINCIPLES_VALIDATION.md（架構缺口分析）
- packages/capabilities/README.md（CapabilityBase 使用指南）
- docs/architecture/platform-constitution.md（平台憲法）

## 📞 Support

如需協助遷移具體 Provider，請在 GitHub Issues 提交或聯繫平台團隊。
