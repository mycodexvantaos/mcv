# 模組四：AI 工程團隊應如何吸收、重構、標準化、產品化

> **Module**: 04-team-absorption
> **Category**: Output Category 4
> **Purpose**: 提供 AI 工程團隊將分析成果轉化為可執行工程資產的完整路線

---

## 模組定義

此模組解決一個核心問題：

> 分析報告完成後，AI 工程團隊不能只是「閱讀」和「理解」——  
> 必須把這些資產轉成五層可執行的工程構件，  
> 讓知識真正「落地」而不是存在筆記裡。

---

## 五層資產轉化框架

### Layer 1：知識萃取層（Knowledge Extraction Layer）

**目標**：將每份分析輸出結構化，建立跨分析可比較的知識庫。

**執行步驟**：

```text
Step 1.1 — 建立專案架構組件目錄
  輸出物: <project>-architecture-components.md
  結構:
    - Architecture Components (架構組件清單)
    - Governance Rules (治理規則清單)
    - CI/CD Rules (CI/CD 規則清單)
    - Security Policies (安全策略清單)
    - Runtime Infrastructure (運行時基礎設施清單)
    - SDK/API Contracts (SDK/API 合約清單)
    - AI Context Rules (AI 上下文規則清單)
    - Resilience Patterns (韌性模式清單)
    - Observability Patterns (可觀測性模式清單)
    - Reusable Skills (可複用技能清單)

Step 1.2 — 輸出四維評估矩陣
  對每份專案，必須輸出：
    ✓ 最值得保留的 10 個架構能力
    ✓ 最值得產品化的 5 個模組
    ✓ 最值得抽象成標準的 5 條規範
    ✓ 最有風險但最有價值的 5 個設計

Step 1.3 — 建立跨分析關聯圖
  記錄與前面分析的：
    ✓ 重疊部分（不要重複建立）
    ✓ 互補部分（如何補充現有資產）
    ✓ 衝突部分（如何解決衝突）
```

**質量門控**：
```bash
# TODO: Layer 1 專用驗證器（scripts/validate-layer1-output.py）尚未在本 repo 提供
# 目前可先執行既有的結構基線驗證
python scripts/validate-foundation-structure.py
```

---

### Layer 2：架構模式庫（Architecture Pattern Library）

**目標**：將亮點轉成可重用的架構樣板，形成可增長的模式庫。

**Pattern 建立流程**：

```text
Step 2.1 — 從分析報告中提取候選 Pattern
  標準: 得分 65 分以上的架構亮點
  操作: 複製亮點描述，填入 Pattern 模板

Step 2.2 — 填寫 Pattern 完整格式
  必填欄位:
    ✓ Problem
    ✓ Context
    ✓ Forces
    ✓ Solution
    ✓ Tradeoffs
    ✓ Implementation Guide
    ✓ CI Enforcement
    ✓ Security Considerations
    ✓ Example Repo Structure
    ✓ Migration Strategy

Step 2.3 — 存入 patterns/ 目錄
  命名規則: <kebab-case-name>.md
  位置: skrill/patterns/<name>.md

Step 2.4 — 建立 Pattern Registry
  維護: skrill/patterns/INDEX.md
  包含: 所有 pattern 的名稱、描述、分類、版本
```

**Pattern 模板（快速複製版）**：
```markdown
# Pattern: <Pattern Name>

**Category**: Governance / Resilience / Architecture / Security / Platform
**Maturity**: Concept / Proven / Production
**Source**: <來源專案>

## Problem
<這個 pattern 解決什麼問題>

## Context
<在什麼情況下適用>

## Forces
- <設計張力 1>
- <設計張力 2>

## Solution
<具體解決方案>

## Tradeoffs
| 優點 | 代價 |
|------|------|
| <優點> | <代價> |

## Implementation Guide
<實作步驟>

## CI Enforcement
```yaml
# 在 .github/workflows/ 中加入
<CI 配置>
```

## Security Considerations
<安全考量>

## Example Structure
```text
<目錄結構範例>
```

## Migration Strategy
<如何從現有代碼遷移到此模式>
```

---

### Layer 3：工程技能模組（Engineering Skill Modules）

**目標**：將架構亮點轉成 AI Agent 可直接執行的技能模組。

**技能模組建立流程**：

