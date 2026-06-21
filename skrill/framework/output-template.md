# 標準化輸出模板 (Standard Output Template)

> **Template Version**: 1.0.0
> **Usage**: 每次分析完成後，複製此模板並填寫所有欄位
> **Enforcement**: 不得省略任何必填欄位（標有 `[REQUIRED]` 的欄位）

---

## 使用說明

1. 複製此模板
2. 填寫所有 `[REQUIRED]` 欄位
3. 根據輸入類型填寫附加欄位（Level 2/3 輸入必填）
4. 將完成的報告存入 `skrill/examples/<project-name>-extraction.md`

---

# [PROJECT NAME] 高階技能集萃取報告

**分析日期**: `YYYY-MM-DD`
**輸入類型**: `Level 1 / Level 2 / Level 3`
**分析者**: `AI Agent / Human`
**版本**: `v1.0`

---

## 1. 專案一句話定位 [REQUIRED]

```text
<在一句話內說明：這個專案是什麼、解決什麼問題、處於什麼技術層次>
```

**格式範例**：

```text
MyCodexVantaOS 是一套結合語意分析、雲供應商解耦、命名空間治理、AI 上下文治理、
CI/CD 門控與雲原生部署的 AI-native 工程治理平台。
```

---

## 2. 核心架構地圖 [REQUIRED]

```text
Core Domain: <主業務領域>
Technology Stack:
  - <語言/框架 1>
  - <語言/框架 2>
Governance Model: <治理模型說明>
Integration Points:
  - <整合點 1>
  - <整合點 2>
Key Abstractions:
  - <核心抽象 1>
  - <核心抽象 2>
Boundary Enforcement: <邊界執行機制>
```

**主要能力清單**：

```text
<能力 1>
<能力 2>
<能力 3>
...
```

---

## 3. 最有價值的 10 個亮點 [REQUIRED]

> 按價值排序，每個亮點都必須包含完整結構

### 亮點 1：<亮點名稱>

**核心價值**

<一段話說明為何不可忽視>

**亮點細節**

<技術細節說明>

**可提煉技能**

```text
Skill: <技能名稱>
```

能力包含：

- <能力 1>
- <能力 2>
- <能力 3>

**最終整合方向**

```text
<模組名稱>
  ├── <子模組 1>
  ├── <子模組 2>
  └── <子模組 3>
```

### 亮點 2：<亮點名稱>

<!-- 重複上述結構 -->

### 亮點 3：<亮點名稱>

<!-- 重複上述結構 -->

<!-- ... 直到亮點 10 -->

---

## 4. 可提煉的高階技能集清單 [REQUIRED]

```text
01. <技能名稱>
02. <技能名稱>
03. <技能名稱>
04. <技能名稱>
05. <技能名稱>
06. <技能名稱>
07. <技能名稱>
08. <技能名稱>
09. <技能名稱>
10. <技能名稱>
11. <技能名稱>  (如有)
12. <技能名稱>  (如有)
...
```

---

## 5. 可產品化模組（含優先排名）[REQUIRED]

| 排名 | 模組名稱 | 價值說明 |
|---:|---|---|
| 1 | `<模組名稱>` | <價值一句話> |
| 2 | `<模組名稱>` | <價值一句話> |
| 3 | `<模組名稱>` | <價值一句話> |
| 4 | `<模組名稱>` | <價值一句話> |
| 5 | `<模組名稱>` | <價值一句話> |
| 6 | `<模組名稱>` | <價值一句話> |
| 7 | `<模組名稱>` | <價值一句話> |
| 8 | `<模組名稱>` | <價值一句話> |
| 9 | `<模組名稱>` | <價值一句話> |
| 10 | `<模組名稱>` | <價值一句話> |

---

## 6. 可併入現有 AI 工程平台的部分 [REQUIRED]

```text
最可集成能力:
  1. <能力名稱> — <如何整合>
  2. <能力名稱> — <如何整合>
  3. <能力名稱> — <如何整合>
  4. <能力名稱> — <如何整合>
  5. <能力名稱> — <如何整合>
```

**建議整合位置**：

```text
<project>/
├── <目標路徑 1>/
│   └── <說明>
├── <目標路徑 2>/
│   └── <說明>
└── <目標路徑 3>/
    └── <說明>
```

---

## 7. 與既有分析的關係 [REQUIRED]

