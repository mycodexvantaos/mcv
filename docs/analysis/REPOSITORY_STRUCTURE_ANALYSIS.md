# MyCodeXvantaOS 倉庫深度結構分析報告

**分析日期**: 2026-05-05  
**倉庫**: https://github.com/mycodexvantaos/mycodexvantaos.git  
**版本**: v1.0.0  
**分析範圍**: 全域架構、六層模型、治理規格、CI/CD、AI 流程、基礎設施

---

## 一、全域概覽

MyCodeXvantaOS 是一個量子感知（Quantum-Aware）的企業級平台作業系統，採用六層架構模型設計，涵蓋從應用建構到治理合規的完整生命週期。倉庫規模龐大，包含 **66 個套件**、**21 個模組**、**24 個服務**、**36 個提供者**，以及 **37 個 GitHub Actions 工作流程**。

### 核心身份

| 屬性          | 值                       |
| ------------- | ------------------------ |
| 組織識別      | `mycodexvantaos`         |
| NPM Scope     | `@mycodexvantaos`        |
| URN 命名空間  | `urn:mycodexvantaos`     |
| 內部協定      | `mycodexvantaos://`      |
| OCI Registry  | `ghcr.io/mycodexvantaos` |
| K8s API Group | `mycodexvantaos.quantum` |
| CRD Group     | `mycodexvantaos.quantum` |

---

## 二、六層架構模型 (Six-Layer Architecture)

### Layer A: 建構層 (Builder Layer)

**職責**: 應用開發、UI 生成、開發工作室

| 套件                                      | 功能           |
| ----------------------------------------- | -------------- |
| `packages/builder`                        | 核心建構框架   |
| `packages/ui-generator`                   | UI/UX 生成能力 |
| `services/mycodexvantaos-studio-platform` | 開發工作室平台 |
| `services/mycodexvantaos-app-dev-studio`  | 應用開發工作室 |

**前端應用 (Next.js Admin Dashboard)**:

- 主控台首頁 (`/dashboard`)
- 架構定義 (`/dashboard/architecture`)
- CI/CD 管線生成 (`/dashboard/pipeline`)
- 風險分析 (`/dashboard/analysis`)
- 架構精煉建議 (`/dashboard/refinement`)
- 檢查清單驗證 (`/dashboard/checklists`)
- 全域脈搏感知 (`/dashboard/pulse`)
  | 零樣工具鍛造 (`/dashboard/forge`)
  | 共識引擎 (`/dashboard/consensus`)
  | 情報中心 (`/dashboard/intelligence`)
  | 協議管理 (`/dashboard/protocol`)
  | 蜂群編排 (`/dashboard/swarm`)
  | 歷史紀錄 (`/dashboard/history`)
  | 報表中心 (`/dashboard/reports`)
  | 管理後台 (`/admin`) — 含 architecture、scenarios、security、settings、trends

### Layer B: 執行層 (Runtime Layer)

**職責**: 運行時管理、工作流編排、任務執行

| 套件                              | 功能           |
| --------------------------------- | -------------- |
| `packages/runtime`                | 運行時核心     |
| `packages/execution`              | 任務執行引擎   |
| `packages/workflow-generator`     | 工作流生成器   |
| `packages/session-runtime`        | 會話運行時     |
| `packages/background-job-runtime` | 背景作業運行時 |
| `packages/plugin-loader`          | 插件載入器     |

### Layer C: 原生服務層 (Native Services Layer)

**職責**: 平台核心基礎服務，為上層提供穩定的基礎設施抽象

**核心域 (Core Domain)**:

| 服務                          | 能力                                       |
| ----------------------------- | ------------------------------------------ |
| `mycodexvantaos-core-kernel`  | 核心內核：資料庫、快取、可觀測性、密鑰管理 |
| `mycodexvantaos-core-auth`    | 認證授權：Keycloak / JWT 原生              |
| `mycodexvantaos-core-gateway` | API 閘道：JWT 認證、可觀測性、快取         |
| `mycodexvantaos-core-config`  | 組態管理                                   |

**AI 域 (AI Domain)**:

