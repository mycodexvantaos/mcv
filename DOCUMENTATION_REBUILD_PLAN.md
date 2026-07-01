# MyCodeXvantaOS 文檔重構計畫

> **版本:** 1.0.0  
> **日期:** 2024-05-15  
> **狀態:** 進行中

---

## 概述：加一層「神格控制平面」

本次文檔重構**不是重寫現有程式碼**，而是在既有工程基底之上，補上完整的「神格控制平面」文檔層，將專案從「模組化工程平台」升級為「治理就緒的 AI 原生服務作業系統」。

### 專案現狀

| 項目           | 狀態                                               |
| -------------- | -------------------------------------------------- |
| **Packages**   | 70 個                                              |
| **Services**   | 27 個                                              |
| **Providers**  | 25 個                                              |
| **Tests**      | 377 個全通                                         |
| **CI/CD**      | 已配置                                             |
| **技術棧**     | Turborepo, pnpm, TypeScript, Jest, ESLint 全就位   |
| **Contracts**  | 已有 service-definitions, events, schemas, openapi |
| **Migrations** | d1, sqlite, postgres 已有基礎                      |
| **Runtimes**   | cloudflare, docker, kubernetes, node 已有骨架      |
| **Infra**      | cloudflare, docker-compose, helm 已有基礎          |

### 文檔缺少的核心層

目前的文檔描述了六層架構，但缺少：

1. **五大憲政模型文檔** — Service Catalog, Resource Model, Policy Model, Audit Model, Knowledge Model
2. **記憶夢境執行時文檔** — Memory-Dream Runtime 光譜
3. **多執行時適配器文檔** — Cloudflare / Node / Docker / K8s 切換
4. **自架部署文檔** — Docker-Compose / Helm 完整指南
5. **服務目錄文檔** — 8 大分類、15 個核心服務的詳細規範
6. **API 契約文檔** — 6 大 API 光譜的完整參考

### 重構策略

| 策略               | 說明                                          |
| ------------------ | --------------------------------------------- |
| **保留現有文檔**   | 574 行的 ARCHITECTURE.md 保持不變             |
| **新增控制平面層** | 在現有層次上疊加「神格控制平面」文檔          |
| **契約優先**       | 所有文檔基於 contracts/ 目錄的 YAML/JSON 契約 |
| **光譜分層**       | 按照 10 層光譜組織文檔結構                    |
| **實作循序**       | 採用 Phase 0-7 的漸進式擴充路線               |

---

## 十層光譜架構定位

將平台定義為 10 層光譜，每層對應特定的文檔目錄：

```
spectrum-00-foundation           → docs/architecture/foundation/
spectrum-01-service-catalog      → docs/service-catalog/
spectrum-02-resource-model       → docs/resource-model/
spectrum-03-policy-governance    → docs/policy-governance/
spectrum-04-audit-trace          → docs/audit-trace/
spectrum-05-knowledge-layer      → docs/knowledge-layer/
spectrum-06-memory-dream         → docs/memory-dream/
spectrum-07-agent-control        → docs/agent-control/
spectrum-08-multi-runtime        → docs/multi-runtime/
spectrum-09-self-hostable       → docs/self-hostable/
spectrum-10-advanced-systems    → docs/advanced-systems/
```

### 光譜對應模組表

| 光譜                            | 對應模組                                    | 文檔重點                                         |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------ |
| `spectrum-00-foundation`        | core-kernel, namespaces-sdk, taxonomy-core  | 核心抽象、命名空間、分類學                       |
| `spectrum-01-service-catalog`   | service-catalog, engine-registry            | 服務定義、分類、啟用/停用                        |
| `spectrum-02-resource-model`    | resource-model                              | Resource Kind / Spec / Status                    |
| `spectrum-03-policy-governance` | policy-engine, governance-policy            | Subject / Action / Resource / Condition / Effect |
| `spectrum-04-audit-trace`       | audit-model, audit-log                      | Audit Event / Append-Only / Trace Chain          |
| `spectrum-05-knowledge-layer`   | engine-rag, ai-embedding, data-vector-store | Document / Chunk / Retrieval / Answer Trace      |
| `spectrum-06-memory-dream`      | memory-dream runtime                        | Memory Item / Dream Run / Conflict / Merge       |
| `spectrum-07-agent-control`     | ai-ensemble, engine-execution, agent-chat   | Agent 行為、對話、工作流                         |
| `spectrum-08-multi-runtime`     | runtimes/\*                                 | Cloudflare / Node / Docker / K8s 適配            |
| `spectrum-09-self-hostable`     | infra/docker-compose, infra/helm            | 自架部署、遷移、備份                             |
| `spectrum-10-advanced-systems`  | quantum, carbon, scalability systems        | 專屬進階系統                                     |

