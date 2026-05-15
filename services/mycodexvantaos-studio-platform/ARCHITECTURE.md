# MyCodeXvantaOS 統一架構規範 v1.0

## 核心宣言

**平台必須先能自我成立，再選擇是否連接外部能力；契約必須先穩定，再允許替換實作；部署可以變動，但核心語義不可漂移；治理必須可執行，而非僅存在於文件中。**

**一句話定義：**
MyCodeXvantaOS 是一個 Local-first、Provider-agnostic、Contract-driven 的全棧應用操作系統，能在零外部依賴下完成生成、執行、驗證、發布與回滾。

---

## 一、四大核心原則 (Architecture Invariants)

這四條原則是平台的最高指導，所有設計決策都必須符合，並由 CI/CD 流程強制驗證。

### 1.1 Local-first (原生優先)

- **原則**：平台必須能在零外部依賴下存活。允許功能降級，但不允許系統崩潰。
- **要求**：所有核心能力都必須具備一個 `native` 的本地實現。
- **範例**：沒有連接 Redis，平台依然可以使用基於內存或檔案的隊列；沒有連接 GitHub，平台依然可以透過本地 Git 進行版本控制與發布。

### 1.2 Provider-agnostic (供應商中立)

- **原則**：業務邏輯不允許直接耦合任何第三方 SDK。所有外部能力都必須透過標準化的 `Provider` 抽象介面接入。
- **要求**：更換 `Provider` 的具體實現（例如從 AWS S3 切換到 MinIO）不應需要修改核心業務代碼。
- **範例**：業務代碼依賴 `StorageProvider` 介面，而不是直接 `import { S3Client } from "@aws-sdk/client-s3";`。

### 1.3 Contract-first (契約優先)

- **原則**：介面定義先於功能實現。
- **要求**：服務間的所有互動都必須基於明確定義的契約（如 OpenAPI、gRPC、AsyncAPI）。實現可以替換，但契約必須保持穩定。
- **範例**：在開發新功能前，首先在 `contracts/` 目錄下定義其 API 規格。

### 1.4 Governance-enforced (治理強制)

- **原則**：所有治理規則必須是機器可讀、可自動執行的，而非僅存在於文件中。
- **要求**：命名規範、依賴規則、安全策略等，都必須有對應的 CI/CD 閘門來自動驗證，違規的程式碼將被阻止合併。
- **範例**：一個不符合 `mycodexvantaos-<domain>-<capability>` 格式的服務目錄名，將會導致 CI/CD pipeline 失敗。

---

## 二、平台分層架構 (Architecture Layers)

平台採用嚴格的分層模型，確保職責分離與單向依賴。

### Layer A: Builder Layer (生成層)

- **職責**：從需求、模板或配置生成完整的應用骨架與產物。
- **包含**：UI generator, API generator, Schema generator, Workflow generator, Test generator, Deployment manifest generator.
- **輸出**：`frontend/`, `backend/`, `shared/`, `schema/`, `workflows/`, `deploy/`, `tests/`, `docs/`.

### Layer B: Runtime Layer (執行層)

- **職責**：讓 Layer A 生成的產物真正可執行。
- **包含**：Frontend runtime, Backend runtime, API runtime, Session runtime, Background job runtime, Scheduler, Task orchestrator, Event dispatcher, Plugin loader.
- **要求**：必須能在沒有外部 DB、Queue 或 CI/CD 的情況下運行。

### Layer C: Native Services Layer (原生服務層)

- **職責**：提供平台原生服務，形成 `local-first` 閉環的根基。
- **必備服務**：Native Database (SQLite), Native Storage (Local FS), Native Auth (Session-based), Native Secrets, Native Queue (In-memory/DB-backed), Native Logging, Native Validation Engine.

### Layer D: Connector Layer (連接器層)

- **職責**：可插拔地對接所有外部服務與平台。
- **範例**：GitHub/GitLab, Redis/Kafka, PostgreSQL/Supabase, S3/GCS, Auth0/Keycloak, Stripe/Notion/Sentry.
- **規則**：完全可選、可替換、可禁用，且不應破壞平台在 `native` 模式下的核心功能。

### Layer E: Deployment Target Layer (部署目標層)