```text
Step 3.1 — 識別可自動化的操作
  問題: 這個亮點中，哪些操作是可重複的、有明確輸入輸出的？

Step 3.2 — 定義 Skill Module
  每個模組必須有:
    ✓ 唯一 ID（SM-<category>-<number>）
    ✓ 清晰的 Inputs
    ✓ Required Files 清單
    ✓ Execution Steps（可機器執行）
    ✓ Validation Commands
    ✓ Expected Output Format
    ✓ Failure Modes & Recovery

Step 3.3 — 存入 skill-modules/ 目錄
  位置: skrill/framework/skill-modules/
  格式: 遵循模組二定義的 Skill Module Standard Format

Step 3.4 — 建立技能目錄
  維護: skrill/framework/skill-modules/INDEX.md
  包含: 所有技能的 ID、名稱、類別、依賴
```

**技能分類體系**：

```text
Tier 1 — 分析技能 (Analysis Skills)
  用途: 理解現有代碼和架構
  輸出: 報告、圖表、評分

Tier 2 — 驗證技能 (Validation Skills)
  用途: 檢查代碼是否符合規範
  輸出: Pass/Fail + violation list

Tier 3 — 生成技能 (Generation Skills)
  用途: 根據規範生成代碼或文件
  輸出: 新文件或代碼

Tier 4 — 轉化技能 (Transformation Skills)
  用途: 將現有代碼重構為符合新規範的形態
  輸出: 修改後的代碼或配置
```

---

### Layer 4：治理 CI 整合（Governance CI Integration）

**目標**：將技能轉成 CI gates，讓 repo 自己 enforce 規範，而不依賴人工 code review。

**CI 整合流程**：

```text
Step 4.1 — 識別 CI Gate 候選
  問題: 這個技能的驗證命令是否可以在 CI 中執行？
  標準:
    ✓ 執行時間 < 5 分鐘
    ✓ 輸出 exit code 0/1
    ✓ 不依賴 runtime state（或有 mock 機制）

Step 4.2 — 建立 CI Workflow
  模板位置: .github/workflows/
  命名規則: <governance-area>-governance.yml
  必備欄位:
    ✓ name（清晰描述 gate 功能）
    ✓ on（觸發條件）
    ✓ jobs.validate（主驗證 job）
    ✓ steps（明確步驟）
    ✓ 失敗時的錯誤報告

Step 4.3 — 設定 Branch Protection
  要求: 需要把 CI gate 加入 branch protection 規則
  操作: Settings → Branches → Required status checks

Step 4.4 — 建立 Gate Registry
  位置: unified-gates/
  格式:
    unified-gates/gate/gate-catalog.yaml
    unified-gates/ai-infra-gates/ai-infra-gates-catalog.yaml
    unified-gates/unified-gate-index.yaml
```

**六大核心 CI Gate**：

```yaml
# 1. Architecture Governance
- workflow: architecture-governance.yml
  triggers: [PR to main]
  validates:
    - Namespace boundary compliance
    - Manifest type correctness
    - Directory dependency rules
  failure_action: Block PR

# 2. AI Context Governance
- workflow: ai-context-governance.yml
  triggers: [PR with AI integration changes]
  validates:
    - Sensitive data redaction
    - Context management policies
    - Output validation rules
  failure_action: Block PR

# 3. Terminology Lint
- workflow: terminology-lint.yml
  triggers: [PR with .md or .ts or .py changes]
  validates:
    - No deprecated terms
    - Consistent naming
    - AI output terminology
  failure_action: Warning (first occurrence) / Block (repeated)

# 4. Provider Boundary Check
- workflow: provider-boundary-check.yml
  triggers: [PR with provider changes]
  validates:
    - No direct vendor SDK imports outside adapters
    - Provider manifest compliance
    - Capability ID normalization
  failure_action: Block PR

# 5. SDK Contract Check
- workflow: sdk-contract-check.yml
  triggers: [PR with contract changes]
  validates:
    - OpenAPI schema validity
    - Breaking change detection
    - SDK generation success
  failure_action: Block PR

# 6. Service Complexity Gate
- workflow: service-complexity-gate.yml
  triggers: [PR with service changes]
  validates:
    - Mock burden < threshold
    - Dependency count < threshold
    - Test coverage > threshold
  failure_action: Warning / Block (when > 2x threshold)
```

---

### Layer 5：統一 AI 工程平台（Unified AI Engineering Platform）

**目標**：將所有能力整合成一個統一的 AI 工程控制平面。

**整合路線**：