---

## 文檔目錄重構後完整結構

```
docs/
├── README.md                                    # 文檔導航中心
│
├── architecture/                                # 架構文檔（保留現有 + 新增控制平面）
│   ├── foundation/                              # Spectrum 00
│   │   ├── README.md
│   │   ├── core-kernel.md
│   │   ├── namespaces-sdk.md
│   │   ├── taxonomy-core.md
│   │   └── hexagonal-architecture.md
│   │
│   ├── service-catalog/                         # Spectrum 01
│   │   ├── README.md
│   │   ├── service-definition-spec.md
│   │   ├── service-categories.md
│   │   ├── service-registration.md
│   │   └── discovery-protocol.md
│   │
│   ├── resource-model/                          # Spectrum 02
│   │   ├── README.md
│   │   ├── resource-kind-spec.md
│   │   ├── resource-lifecycle.md
│   │   ├── metadata-schema.md
│   │   └── resource-relationships.md
│   │
│   ├── policy-governance/                       # Spectrum 03
│   │   ├── README.md
│   │   ├── policy-model-spec.md
│   │   ├── action-catalog.md
│   │   ├── condition-language.md
│   │   ├── evaluation-engine.md
│   │   └── policy-enforcement.md
│   │
│   ├── audit-trace/                             # Spectrum 04
│   │   ├── README.md
│   │   ├── audit-event-schema.md
│   │   ├── append-only-log.md
│   │   ├── trace-chain.md
│   │   ├── sha256-integrity.md
│   │   └── closed-loop-governance.md
│   │
│   ├── knowledge-layer/                         # Spectrum 05
│   │   ├── README.md
│   │   ├── document-model.md
│   │   ├── chunking-strategy.md
│   │   ├── retrieval-receipt.md
│   │   ├── answer-trace.md
│   │   └── knowledge-issues.md
│   │
│   ├── memory-dream/                            # Spectrum 06
│   │   ├── README.md
│   │   ├── memory-item-model.md
│   │   ├── memory-capture.md
│   │   ├── dream-run-spec.md
│   │   ├── memory-conflict.md
│   │   ├── memory-merge.md
│   │   ├── orphan-sweeping.md
│   │   ├── memory-reinforcement.md
│   │   └── memory-audit.md
│   │
│   ├── agent-control/                           # Spectrum 07
│   │   ├── README.md
│   │   ├── agent-behavior.md
│   │   ├── chat-protocol.md
│   │   ├── workflow-orchestration.md
│   │   └── agent-capabilities.md
│   │
│   ├── multi-runtime/                           # Spectrum 08
│   │   ├── README.md
│   │   ├── runtime-adapter-pattern.md
│   │   ├── cloudflare-runtime.md
│   │   ├── node-runtime.md
│   │   ├── docker-runtime.md
│   │   └── kubernetes-runtime.md
│   │
│   ├── self-hostable/                           # Spectrum 09
│   │   ├── README.md
│   │   ├── docker-compose-guide.md
│   │   ├── helm-chart-guide.md
│   │   ├── migration-guide.md
│   │   ├── backup-restore.md
│   │   └── disaster-recovery.md
│   │
│   ├── advanced-systems/                        # Spectrum 10
│   │   ├── README.md
│   │   ├── quantum-agentic-system.md
│   │   ├── carbon-neutral-system.md
│   │   ├── infinite-scalability-system.md
│   │   └── zero-trust-security-system.md
│   │
│   ├── ARCHITECTURE.md                          # 保留現有六層架構文檔
│   ├── architecture.md                          # 保留簡化架構文檔
│   ├── platform-draft.md                        # 保留平台草稿
│   └── platform-constitution.md                 # 新增平台憲政概念文檔
│
├── contracts/                                   # 契約參考（指向根目錄 contracts/）
│   ├── README.md
│   ├── service-definitions.md
│   ├── resource-kinds.md
│   ├── policies.md
│   ├── events.md
│   ├── openapi.md
│   └── schemas.md
│
├── api/                                         # API 參考文檔
│   ├── README.md
│   ├── platform-api.md
│   ├── knowledge-api.md
│   ├── memory-api.md
│   ├── agent-api.md
│   ├── audit-api.md
│   └── runtime-api.md
│
├── runtime/                                     # 執行時文檔
│   ├── README.md
│   ├── cloudflare-guide.md
│   ├── node-guide.md
│   ├── docker-guide.md
│   └── kubernetes-guide.md
│
├── migration/                                   # 遷移文檔（新增）
│   ├── README.md
│   ├── current-audit-baseline.md
│   ├── platform-control-plane-expansion.md
│   ├── memory-dream-adoption.md
│   └── multi-runtime-migration.md
│
├── deployment/                                  # 部署文檔（保留現有 + 擴充）
│   ├── README.md
│   ├── cloudflare-deployment.md
│   ├── docker-compose-deployment.md
│   ├── kubernetes-deployment.md
│   ├── production-checklist.md
│   └── scaling-guide.md
│
├── operations/                                  # 運維文檔（保留現有 + 擴充）
│   ├── README.md
│   ├── monitoring.md
│   ├── logging.md
│   ├── incident-response.md
│   ├── performance-tuning.md
│   └── capacity-planning.md
│
├── contributing/                                # 貢獻文檔（新增）
│   ├── README.md
│   ├── code-conventions.md
│   ├── service-registration.md
│   ├── provider-implementation.md
│   ├── contract-validation.md
│   └── testing-guidelines.md
│
├── onboarding/                                  # 入門文檔（保留現有 + 擴充）
│   ├── README.md
│   ├── quick-start.md
│   ├── naming-quick-start.md
│   ├── service-creation-guide.md
│   ├── provider-registration-guide.md
│   └── first-memory-dream.md
│
├── changelog/                                   # 變更日誌（保留現有）
│   └── naming-spec-changelog.md
│
├── architecture-decision-records/               # 架構決策紀錄（保留現有）
│   ├── adr-001-naming-model-layers.md
│   ├── adr-002-composite-separator.md
│   ├── adr-003-capability-set-design.md
│   ├── adr-004-no-version-in-canonical.md
│   └── adr-005-environment-namespace-only.md
│
├── ai-team/                                     # AI 團隊文檔（保留現有）
│   └── (現有內容保留)
│
└── analysis/                                    # 分析報告（保留現有）
    ├── COMPREHENSIVE_TEST_REPORT.md
    ├── PRIORITY_1_COMPLETION_REPORT.md
    ├── REPOSITORY_STRUCTURE_ANALYSIS.md
    ├── PHASE_1_2_COMPLETION_REPORT.md
    ├── FINAL_ENHANCEMENT_REPORT.md
    └── QUICK_START_GUIDE.md
```