| 服務                             | 能力                                                  |
| -------------------------------- | ----------------------------------------------------- |
| `mycodexvantaos-ai-embedding`    | 嵌入生成：OpenAI / Cohere / Ollama                    |
| `mycodexvantaos-ai-llm`          | LLM 推理：OpenAI / Gemini / Anthropic / Ollama        |
| `mycodexvantaos-ai-memory`       | AI 記憶體：向量存儲 (pgvector/Qdrant)、嵌入、狀態存儲 |
| `mycodexvantaos-ai-agent`        | AI 代理：工具鍛造、自主決策                           |
| `mycodexvantaos-ai-ensemble`     | AI 集成：多模型協同                                   |
| `mycodexvantaos-ai-team-service` | AI 團隊服務：多代理編排                               |
| `mycodexvantaos-persona-engine`  | 人格引擎：語義面具、人格輪廓                          |

**資料域 (Data Domain)**:

| 服務                               | 能力                        |
| ---------------------------------- | --------------------------- |
| `mycodexvantaos-data-graph`        | 知識圖譜：Neo4j / Memgraph  |
| `mycodexvantaos-data-pipeline`     | 資料管線：流處理、轉換      |
| `mycodexvantaos-data-vector-store` | 向量存儲：pgvector / Qdrant |

**平台域 (Platform Domain)**:

| 服務                                    | 能力                                 |
| --------------------------------------- | ------------------------------------ |
| `mycodexvantaos-platform-scheduler`     | 任務排程：Temporal                   |
| `mycodexvantaos-platform-notification`  | 通知服務：SendGrid                   |
| `mycodexvantaos-platform-observability` | 可觀測性：Prometheus / OpenTelemetry |
| `mycodexvantaos-platform-validation`    | 平台驗證                             |

**安全域 (Security Domain)**:

| 服務                                 | 能力                                 |
| ------------------------------------ | ------------------------------------ |
| `mycodexvantaos-security-secrets`    | 密鑰管理：K8s 原生 / HashiCorp Vault |
| `mycodexvantaos-security-validation` | 安全驗證：Trivy 掃描                 |

**治理域 (Governance Domain)**:

| 服務                               | 能力                                |
| ---------------------------------- | ----------------------------------- |
| `mycodexvantaos-governance-policy` | 策略引擎：OPA / 策略即程式碼        |
| `mycodexvantaos-docs-search`       | 文件搜尋：Elasticsearch / Typesense |

### Layer D: 連接器層 (Connector Layer)

**職責**: 外部系統整合、提供者註冊、服務發現

**36 個已註冊提供者**，分佈於 19 個能力類別：

| 能力 (Capability) | 提供者                                                        |
| ----------------- | ------------------------------------------------------------- |
| `database`        | postgres (外部), sqlite (原生)                                |
| `vector-store`    | pgvector (外部), qdrant (外部)                                |
| `llm`             | openai (外部), gemini (外部), anthropic (beta), ollama (原生) |
| `embedding`       | openai (外部), cohere (外部), ollama (原生)                   |
| `auth`            | keycloak (外部), jwt-native (原生)                            |
| `cache`           | redis (外部)                                                  |
| `queue`           | kafka (外部), rabbitmq (外部)                                 |
| `search`          | elasticsearch (外部), typesense (外部)                        |
| `graph`           | neo4j (外部), memgraph (外部)                                 |
| `observability`   | prometheus (外部), opentelemetry (外部)                       |
| `secrets`         | vault (外部), k8s-native (原生)                               |
| `security`        | trivy (外部)                                                  |
| `storage`         | s3 (外部), minio (外部)                                       |
| `deploy`          | firebase (外部), argocd (外部), native (原生)                 |
| `notification`    | sendgrid (外部)                                               |
| `scheduler`       | temporal (外部)                                               |
| `state-store`     | redis (外部)                                                  |
| `validation`      | zod (原生)                                                    |
| `repo`            | github (外部)                                                 |

### Layer E: 部署層 (Deployment Layer)

**職責**: 容器編排、GitOps、環境管理

- **Kubernetes 基礎設施**:
  - `infra/kubernetes/base/` — 每個服務的 Deployment、ConfigMap、Service
  - `infra/kubernetes/namespaces/` — dev / staging / prod 命名空間
  - `infra/kubernetes/overlays/` — Kustomize 環境覆蓋

- **Helm Charts**:
  - `infra/helm/mycodexvantaos/` — 含 values.yaml 及三環境覆蓋
  - 全域映像倉庫: `ghcr.io`

