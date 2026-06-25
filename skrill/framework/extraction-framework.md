# 高階技能集萃取框架 — 完整方法論

> **Framework Version**: 1.0.0
> **Status**: Canonical Reference
> **Category**: Fixed Methodology

---

## 框架定義 (Framework Definition)

高階技能集萃取框架（High-Level Skill Extraction Framework）是一套固定且可持續演進的分析方法論，用於將任意工程資料轉化為結構化 AI 工程資產。

**設計原則**：

```text
1. 固定性 (Fixed)       — 輸出格式固定，保證跨分析的可比性
2. 演進性 (Evolvable)   — 框架本身可被擴展，但核心結構不變
3. 可沉澱性 (Settleable) — 每次分析都產生可長期保存的知識資產
4. 可治理性 (Governable) — 輸出結果可被 CI、工具、AI Agent 消費
5. 可複用性 (Reusable)  — 萃取出的模式可在任意 repo 中複用
6. 可產品化 (Productizable) — 模組可被包裝成獨立交付物
```

---

## 萃取流程 (Extraction Process)

### Phase A：輸入評估 (Input Assessment)

**目標**：確定輸入類型，選擇萃取深度。

```text
INPUT CLASSIFICATION:
  Level 1 - Document Only
    輸入：規範文件、架構 spec、ADR、README
    深度：架構亮點萃取 + 技能模組識別

  Level 2 - Config + Contract
    輸入：CI workflows、OpenAPI/AsyncAPI、Helm manifests
    深度：Level 1 + 治理規則萃取 + 可遷移資產識別

  Level 3 - Source Code Archive
    輸入：.zip / .tar.gz 包含原始碼
    深度：Level 1 + Level 2 + 完整 8 維度萃取
```

**快速評估問題**：

```text
Q1: 這份資料解決了什麼核心問題？
Q2: 它在哪個層面上比一般實作更先進？
Q3: 哪些部分是「只有看過才知道」的亮點？
Q4: 哪些部分可以被直接搬到另一個 repo？
Q5: 哪些部分應該成為 CI gate？
Q6: 哪些部分應該成為平台標準？
```

---

### Phase B：架構地圖構建 (Architecture Map Construction)

**目標**：建立這份資料的全域視圖。

**輸出格式**：

```text
ARCHITECTURE MAP:
  Core Domain: <主業務領域>
  Technology Stack: <技術棧>
  Governance Model: <治理模型>
  Integration Points: <整合點>
  Key Abstractions: <核心抽象>
  Boundary Enforcement: <邊界執行機制>
```

**地圖構建步驟**：

```text
Step 1: 識別頂層目錄結構 → 對映到能力域
Step 2: 識別 CI/CD workflows → 對映到治理能力
Step 3: 識別 contracts/schemas → 對映到 API 邊界
Step 4: 識別 manifests → 對映到部署單元
Step 5: 識別 governance rules → 對映到可執行約束
Step 6: 整合成一張全域地圖
```

---

### Phase C：亮點識別 (Highlight Identification)

**目標**：找出最不可忽視的 10 個架構亮點。

**評分矩陣**：

| 維度 | 權重 | 問題 |
|------|------|------|
| 創新性 | 30% | 這個設計有多少人會想到？ |
| 可複製性 | 25% | 能不能在其他 repo 直接使用？ |
| 治理價值 | 25% | 能不能轉成 CI rule 或政策？ |
| 產品化潛力 | 20% | 能不能獨立包裝成交付物？ |

**每個亮點必須包含**：

```text
亮點名稱: <簡潔命名>
核心價值: <一段話說明為何不可忽視>
解決問題: <它解決了什麼困難問題>
亮點細節: <具體技術說明>
可提煉技能: <Skill: 技能名稱>
最終整合方向: <可成為什麼模組>
```

---

### Phase D：技能模組提煉 (Skill Module Extraction)

**目標**：將亮點轉化為 AI Agent 可執行的技能模組。

**技能模組標準格式**：