---

## 核心文檔優先清單

按照實作循序，優先創建的文檔清單：

### Phase 0：文檔基建（立即）

1. `docs/README.md` — 文檔導航中心
2. `docs/migration/current-audit-baseline.md` — 封存目前狀態
3. `docs/architecture/platform-constitution.md` — 平台憲政概念文檔

### Phase 1：契約與核心模型文檔

4. `docs/contracts/README.md` — 契約參考總覽
5. `docs/architecture/service-catalog/README.md` — Service Catalog 規範
6. `docs/architecture/resource-model/README.md` — Resource Model 規範
7. `docs/architecture/policy-governance/README.md` — Policy Model 規範
8. `docs/architecture/audit-trace/README.md` — Audit Model 規範
9. `docs/architecture/knowledge-layer/README.md` — Knowledge Model 規範
10. `docs/architecture/memory-dream/README.md` — Memory Dream 規範

### Phase 2：Service Catalog 文檔

11. `docs/architecture/service-catalog/service-definition-spec.md`
12. `docs/architecture/service-catalog/service-categories.md`
13. `docs/architecture/service-catalog/discovery-protocol.md`

### Phase 3：Audit 與 Usage 文檔

14. 詳細的 audit-trace 子文檔

### Phase 4：Knowledge Trace 文檔