- **職責**：處理最終的部署輸出，將應用部署到不同的目標環境。
- **支援目標**：Internal platform deployment, Static hosting, Docker/Compose, Kubernetes, Serverless platforms, External CI/CD pipelines.

---

## 三、運行時模式 (Runtime Modes)

平台在啟動時會根據配置和環境就緒狀態解析出唯一的運行模式，此模式在運行期間不可變更。

- **Native Mode**: 零外部依賴，所有核心能力均由 Layer C 的原生服務提供。適用於本地開發、離線環境和 CI/CD 測試。
- **Connected Mode**: 完全整合外部服務，所有核心能力均由 Layer D 的連接器提供。適用於正式生產環境，以獲得最佳性能和可用性。
- **Hybrid Mode**: 混合模式，部分能力使用原生服務，部分使用外部服務，並支援降級策略（Fallback）。這是最常見的成熟形態。
- **Auto Mode**: 這是一個解析策略，而非最終模式。它會根據 `.env` 配置意圖和 Provider 的健康檢查結果自動決定進入 `native`, `connected`, 或 `hybrid` 中的一種。

---

## 四、Provider 抽象模型

所有核心能力都必須透過標準化的 `Provider` 介面進行抽象。

### 4.1 標準能力清單 (Canonical Capabilities)

平台定義了一組標準能力，每個 `Provider` 都必須實現其中之一。

- `database`, `storage`, `auth`, `queue`, `state-store`, `secrets`, `repo`, `deploy`, `validation`, `security`, `observability`, `notification`, `scheduler`, `vector-store`, `embedding`, `llm`, `graph`, `cache`, `search`.

### 4.2 Provider 契約

每個 `Provider` 實作都必須符合以下介面契約：

```typescript
interface BaseProvider {
  // 能力標識，例如 'database'
  readonly capability: string;
  // 來源標識，'native' 或 'external'
  readonly source: 'native' | 'external' | 'hybrid';
  // 初始化
  initialize?(config?: unknown): Promise<void>;
  // 健康檢查
  healthCheck(): Promise<boolean>;
  // 安全關閉
  shutdown?(): Promise<void>;
}
```

---

## 五、平台最小閉環 (Minimum Native Closed Loop)

以下 12 項能力必須在 **零第三方服務依賴** 的 `native` 模式下完全成立，這是平台架構的核心驗收標準。

1.  **專案建立**:能夠初始化一個新專案。
2.  **前端生成**: 能夠生成可運行的前端應用。
3.  **後端生成**: 能夠生成可運行的後端服務與 API。
4.  **資料結構生成**: 能夠生成資料庫 schema 與遷移文件。
5.  **應用執行**: 能夠在本地啟動完整的應用。
6.  **本地預覽**: 提供可訪問的本地預覽 URL。
7.  **數據持久化**: 能夠使用原生資料庫（如 SQLite）保存應用狀態。
8.  **密鑰管理**: 能夠使用本地文件或環境變數管理密鑰。
9.  **驗證與掃描**: 能夠執行基本的程式碼和安全驗證。
10. **內建發布**: 能夠將應用發布到一個平台內建的目標。
11. **版本與回滾**: 能夠記錄發布版本並回滾到先前版本。
12. **日誌與狀態**: 能夠查看應用的執行日誌與基本狀態。

---

## 六、設計反模式 (Anti-Patterns)

以下設計模式嚴重違反平台核心原則，必須在架構審查和 CI/CD 流程中被嚴格禁止：

- **Third-party-first**: 將第三方服務（如 GitHub/Redis/Supabase）作為平台成立的先決條件。
- **SDK Leakage**: 在核心業務邏輯中直接 `import` 第三方服務的 SDK。
- **Runtime Hard-binding**: 在沒有配置外部 `Provider` 的情況下，系統啟動失敗而不是優雅降級到 `native` 實現。
- **Provider-coupled Orchestration**: 在工作流或業務編排邏輯中，寫死針對特定 `Provider`（如 Redis 或 AWS SQS）的調用邏輯。
- **Non-portable Deployment**: 生成的部署產物（如 Dockerfile 或 K8s manifests）只能在單一雲廠商環境下運行。
- **Secret-source Lock-in**: 系統設計為只能從單一的密鑰管理服務（如 AWS Secret Manager）讀取配置。