```text
重疊部分 (Overlap):
  - <與已有資產重疊的部分>

互補部分 (Complement):
  - <補充了哪些現有資產沒有的能力>

衝突部分 (Conflict):
  - <與現有設計有何衝突，如何解決>
```

---

## 8. 最終集成建議 [REQUIRED]

<說明這份資料應該如何整合到 Unified AI Engineering Platform>

**建議命名為**：

```text
<建議的模組/框架/平台名稱>
```

**整合架構**：

```text
<建議的最終整合結構圖>
```

---

## 9. AI 工程團隊吸收路線（5 層）[REQUIRED]

### Layer 1：知識萃取層

```text
需要建立的資產:
  - <資產 1>
  - <資產 2>
  - <資產 3>
```

### Layer 2：架構模式庫

```text
需要新增的 patterns/:
  - <pattern 1>
  - <pattern 2>
```

### Layer 3：工程技能模組

```text
需要新增的 skill-modules/:
  - <module 1>
  - <module 2>
```

### Layer 4：治理 CI 整合

```text
需要建立的 CI workflows:
  - <workflow 1>
  - <workflow 2>
```

### Layer 5：統一 AI 工程平台

```text
需要更新的平台子系統:
  - <子系統 1>: <如何更新>
  - <子系統 2>: <如何更新>
```

---

## 10. 下一步需要補充的資訊 [REQUIRED]

```text
為了做更精準的深度萃取，建議補充以下資訊:

□ 目錄樹（完整）
□ README
□ package.json / pyproject.toml / go.mod
□ .github/workflows/
□ docs/architecture 或 docs/specs
□ 關鍵程式檔案: <具體說明需要哪些>
□ CI failure logs
□ ADR 文件
□ OpenAPI / AsyncAPI / gRPC contracts
□ Helm / Kubernetes manifests
```

---

## 附加維度（Level 3 輸入必填）

### 11. 可重用 Source Modules

```text
<模組名稱>:
  路徑: <原始路徑>
  說明: <模組功能>
  目標路徑: <建議遷移到>
  依賴: <外部依賴清單>
```

### 12. Library Candidates

```text
<函式庫名稱>:
  類型: npm / PyPI / Go module
  路徑: <原始路徑>
  API 穩定性: Low / Medium / High
  建議 package name: <名稱>
```

### 13. CI Governance Candidates

```text
<規則名稱>:
  原始邏輯: <在哪個檔案>
  CI workflow 名稱: <建議的 workflow>
  執行時間估計: <秒>
  失敗行為: exit code 1 / warning
```

### 14. Schema Contract Candidates

```text
<Schema 名稱>:
  格式: JSON Schema / OpenAPI / AsyncAPI
  原始路徑: <在哪個檔案>
  目標路徑: schemas/<name>.yaml
  版本: <當前版本>
```

### 15. Automation Tool Candidates

```text
<工具名稱>:
  原始路徑: <在哪個檔案>
  目標路徑: scripts/<name>
  輸入: <參數>
  輸出: <輸出格式>
  CI 可調用: yes / no
```

### 16. Unified Gate Candidates

```text
<Gate 名稱>:
  類型: Architecture / Security / Quality / Naming
  觸發條件: <什麼情況下執行>
  失敗動作: block PR / warning
  目標位置: unified-gates/<category>/
```

### 17. Navigation Index Candidates

```text
<索引名稱>:
  類型: directory-index / module-index / dependency-graph / binding-index
  覆蓋範圍: <說明>
  目標路徑: navigation/<name>.yaml
  更新頻率: on-commit / on-release / manual
```

### 18. Foundation Spec Candidates

```text
<Foundation 名稱>:
  類型: compute / data / algorithm / agent / contract / governance / business
  戰略重要性: Critical / High / Medium
  目標路徑: foundation/<name>/foundation.yaml
  成熟度: Concept / Spec / Implementation / Production
```

---

## 報告元數據 (Report Metadata)

```yaml
report:
  project: '<project name>'
  version: 'v1.0'
  date: 'YYYY-MM-DD'
  input_level: 1 # 1, 2, or 3
  highlights_count: 10
  skills_extracted: 0
  patterns_added: 0
  ci_candidates: 0
  related_reports: []
  next_analysis: '<下一份要分析的資料>'
```

---

*此模板由 Skrill 框架維護。每次更新模板時，請同步更新版本號並記錄變更。*