15. `docs/architecture/knowledge-layer/retrieval-receipt.md`
16. `docs/architecture/knowledge-layer/answer-trace.md`

### Phase 5：Memory Dream 文檔

17. `docs/architecture/memory-dream/dream-run-spec.md`
18. `docs/architecture/memory-dream/memory-conflict.md`
19. `docs/architecture/memory-dream/memory-merge.md`

### Phase 6：Cloudflare Runtime 文檔

20. `docs/runtime/cloudflare-guide.md`
21. `docs/architecture/multi-runtime/cloudflare-runtime.md`

### Phase 7：Self-Hostable 文檔

22. `docs/deployment/docker-compose-deployment.md`
23. `docs/deployment/kubernetes-deployment.md`
24. `docs/architecture/self-hostable/docker-compose-guide.md`
25. `docs/architecture/self-hostable/helm-chart-guide.md`

### API 參考文檔

26. `docs/api/README.md`
27. `docs/api/platform-api.md`
28. `docs/api/knowledge-api.md`
29. `docs/api/memory-api.md`
30. `docs/api/agent-api.md`
31. `docs/api/audit-api.md`
32. `docs/api/runtime-api.md`

---

## 文檔寫作指南

### 統一格式

每個文檔應包含：

```markdown
# [文檔標題]

> **版本:** X.Y.Z  
> **日期:** YYYY-MM-DD  
> **狀態:** Draft / Stable / Deprecated  
> **對應契約:** `contracts/xxx.yaml`  
> **對應光譜:** Spectrum-XX

---

## 概述

[簡短描述文檔目的與範圍]

## 目標

- [目標 1]
- [目標 2]

---

## 內容...

## 參考

- [契約文件](../../contracts/xxx.yaml)
- [相關文檔](../xxx/README.md)
```

### 契約優先原則

- 所有規範性文檔必須引用對應的 `contracts/` YAML/JSON 檔案
- 示例程式碼必須使用契約定義的格式
- 違反契約的行為必須明確標記為「非推薦」或「已棄用」

### 光譜標記原則

- 每個文檔必須標記其所屬光譜層次（Spectrum-00 到 Spectrum-10）
- 跨光譜的交互必須在文檔中明確說明
- 光譜內的依賴關係必須使用鏈路圖或依賴表格

### 多層級導航

- `docs/README.md` 為頂層導航
- 每個子目錄的 `README.md` 為該層導航
- 使用 Markdown 內部連結建立導航鏈路

---

## 與現有文檔的關係

| 現有文檔                   | 處理方式       | 關係                             |
| -------------------------- | -------------- | -------------------------------- |
| `ARCHITECTURE.md` (574 行) | **保留不變**   | 六層架構基礎文檔                 |
| `architecture.md` (35 行)  | **保留不變**   | 簡化架構概覽                     |
| `platform-draft.md`        | **保留不變**   | 平台草稿參考                     |
| `CICD_INTEGRATION_PLAN.md` | **保留不變**   | CI/CD 整合計畫                   |
| `integration-*.md`         | **保留不變**   | 整合分析報告                     |
| `onboarding/*.md`          | **保留並擴充** | 入門文檔，補加控制平面內容       |
| `deployment/README.md`     | **保留並擴充** | 部署文檔，補加 runtime 文檔      |
| `operations/README.md`     | **保留並擴充** | 運維文檔，補加 audit/memory 文檔 |
| `changelog/*`              | **保留不變**   | 變更日誌                         |
| `adr-*`                    | **保留不變**   | 架構決策紀錄                     |
| `ai-team/*`                | **保留不變**   | AI 團隊文檔                      |
| `analysis/*`               | **保留不變**   | 分析報告                         |

### 新增文檔不覆蓋原則

- 所有新增文檔都在 `docs/` 下新建目錄或檔案
- 保留現有檔案的原有內容，只在必要時擴充
- 使用新的檔案名稱避免衝突

---

## 實作循序

### Phase 0：文檔基建（0.5 天）

1. 封存目前狀態到 `docs/migration/current-audit-baseline.md`
2. 創建文檔導航中心 `docs/README.md`
3. 創建平台憲政概念文檔 `docs/architecture/platform-constitution.md`

### Phase 1：契約與核心模型文檔（2 天）

1. 創建五大憲政模型 README 文檔
2. 創建 Memory Dream Runtime 規範文檔
3. 創建契約參考總覽 `docs/contracts/README.md`

