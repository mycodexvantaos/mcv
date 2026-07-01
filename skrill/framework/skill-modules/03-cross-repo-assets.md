# 模組三：可跨 repo / 跨專案整合的工程資產

> **Module**: 03-cross-repo-assets
> **Category**: Output Category 3
> **Purpose**: 識別、分類、規範化可在任意 repo 中直接使用的工程資產

---

## 模組定義

此模組負責從分析對象中識別出「可遷移資產」——即那些不依賴特定業務邏輯、可以被直接抽取並在其他 repo 或專案中使用的工程構件。

**核心問題**：

> 這份資料中，哪些部分可以打包後直接放進另一個 repo，零配置或最少配置即可運行？

---

## 資產類別體系

### Category A: Architecture Patterns（架構模式）

**定義**：可重用的架構設計方案，描述問題-解決方案對。

**遷移路徑**：

```text
Source: 任意 docs/architecture/*.md 或 ADR 文件
Target: skrill/patterns/<name>.md
Format: Pattern 標準格式（見 extraction-framework.md Layer 2）
```

**已識別的核心模式**：

```text
- unified-gate-system          (Unified Gate System)
- namespace-governance         (Namespace Closure Governance)
- ai-context-governance        (AI Context Safety)
- provider-decoupling          (Provider Abstraction)
- semantic-decision-pipeline   (Semantic Decision Pipeline)
- resilience-toolkit           (Circuit Breaker + Retry + Fallback)
- terminology-governance       (Terminology Governance)
- test-complexity-gate         (Test Complexity as CI Gate)
- manifest-boundary-taxonomy   (Manifest Type Boundary Design)
- specification-freeze         (Architecture Baseline Control)
```

**Pattern 質量評分**：

```text
Gold:    完整的 Problem/Context/Solution/Tradeoffs + CI Enforcement
Silver:  有 Problem/Solution + 基本 Implementation Guide
Bronze:  有 Problem/Solution，缺少 CI Enforcement 或詳細 Tradeoffs
```

---

### Category B: CI/CD Governance Rules（CI/CD 治理規則）

**定義**：可插入任意 repo `.github/workflows/` 的 GitHub Actions workflow 模板。

**遷移路徑**：

```text
Source: 當前 repo .github/workflows/*.yml
Target: .github/workflows/<name>.yml（目標 repo）
Requires: 審查環境變數依賴，修改觸發條件
```

**核心 CI 資產清單**：

| Workflow                      | 功能              | 遷移難度                          |
| ----------------------------- | ----------------- | --------------------------------- |
| `architecture-governance.yml` | 架構邊界驗證      | Medium（需配置規則路徑）          |
| `ai-context-governance.yml`   | AI 上下文治理     | Medium（需配置 redaction rules）  |
| `terminology-lint.yml`        | 術語一致性檢查    | Low（需提供 dictionary 文件）     |
| `provider-boundary-check.yml` | Provider 邊界驗證 | Medium（需配置 adapter 白名單）   |
| `sdk-contract-check.yml`      | SDK 合約驗證      | Low（需指定 OpenAPI 路徑）        |
| `service-complexity-gate.yml` | 服務複雜度門控    | Medium（需設定閾值）              |
| `namespace-closure-check.yml` | 命名空間閉環驗證  | High（需配置 namespace registry） |
| `manifest-boundary-lint.yml`  | Manifest 邊界驗證 | Low（需指定 manifest 路徑）       |

**CI 資產標準格式**：

```yaml
# <workflow-name>.yml
name: <Workflow 名稱>
on:
  pull_request:
    types: [opened, synchronize]

env:
  # 配置點：使用者需要設定這些變數
  RULES_PATH: '<path to governance rules>'
  THRESHOLD: '<threshold value>'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run validation
        run: <command>
      - name: Report results
        if: failure()
        run: <report command>
```

---

### Category C: Schema Contracts（Schema 契約）

**定義**：可被多個 repo 共用的 JSON Schema / OpenAPI / AsyncAPI 定義。

**遷移路徑**：

```text
Source: contracts/openapi/*.yaml, contracts/asyncapi/*.yaml
Target: schemas/<name>.yaml（目標 repo）或 發布到 Schema Registry
```

**核心 Schema 資產**：

```text
- openapi-contract.yaml         主 API 規格（公開 API）
- asyncapi-events.yaml          事件匯流排合約
- module-manifest.schema.json   模組清單 Schema
- provider-manifest.schema.json Provider 清單 Schema
- foundation.schema.json        Foundation 規格 Schema
- gate-catalog.schema.json      Gate 目錄 Schema
- naming-policy.schema.json     命名規則 Schema
```

**Schema 版本策略**：