```text
Step 5.1 — 建立平台架構藍圖
  文件: docs/unified-architecture-spec.md
  包含: 所有子系統的定義、邊界、交互協議

Step 5.2 — 建立平台索引
  navigation/
    directory-index.yaml      — 目錄功能索引
    module-index.yaml         — 模組能力索引
    dependency-graph.yaml     — 依賴關係圖
    service-navigation-map.yaml — 服務導航圖

Step 5.3 — 建立能力治理規格
  governance/
    platform-governance-spec.yaml  — 平台治理規格
    capability-set.yaml            — 能力集定義
    provider-registry.yaml         — Provider 登記冊

Step 5.4 — 建立平台閉環
  供應鏈閉環: sbom/ + supply-chain/ + release/
  審計閉環: governance/audit/ + unified-gates/
  演進閉環: foundation/ + docs/architecture/ADR/
```

**最終平台架構**：

```text
Unified AI Engineering Platform
  ├── Architecture Intelligence
  │   ├── Dependency Boundary Analysis (Layer 4 Gate)
  │   ├── Namespace Governance (Layer 2 Pattern)
  │   ├── ADR Traceability (Layer 1 Knowledge)
  │   └── Foundation Specification (Layer 3 Skill)
  │
  ├── AI Governance
  │   ├── Context Redaction (Layer 3 Skill)
  │   ├── Terminology Validation (Layer 4 Gate)
  │   └── Output Policy Enforcement (Layer 4 Gate)
  │
  ├── CI/CD Governance
  │   ├── Unified Gate System (Layer 2 Pattern)
  │   ├── Security Scanning (Layer 4 Gate)
  │   ├── Test Complexity Gate (Layer 4 Gate)
  │   └── Weekly Audit (Scheduled Layer 4)
  │
  ├── Runtime Reliability
  │   ├── Circuit Breaker (Layer 2 Pattern)
  │   ├── Retry/Fallback (Layer 2 Pattern)
  │   ├── Health Checks (Layer 3 Skill)
  │   └── Metrics (Layer 3 Skill)
  │
  ├── Provider Abstraction
  │   ├── Provider Adapter Framework (Layer 2 Pattern)
  │   ├── Provider Registry (Layer 3 Skill)
  │   └── Mock Adapter (Layer 3 Skill)
  │
  └── Developer Platform
      ├── OpenAPI Contract (Layer 3 Skill)
      ├── Multi-language SDK (Layer 3 Skill)
      ├── Navigation Index (Layer 1 Knowledge)
      └── Release Governance (Layer 4 Gate)
```

---

## 產品化路線圖

### 如何將工程資產「產品化」

**產品化** = 讓一個工程模組從「只有原始作者能用」變成「任何工程師都能配置和使用」。

```text
產品化四步驟:

Step P1 — API 設計
  - 定義清晰的 CLI / SDK / Config 介面
  - 隱藏內部複雜性
  - 提供 --help 和使用說明

Step P2 — 文件化
  - README.md（10 分鐘上手指南）
  - USAGE.md（完整配置文件）
  - EXAMPLES.md（常見用法）
  - CONTRIBUTING.md（如何擴展）

Step P3 — 打包發布
  - npm publish / PyPI upload / Go module proxy
  - Semantic versioning（MAJOR.MINOR.PATCH）
  - Changelog generation
  - Release notes

Step P4 — 社群治理
  - Issue template
  - PR template
  - Roadmap
  - Deprecation policy
```

---

## 輸出格式（模組四標準輸出）

```markdown
## AI 工程團隊吸收路線

### Layer 1 輸出清單
- [ ] `<project>-architecture-components.md` — 架構組件目錄
- [ ] 四維評估矩陣（10/5/5/5）
- [ ] 跨分析關聯圖

### Layer 2 新增 Patterns
- [ ] `patterns/<name-1>.md`
- [ ] `patterns/<name-2>.md`
- [ ] 更新 `patterns/INDEX.md`

### Layer 3 新增 Skill Modules
- [ ] `framework/skill-modules/<SM-ID>-<name>.md`
- [ ] 更新 `framework/skill-modules/INDEX.md`

### Layer 4 新增 CI Gates
- [ ] `.github/workflows/<name-1>.yml`
- [ ] `.github/workflows/<name-2>.yml`
- [ ] 更新 `unified-gates/gate/gate-catalog.yaml`

### Layer 5 平台更新
- [ ] 更新 `docs/unified-architecture-spec.md`
- [ ] 更新 `navigation/` 索引
- [ ] 更新 `governance/capability-set.yaml`

### 產品化計劃
| 模組 | 產品化步驟 | 預計發布時間 |
|------|-----------|-------------|
| <模組 1> | P1 → P2 | <時間> |
| <模組 2> | P1 → P3 | <時間> |
```

---

*此模組為 Skrill 框架的輸出類別四（團隊吸收策略）的標準化執行指南。*