- **ArgoCD GitOps**:
  - 自動同步策略 (prune + selfHeal)
  - 三環境命名空間 (dev / staging / prod)
  - 來源倉庫: `https://github.com/mycodexvantaos/mycodexvantaos.git`

### Layer F: 治理層 (Governance Layer)

**職責**: 平台規格強制執行、命名約束、審計追蹤

- **全域治理規格** (`governance/platform-governance-spec.yaml`):
  - 三層命名閉環模型 (Naming Closure Model v3.0)
  - 禁止的舊版前綴: `mycodexvanta-os`, `codexvanta`, `codexvanta-os`, `KUBO`, `codevantaos`
  - 強制執行等級: `mandatory`
  - 不可變更鎖定日: 2026-01-01

- **能力集合** (`governance/capability-set.yaml`):
  - 19 個標準化能力 ID
  - 每個能力含 category 和 stable 標記

- **提供者註冊表** (`governance/provider-registry.yaml`):
  - 36 個已註冊提供者
  - 格式: `<capability-id>-<provider-name>`
  - 每個提供者標記 isNative / lifecycle

---

## 三、AI 流程體系 (Genkit AI Flows)

平台整合 Google Genkit AI 框架，使用 Gemini 2.5 Flash 模型，共實現 **11 個 AI 流程**：

| 流程                                   | 用途                       | 輸入                       | 輸出                      |
| -------------------------------------- | -------------------------- | -------------------------- | ------------------------- |
| `zero-shot-tool-forge`                 | 零樣本工具鍛造與自我修正   | 環境描述 + 任務目標        | 生成程式碼 + 逆向工程報告 |
| `generate-ci-cd-pipeline`              | CI/CD 管線自動生成         | 架構描述 + 部署策略        | GitLab CI/CD YAML 配置    |
| `advanced-analysis-flow`               | 高級分析與情報合成引擎     | 多維度模式選擇             | 語義搜尋 / OCR / 合規分析 |
| `analyze-architecture-for-risks`       | 架構風險與合規分析         | 架構定義 + CI/CD 配置      | 風險清單 + 單點故障識別   |
| `validate-and-suggest-checklists`      | 零故障檢查清單驗證         | 架構定義 + 管線配置        | 合規報告 + 新策略建議     |
| `suggest-architecture-refinements`     | 架構精煉建議               | 當前架構 + 目標 + 歷史事件 | 彈性模式建議              |
| `global-pulse-sensing`                 | 全域脈搏感知與自主任務生成 | 地區 + 資料流              | 異常檢測 + 自主任務       |
| `vulnerability-scanner-flow`           | 漏洞掃描                   | package.json 內容          | CVE 清單 + 修復建議       |
| `conversational-ai-assistant`          | 對話式 AI 助理             | 查詢 + 程式碼片段          | 解釋 + 偵錯建議           |
| `ai-code-completion-flow`              | AI 程式碼補全              | 程式碼 + 語言 + 游標位置   | 補全建議                  |
| `ai-research-data-summarization`       | 研究資料摘要               | 研究資料區塊               | 結構化摘要                |
| `ai-agent-code-generation-refactoring` | AI 代理程式碼生成/重構     | 任務描述 + 程式碼上下文    | 生成/重構/測試程式碼      |

---

## 四、知識圖譜與向量存儲

### 知識圖譜

```
knowledge-graph/
├── indexes/          # 6 個圖索引 (核心服務 ID、使用者 Email 等)
├── namespaces/       # 6 個 Turtle 命名空間定義
│   ├── ns-ai.ttl
│   ├── ns-core.ttl
│   ├── ns-data.ttl
│   ├── ns-governance.ttl
│   ├── ns-platform.ttl
│   └── ns-security.ttl
├── relations/        # 7 種關係類型 (DEPENDS_ON, IMPLEMENTS, etc.)
└── seeds/            # Cypher 種子資料
    ├── capability-provider-map-seed.cypher
    └── core-services-seed.cypher
```

**圖譜關係類型**:

| 關係                  | 方向                         | 描述               |
| --------------------- | ---------------------------- | ------------------ |
| `DEPENDS_ON`          | Service → Capability/Service | 服務依賴能力或服務 |
| `IMPLEMENTS`          | Service → Capability         | 服務實現標準化能力 |
| `PROVIDES_CAPABILITY` | Provider → Capability        | 提供者實例提供能力 |
| `HAS_VECTOR_INDEX`    | Service → VectorCollection   | 服務擁有向量集合   |
| `GOVERNED_BY`         | Resource → Policy            | 資源受策略約束     |
| `REPLACED_BY`         | Resource → Resource          | 已棄用資源指向替代 |
| `AUDITED_BY`          | Resource → AuditLog          | 資源受審計記錄     |