```markdown
## Skill: <技能名稱>

**Category**: <技能類別>
**Complexity**: Low / Medium / High
**Reusability**: Repo-local / Cross-repo / Platform-level

### Inputs
- <輸入項目 1>
- <輸入項目 2>

### Required Files
- <依賴檔案 1>
- <依賴檔案 2>

### Execution Steps
1. <步驟 1>
2. <步驟 2>
3. <步驟 3>

### Validation Commands
```bash
<驗證指令>
```

### Failure Modes
- <失敗情境 1>: <處理方式>
- <失敗情境 2>: <處理方式>

### Output Format
<輸出格式描述>

### Safety Rules
- <安全限制 1>
- <安全限制 2>
```

---

### Phase E：跨 repo 資產識別 (Cross-Repo Asset Identification)

**目標**：識別哪些資產可以被直接遷移到其他 repo。

**資產類別與目標路徑**：

```text
ASSET TYPE             SOURCE PATTERN              TARGET PATH
Architecture Patterns  */README.md + */spec.yaml   patterns/<name>.md
CI Governance Rules    .github/workflows/*.yml     .github/workflows/<name>.yml
Schema Contracts       contracts/**/*.yaml         schemas/<name>.yaml
SDK Generators         scripts/generate-*.sh       platform/sdk-generators/
CLI Tools              tools/*.py / tools/*.ts     scripts/<name>
Governance Validators  scripts/validate-*.py       ci/validators/<name>.py
Navigation Data        navigation/*.yaml           navigation/
Foundation Specs       foundation/**/*.yaml        foundation/
```

---

### Phase F：五層資產轉化 (5-Layer Asset Transformation)

**目標**：將所有識別的資產轉化為五層可執行工程資產。

#### Layer 1：知識萃取層 (Knowledge Extraction Layer)

```text
輸出物:
  - <project>-architecture-components.md
  - <project>-governance-rules.md
  - <project>-reusable-skills.md
  - <project>-security-policies.md
  - <project>-runtime-patterns.md
```

**每份專案必須輸出**：

```text
最值得保留的 10 個架構能力
最值得產品化的 5 個模組
最值得抽象成標準的 5 條規範
最有風險但最有價值的 5 個設計
```

#### Layer 2：架構模式庫 (Architecture Pattern Library)

**Pattern 標準結構**：

```text
patterns/<name>.md 必須包含:
  Problem        — 這個 pattern 解決什麼問題
  Context        — 在什麼情境下適用
  Forces         — 有哪些設計張力
  Solution       — 具體解決方案
  Tradeoffs      — 取捨與代價
  Implementation — 實作指南
  CI Enforcement — 如何用 CI 強制執行
  Security       — 安全考量
  Example        — 範例目錄結構
  Migration      — 遷移策略
```

#### Layer 3：工程技能模組 (Engineering Skill Modules)

```text
skrill/framework/skill-modules/ 中的每個模組對應一個技能類別
每個模組包含多個具體技能
每個技能都有 Phase D 定義的標準格式
```

#### Layer 4：治理 CI 整合 (Governance CI Integration)

**必備 CI workflows**：

```text
.github/workflows/
  architecture-governance.yml    — 架構邊界驗證
  ai-context-governance.yml      — AI 上下文治理
  terminology-lint.yml           — 術語一致性檢查
  provider-boundary-check.yml    — Provider 邊界驗證
  sdk-contract-check.yml         — SDK 合約驗證
  service-complexity-gate.yml    — 服務複雜度門控
```

#### Layer 5：統一 AI 工程平台 (Unified AI Engineering Platform)

**最終整合架構**：

```text
Unified AI Engineering Platform
├── Architecture Intelligence
│   ├── Dependency Boundary Analysis
│   ├── Namespace Governance
│   └── ADR Traceability
├── AI Governance
│   ├── Context Redaction
│   ├── Terminology Validation
│   └── Output Policy Enforcement
├── CI/CD Governance
│   ├── Unified Gate
│   ├── Security Scanning
│   ├── Test Complexity Gate
│   └── Weekly Audit
├── Runtime Reliability
│   ├── Circuit Breaker
│   ├── Retry/Fallback
│   ├── Health Checks
│   └── Metrics
├── Provider Abstraction
│   ├── AWS Adapter
│   ├── GCP Adapter
│   ├── Mock Adapter
│   └── Provider Registry
└── Developer Platform
    ├── OpenAPI Contract
    ├── Multi-language SDK
    ├── Docs Generation
    └── Release Governance
```