### Phase 2：Service Catalog 文檔（1.5 天）

1. 創建 service-definition-spec.md
2. 創建 service-categories.md
3. 創建 discovery-protocol.md

### Phase 3-4：Audit 與 Knowledge Trace 文檔（2 天）

1. 創建完整的 audit-trace 子文檔
2. 創建 knowledge-layer 子文檔

### Phase 5：Memory Dream 文檔（2 天）

1. 創建完整的 memory-dream 光譜文檔
2. 包含 dream-run-spec、conflict、merge、sweeping、reinforcement

### Phase 6：Cloudflare Runtime 文檔（1 天）

1. 創建 cloudflare-runtime.md
2. 創建 cloudflare-guide.md
3. 創建 runtime-adapter-pattern.md

### Phase 7：Self-Hostable 文檔（2 天）

1. 創建 self-hostable 子文檔
2. 擴充 deployment/README.md
3. 創建 migration-guide.md、backup-restore.md

### API 參考文檔（3 天）

1. 創建 6 大 API 參考文檔
2. 創建 api/README.md 導航

**總計：約 14 天完成所有核心文檔**

---

## 驗收標準

### 文檔完整性驗收

- [ ] 所有 10 層光譜都有對應目錄和 README.md
- [ ] 所有契約文件都在 `docs/contracts/` 中有參考文檔
- [ ] 所有 API 都在 `docs/api/` 中有參考文檔
- [ ] 現有文檔全部保留無修改（除了必要的擴充）

### 內容質量驗收

- [ ] 每個文檔都有版本、日期、狀態標記
- [ ] 每個文檔都標記對應契約和光譜
- [ ] 每個文檔都有清晰的目標和參考連結
- [ ] 沒有過時或矛盾的內容
- [ ] 所有連結都是有效的內部連結

### 導航可用性驗收

- [ ] `docs/README.md` 可以導航到所有子目錄
- [ ] 每個子目錄的 `README.md` 可以導航到所有子文檔
- [ ] 所有文檔都可以從根目錄索引跳轉

### CI/CD 驗收

- [ ] 新增 `docs-schema-check.yml` 檢查文檔格式
- [ ] 新增 `docs-link-check.yml` 檢查連結有效性
- [ ] 所有文檔都在 CI 中驗證

---

## 工具支援

### Schema 檢查工具

創建 `tools/validators/docs-validator.ts`：

```typescript
import * as yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

interface DocMetadata {
  title: string;
  version: string;
  date: string;
  status: 'Draft' | 'Stable' | 'Deprecated';
  contract?: string;
  spectrum?: string;
}

export function validateDocMetadata(filePath: string): DocMetadata | null {
  // 從文件頭部提取 metadata
  // 驗證格式是否正確
  // 返回 metadata 或 null（如果無效）
}
```

### 連結檢查工具

創建 `tools/validators/link-validator.ts`：

```typescript
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

export function checkInternalLinks(docRoot: string): { [filePath: string]: string[] } {
  // 遍歷所有 .md 文件
  // 提取所有 markdown 連結
  // 檢查連結是否指向存在的文件
  // 返回錯誤報告
}
```

### 目錄結構驗證

創建 `tools/validators/docs-structure-validator.ts`：

```typescript
export function validateDocsStructure(root: string): { valid: boolean; errors: string[] } {
  // 驗證所有必需目錄都存在
  // 驗證每個目錄都有 README.md
  // 返回驗證結果
}
```

---

## 下一步行動

1. **立即開始 Phase 0**：創建文檔基建
2. **建立 feature branch**：`feat/documentation-rebuild`
3. **創建 Pull Request**：完成 Phase 0 後建立 PR 供審閱
4. **循序執行 Phase 1-7**：每完成一個 Phase 建立一個 PR

---

## 參考資料

- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [Diataxis Documentation Framework](https://diataxis.fr/)
- [Write the Docs](https://www.writethedocs.org/)
- [The Tao of README](https://github.com/noffle/art-of-readme)

---

**結論：** 本次文檔重構不是推倒重來，而是在現有工程基礎上，加一層完整的「神格控制平面」文檔層，將 MyCodeXvantaOS 從模組化工程平台升級為治理就緒的 AI 原生服務作業系統。