### 向量存儲

```
vector-store/
├── collections/              # 6 個向量集合
│   ├── ai-memory--memories (bge-small-384d)
│   ├── ai-memory--sessions (openai-1536d)
│   ├── data-pipeline--artifacts (ollama-768d)
│   ├── data-vector-store--datasets (openai-3072d)
│   ├── docs-search--chunks (cohere-1024d)
│   └── docs-search--docs (openai-1536d)
├── embedding-model-aliases/  # 6 個嵌入模型別名
│   ├── cohere--embed-english-v3--1024d
│   ├── cohere--embed-multilingual-v3--1024d
│   ├── ollama--bge-small--384d
│   ├── ollama--nomic-embed-text--768d
│   ├── openai--text-embedding-3-large--3072d
│   └── openai--text-embedding-3-small--1536d
└── retrieval-pipelines/      # 6 個檢索管線
    ├── dense--pgvector
    ├── dense--qdrant
    ├── hybrid--pgvector
    ├── hybrid--qdrant
    ├── sparse--memory
    └── sparse--pgvector
```

---

## 五、CI/CD 與安全工作流 (37 個)

### 統一 CI 管線 (`unified-ci.yaml`)

7 階段流水線: Lint & Format → Architecture Validation → Build → Test → Module Tests → Service Tests → CI Summary

### 統一 CD 管線 (`unified-cd.yaml`)

5 階段部署: Prepare → Build Artifacts → Security Scan → Deploy → Verify

### 治理檢查 (`governance-check.yaml`)

4 大驗證: Naming Convention → API Contract → Drift Detection → OPA Policy

### 安全掃描工作流

| 工作流                   | 用途                  |
| ------------------------ | --------------------- |
| `codeql-analysis.yml`    | CodeQL 程式碼安全分析 |
| `gitleaks.yaml`          | Git 密鑰洩漏檢測      |
| `trivy-scan.yaml`        | 容器漏洞掃描          |
| `checkov-scan.yaml`      | 基礎設施即程式碼掃描  |
| `semgrep.yaml`           | 語義程式碼分析        |
| `security-scan.yaml`     | 綜合安全掃描          |
| `dependency-review.yaml` | 依賴審查              |

### 部署與發布

| 工作流                      | 用途         |
| --------------------------- | ------------ |
| `release.yml`               | 標準發布流程 |
| `release-consolidated.yaml` | 統一發布流程 |
| `provenance-attest.yaml`    | 來源證明     |
| `sbom-upload.yaml`          | SBOM 上傳    |

---

## 六、GitOps 控制平面

### 證據驗證器 (Evidence Verifier)

- CI/CD 管線證據收集與驗證
- Merkle Root 內容定址存儲計算
- 三種運行模式: native / hybrid / connected

### ChatOps 整合

- `auto-fix-bot.provider.ts` — 自動修復機器人
- `gateway-ts.provider.ts` — TypeScript 閘道提供者

### 跨框架整合

- `api-client.provider.ts` — API 客戶端
- `cache-manager.provider.ts` — 快取管理器
- `logger.provider.ts` — 日誌提供者
- `zip-synthesis.provider.ts` — ZIP 合成提供者

---

## 七、Schema 與目錄體系

### 標準化 Schema (15 個)

```
schemas/
├── ai-team/
│   ├── agent-message.schema.json
│   ├── agent-profile.schema.json
│   ├── agent-task.schema.json
│   └── team-topology.schema.json
├── persona/
│   ├── persona-profile.schema.json
│   └── semantic-mask.schema.json
├── capability-definition.schema.json
├── embedding-model-alias.schema.json
├── exception-record.schema.json
├── naming-policy.schema.json
├── provider-manifest.schema.json
├── retrieval-pipeline.schema.json
├── service-manifest.schema.json
└── vector-collection.schema.json
```

### 目錄服務

```
catalog/
├── capability-matrix.yaml     # 服務→能力映射矩陣
├── provider-map.yaml          # 能力→提供者映射
├── service-catalog.yaml       # 完整服務目錄 (含 URN)
└── urn-registry.yaml          # URN 註冊表
```