```text
Major bump: Breaking changes（欄位刪除、類型變更）
Minor bump: Backwards-compatible additions（新增欄位）
Patch bump: Documentation / description updates
```

---

### Category D: Automation Tools（自動化工具）

**定義**：可獨立執行的 CLI 工具、驗證腳本、生成腳本。

**遷移路徑**：

```text
Source: scripts/*.py, tools/*.ts, ci/*.ts
Target: scripts/<name> 或 packages/<tool-name>/（目標 repo）
```

**核心工具資產**：

| 工具                               | 語言       | 功能                     | 遷移難度 |
| ---------------------------------- | ---------- | ------------------------ | -------- |
| `validate-foundation-structure.py` | Python     | 驗證 foundation 目錄結構 | Low      |
| `validate-architecture.ts`         | TypeScript | 驗證架構規範合規性       | Medium   |
| `naming-closure-prover.ts`         | TypeScript | 驗證命名空間閉環         | High     |
| `service-id-parser.ts`             | TypeScript | 解析服務 ID 格式         | Low      |
| `terminology_linter.py`            | Python     | 術語一致性檢查           | Low      |
| `regex-table.ts`                   | TypeScript | 命名規則正則表達式庫     | Low      |
| `complexity-analyzer.ts`           | TypeScript | 服務複雜度分析           | Medium   |

**工具標準介面**：

```bash
# 每個工具必須支援以下介面
<tool> --help              # 顯示說明
<tool> --config <path>     # 指定配置檔
<tool> --output json       # JSON 格式輸出
<tool> --strict            # 嚴格模式（失敗時 exit 1）
```

---

### Category E: Governance Configuration（治理配置）

**定義**：可被其他 repo 參考的治理規則配置文件。

**核心配置資產**：

```text
governance/platform-governance-spec.yaml  — 平台治理規格
governance/naming-policy.schema.json      — 命名規則 Schema
governance/capability-set.yaml            — 能力集定義
governance/provider-registry.yaml         — Provider 登記冊
governance/exceptions.yaml               — 例外控制
.prettierrc                               — 格式化配置
.eslintrc.json                            — Lint 配置
.gitleaks.toml                            — Secret 掃描配置
.yamllint                                 — YAML lint 配置
```

---

### Category F: Deployment Blueprints（部署藍圖）

**定義**：可作為生產部署參考的 K8s/Helm/Docker 配置。

**核心部署資產**：

```text
infra/kubernetes/base/          — K8s 基礎配置
infra/docker-compose/           — Docker Compose 配置
platform/helm/                  — Helm chart 模板
platform/service-catalog.yaml   — 服務目錄
argocd/                         — ArgoCD GitOps 配置
```

---

## 資產遷移協議

### 遷移前評估 (Pre-Migration Assessment)

```text
CHECK 1: 業務邏輯耦合度
  是否包含特定業務邏輯？ → 如果是，需要抽象化後才能遷移

CHECK 2: 環境依賴
  是否硬編碼環境特定值（URL、secret、path）？ → 替換為環境變數

CHECK 3: 版本相容性
  依賴的工具版本是否明確？ → 在文件中明確記錄

CHECK 4: 測試覆蓋
  是否有測試確保行為正確？ → 遷移時需攜帶測試
```

### 遷移包裝標準 (Migration Package Standard)

每個可遷移資產必須包含：

```text
<asset-name>/
├── README.md           — 使用說明
├── USAGE.md            — 配置指南
├── <asset files>       — 實際資產
├── examples/           — 使用範例
└── CHANGELOG.md        — 版本歷程
```

---

## 輸出格式（模組三標準輸出）

```markdown
## 跨 repo 可整合工程資產清單

### 立即可遷移資產（零或最少修改）

| 資產名稱 | 類別    | 遷移難度 | 目標路徑           |
| -------- | ------- | -------- | ------------------ |
| <資產>   | CI Rule | Low      | .github/workflows/ |
| <資產>   | Schema  | Low      | schemas/           |
| <資產>   | Tool    | Low      | scripts/           |

### 需要標準化後遷移的資產

| 資產名稱 | 類別     | 需要處理         | 預估工時 |
| -------- | -------- | ---------------- | -------- |
| <資產>   | Pattern  | 移除業務邏輯耦合 | 2h       |
| <資產>   | Workflow | 參數化環境變數   | 1h       |

### 資產詳細說明

#### Asset: <資產名稱>

**類別**: <Category A-F>
**原始路徑**: `<source path>`
**目標路徑**: `<target path>`
**遷移難度**: Low / Medium / High
**前置條件**: <遷移前需要準備什麼>
**配置點**: <使用者需要修改哪些配置>
**驗證命令**: `<command to verify successful migration>`
```

---

_此模組為 Skrill 框架的輸出類別三（跨 repo 工程資產）的標準化執行指南。_