---

### Phase G：一體化平台路線圖 (Integration Roadmap)

**目標**：規劃從當前資產到最終整合的完整路線。

**標準路線圖格式**：

```text
Phase 0: 資產識別與整理 (0-2 週)
  ✓ 萃取所有架構亮點
  ✓ 建立資產清單
  ✓ 識別跨 repo 可用資產

Phase 1: 模組化與標準化 (2-6 週)
  ✓ 將亮點轉成 patterns/
  ✓ 將技能轉成 skill-modules/
  ✓ 將治理規則轉成 schemas/

Phase 2: CI 整合與自動化 (6-12 週)
  ✓ 將 patterns 轉成 CI gates
  ✓ 建立自動化驗證腳本
  ✓ 整合進 .github/workflows/

Phase 3: 產品化與平台化 (12-20 週)
  ✓ 將模組包裝成獨立 packages/
  ✓ 生成多語言 SDK
  ✓ 建立開發者文件

Phase 4: 跨 repo 治理閉環 (20+ 週)
  ✓ 建立跨 repo 治理標準
  ✓ 整合進 Unified AI Engineering Platform
  ✓ 建立持續演進機制
```

---

## 8 維度深度萃取（程式碼庫專用）

當輸入為程式碼庫時，額外執行以下 8 個維度的萃取：

### 維度 11：可重用 Source Modules

識別可以被直接提取為獨立模組的原始碼：

```text
標準:
  - 無強耦合外部依賴
  - 邊界清晰
  - 有完整輸入/輸出定義
  - 可獨立測試
```

### 維度 12：Library Candidates

識別適合發佈為 npm/PyPI/Go 模組的程式碼：

```text
標準:
  - 功能通用，不依賴業務邏輯
  - API 設計穩定
  - 有版本化潛力
  - 可獨立文件化
```

### 維度 13：Governance CI Candidates

識別應該被轉成 CI rule 的業務邏輯：

```text
標準:
  - 可用命令列執行
  - 輸出 pass/fail
  - 不依賴 runtime state
  - 快速執行 (<30s)
```

### 維度 14：Schema Contract Candidates

識別應該被正規化為 JSON Schema / OpenAPI 的資料結構：

```text
標準:
  - 跨服務使用的資料模型
  - 需要版本化的 API 契約
  - 需要驗證的設定格式
```

### 維度 15：Automation Tool Candidates

識別應該成為獨立自動化工具的腳本或邏輯：

```text
標準:
  - 重複性操作
  - 可參數化
  - 有明確輸入輸出
  - 可被 CI 調用
```

### 維度 16：Unified Gate Candidates

識別應該被提升為品質閘門的驗證邏輯：

```text
標準:
  - 涉及架構合規性
  - 涉及安全策略
  - 涉及命名規範
  - 需要強制執行
```

### 維度 17：Navigation Index Candidates

識別應該被索引化的目錄結構或依賴關係：

```text
標準:
  - 模組間依賴關係
  - 服務拓撲圖
  - 目錄功能映射
  - AI Agent 理解所需的結構資訊
```

### 維度 18：Foundation Spec Candidates

識別應該被提升為戰略基礎規格的設計：

```text
標準:
  - 代表平台能力邊界
  - 跨模組共用
  - 需要穩定 API
  - 有長期演進計劃
```

---

## 質量標準 (Quality Standards)

每次分析輸出必須滿足以下標準：

```text
QS-1: 每個亮點必須有清晰的「核心價值」說明
QS-2: 每個技能模組必須有 Inputs / Steps / Output 三要素
QS-3: 每個跨 repo 資產必須指定目標路徑
QS-4: 五層資產必須全部覆蓋
QS-5: 路線圖必須包含時間估算
QS-6: 輸出必須使用固定格式，不得省略任何類別
QS-7: 代碼庫分析必須覆蓋全部 8 個附加維度
```

---

*此方法論為 Skrill 框架的核心，所有分析必須遵循此流程執行。*