---

## 八、架構設計特徵分析

### 優勢

1. **嚴格的命名閉環模型**: 三層終止模型確保命名一致性，禁止舊版前綴防止退化
2. **能力驅動架構**: 19 個標準化能力 ID 作為平台契約，實現能力與實現解耦
3. **提供者抽象模式**: 36 個提供者支援原生/外部切換，fallback 機制確保可用性
4. **完整的 GitOps 閉環**: ArgoCD + Evidence Verifier + Merkle Root 構成不可篡改的部署證據鏈
5. **知識圖譜驅動**: 6 個命名空間 + 7 種關係類型實現服務依賴的自動推理
6. **多模型 AI 策略**: 11 個 Genkit 流程涵蓋從程式碼生成到風險分析的完整 AI 能力
7. **環境隔離**: Kustomize overlays + Helm values 實現 dev/staging/prod 三環境隔離

### 待改進領域

1. **continue-on-error 移除**: 依據使用者要求，CI/CD 工作流中的 continue-on-error 需移除
2. **AI 倫理/區塊鏈專家整合**: 建議在專精階段整合 AI 倫理或區塊鏈專家能力
3. **治理事件流閉環**: 強制性的治理事件流閉環尚未完整實現
4. **API 路由不足**: 目前僅有 2 個 API 路由 (`/api/data`, `/api/user/profile`)，需擴充以支援全部服務
5. **TypeScript 類型錯誤**: `project-import/` 目錄中的舊版程式碼存在類型錯誤
6. **NPM 安全漏洞**: 50 個已知漏洞 (4 low, 33 moderate, 10 high, 3 critical)
7. **Cloudflare 整合**: 目前僅有 Firebase 部署提供者，Cloudflare 專案整合尚未完成

---

## 九、架構依賴圖

```
                    ┌─────────────────────┐
                    │   Admin Dashboard   │  ← Next.js 15.5 + React 19
                    │   (Layer A - UI)    │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   AI Flows (Genkit) │  ← Gemini 2.5 Flash
                    │   11 AI 流程        │
                    └─────────┬───────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
   ┌──────▼──────┐   ┌───────▼──────┐   ┌───────▼──────┐
   │  AI Domain  │   │  Core Domain │   │  Data Domain │
   │ (7 服務)    │   │  (4 服務)    │   │  (3 服務)    │
   └──────┬──────┘   └───────┬──────┘   └───────┬──────┘
          │                  │                   │
          └──────────────────┼───────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Provider Layer │  ← 36 Providers
                    │  (Layer D)      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Infrastructure │  ← K8s + Helm + ArgoCD
                    │  (Layer E)      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Governance     │  ← Naming Closure v3.0
                    │  (Layer F)      │     Capability Set v1.0
                    └─────────────────┘
```

---

## 十、技術棧摘要

| 層級     | 技術                                                                  |
| -------- | --------------------------------------------------------------------- |
| 前端     | Next.js 15.5.9, React 19, Tailwind CSS, shadcn/ui, Radix UI, Recharts |
| AI       | Google Genkit, Gemini 2.5 Flash, Zod Schema                           |
| 後端     | Node.js 20, TypeScript 5, pnpm 10                                     |
| 資料庫   | PostgreSQL, SQLite, Redis, Neo4j/Memgraph                             |
| 向量     | pgvector, Qdrant, OpenAI/Cohere/Ollama Embeddings                     |
| 訊息     | Kafka, RabbitMQ                                                       |
| 搜尋     | Elasticsearch, Typesense                                              |
| 容器     | Docker, Kubernetes, Helm, Kustomize                                   |
| GitOps   | ArgoCD, Merkle Root, Evidence Verification                            |
| CI/CD    | GitHub Actions (37 workflows), PNPM                                   |
| 安全     | Trivy, Gitleaks, Semgrep, Checkov, CodeQL, OPA                        |
| 部署     | Firebase App Hosting, ArgoCD, Native                                  |
| 可觀測性 | Prometheus, OpenTelemetry                                             |
| 密鑰     | HashiCorp Vault, K8s Native Secrets                                   |
| 認證     | Keycloak, JWT Native                                                  |

---

_本報告由 MyCodeXvantaOS 自動生成，基於 2026-05-05 倉庫快照分析_
