# 模組一：不可忽視的高價值架構亮點

> **Module**: 01-architecture-highlights
> **Category**: Output Category 1
> **Purpose**: 識別並結構化記錄每份資料中最具影響力的架構設計

---

## 模組定義

此模組負責從任意工程資料中識別「高價值架構亮點」——即那些大多數人看不到但一旦看到就無法忽視的架構設計決策。

**核心問題**：

> 這份資料中，什麼是 10 個人有 9 個人看不見，但看見之後都說「原來還可以這樣做」的設計？

---

## 技能清單

### Skill-01-A: Governed System Boundary Design（治理邊界設計）

**Description**: 識別並設計跨模組通訊的治理層，而不是讓模組直接互相耦合。

**Inputs**:
- Repository directory structure
- Inter-module import statements
- CI workflow files
- API contract files

**Required Files**:
- `unified-gates/` directory (if exists)
- Module manifests
- CI governance workflows

**Execution Steps**:
1. 掃描所有跨目錄 import 關係，建立依賴圖
2. 識別哪些依賴是直接耦合，哪些通過 gate 中介
3. 評估現有 gate 機制的完整性
4. 識別缺失的 gate 邊界
5. 輸出：依賴圖 + gate coverage report

**Validation Commands**:
```bash
# 掃描跨模組依賴
grep -r "from '\.\./\.\." src/ --include="*.ts"

# 驗證 gate 邊界
pnpm tsx ci/validate-architecture.ts

# 檢查 import matrix 合規
python scripts/validate-namespace-governance.py
```

**Failure Modes**:
- 直接跨模組 import：應拒絕 PR，要求通過 gate 中介
- 缺失 gate 文件：應警告，要求補充
- 循環依賴：應拒絕，要求重構

**Output Format**:
```yaml
gate_analysis:
  total_cross_module_imports: <number>
  gate_mediated_imports: <number>
  direct_coupling_violations: <list>
  missing_gate_boundaries: <list>
  recommendations: <list>
```

**Safety Rules**:
- 不能修改現有 gate 實作，只能分析和報告
- 不能在沒有 gate 定義的情況下建議直接依賴

---

### Skill-01-B: Architecture Boundary Enforcement（架構邊界強制執行）

**Description**: 將架構規則從文件轉化為可在 CI 中強制執行的規範。

**Inputs**:
- Architecture decision records (ADRs)
- Directory structure
- Existing linting rules
- Module manifests

**Execution Steps**:
1. 解析架構文件，提取可量化的規則
2. 將規則轉化為 CI 可執行的驗證腳本
3. 建立 violation 報告格式
4. 整合進 `.github/workflows/`

**Validation Commands**:
```bash
# 執行架構驗證
python scripts/validate-foundation-structure.py

# 執行命名空間驗證
node ci/validate-architecture.ts

# 執行依賴邊界檢查
./scripts/check-dependency-boundaries.sh
```

**Output Format**:
```yaml
architecture_validation:
  checked_rules: <number>
  passed: <number>
  failed: <number>
  violations: <list of {rule, location, severity}>
  suggestions: <list>
```

---

### Skill-01-C: AI Context Safety and Governance（AI 上下文安全治理）

**Description**: 識別並設計 AI 輸入/輸出的治理層，防止敏感資料洩漏並確保輸出合規。

**Inputs**:
- AI integration code
- Data handling policies
- Terminology dictionaries
- Output validation rules

**Execution Steps**:
1. 識別所有進入 LLM 的資料路徑
2. 評估敏感資料遮罩機制
3. 評估 context 壓縮與排序策略
4. 評估輸出驗證規則
5. 識別治理缺口

**Output Format**:
```yaml
ai_context_governance:
  sensitive_data_paths: <list>
  redaction_coverage: <percentage>
  context_management: <assessment>
  output_validation: <assessment>
  governance_gaps: <list>
```

---

### Skill-01-D: Provider-Agnostic Infrastructure Abstraction（Provider 解耦）

**Description**: 識別並評估 Provider 抽象層的設計，確保應用邏輯不直接依賴特定 cloud/AI vendor。

**Inputs**:
- Provider implementation files
- Abstract interface definitions
- Provider registry configuration
- Test mock adapters

**Execution Steps**:
1. 掃描所有雲廠商 SDK 的直接使用
2. 識別 adapter 模式的覆蓋範圍
3. 評估 provider registry 的設計
4. 識別未抽象的 vendor 依賴
5. 評估 mock adapter 的完整性

**Output Format**:
```yaml
provider_abstraction:
  direct_vendor_usages: <list>
  adapter_coverage: <percentage>
  providers:
    - name: <provider>
      has_adapter: <bool>
      has_mock: <bool>
  gaps: <list>
```

---

### Skill-01-E: Specification Freeze and Baseline Control（規格凍結控制）

**Description**: 識別並設計架構基線凍結機制，確保平台母規格不被隨意修改。

**Inputs**:
- Architecture spec files
- Phase deliverable checklists
- Governance policies

**Execution Steps**:
1. 識別需要凍結的核心規格文件
2. 定義凍結標準（Phase 0 deliverables）
3. 建立凍結狀態驗證腳本
4. 整合進 CI gate

**Output Format**:
```yaml
specification_freeze:
  freeze_phase: <current phase>
  required_deliverables: <list>
  completed: <list>
  missing: <list>
  freeze_status: locked / in_progress / violated
```

---

## 亮點識別評分矩陣

用於對所有識別到的亮點進行客觀評分：

| 維度 | 滿分 | 評分標準 |
|------|------|---------|
| 創新性 | 30 | 0=常見, 10=少見, 20=罕見, 30=獨特 |
| 可複製性 | 25 | 0=高耦合, 13=需改造, 25=直接可用 |
| 治理價值 | 25 | 0=無法自動化, 13=部分可, 25=完全可CI化 |
| 產品化潛力 | 20 | 0=內部用, 10=可抽取, 20=可獨立發布 |

**總分 85+**：必列為核心亮點，優先產品化
**總分 65-84**：列為重要亮點，納入架構模式庫
**總分 45-64**：列為一般亮點，記錄但不優先處理
**總分 <45**：記錄但不作為亮點輸出

---

## 輸出格式（模組一標準輸出）

```markdown
## 亮點 N：<亮點名稱>

**評分**: <總分>/100
**優先級**: Critical / High / Medium / Low

**核心價值**
<一段話說明不可忽視的原因>

**解決問題**
<它解決了什麼困難問題>

**亮點細節**
<具體的技術說明，包含程式碼示例或架構圖>

**可提煉技能**
```text
Skill: <技能名稱>
```

能力包含：
- <能力 1>
- <能力 2>

**最終整合方向**
```text
<模組名稱>
  ├── <子模組 1>
  └── <子模組 2>
```

**相關 Pattern**: `patterns/<name>.md`
**相關 Skill Module**: `skrill/framework/skill-modules/<n>-<name>.md`
```

---

*此模組為 Skrill 框架的輸出類別一（架構亮點）的標準化執行指南。*
