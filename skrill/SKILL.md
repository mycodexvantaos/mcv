# Skrill — 高階技能集萃取框架 (High-Level Skill Extraction Framework)

> **Version**: 1.0.0
> **Status**: Active
> **Maintained by**: AI Engineering Guild
> **Last Updated**: 2026-06-21

---

## 概述 (Overview)

**Skrill** 是一套固定且可持續演進的「高階技能集萃取框架」。

它的核心使命是：

> 將每份資料（程式碼庫、壓縮檔、架構文件、CI 日誌、規範補丁）轉化為  
> **可沉澱、可治理、可複用、可產品化**的 AI 工程資產。

---

## 啟動方式 (Activation)

當你面對以下任何輸入時，啟動此框架：

```text
INPUT TYPES:
  - 程式碼庫 / monorepo archive (.zip, .tar.gz)
  - 架構規範文件 (.md, .yaml, .json)
  - CI/CD failure logs
  - OpenAPI / AsyncAPI / gRPC contracts
  - Architecture Decision Records (ADRs)
  - Helm / Kubernetes manifests
  - 平台 patch / normalization 補丁
  - AI 工程團隊的設計評審報告
```

**啟動指令**：

```text
@skrill analyze <input>
@skrill extract-skills <archive>
@skrill generate-output <source>
```

---

## 核心框架結構 (Core Framework Structure)

```text
skrill/
├── SKILL.md                          ← 本文件：框架主入口
├── framework/
│   ├── extraction-framework.md       ← 固定萃取方法論
│   ├── output-template.md            ← 標準化輸出格式
│   └── skill-modules/
│       ├── 01-architecture-highlights.md    ← 模組一：高價值架構亮點
│       ├── 02-reusable-modules.md           ← 模組二：可複用 AI 工程能力模組
│       ├── 03-cross-repo-assets.md          ← 模組三：跨 repo 工程資產
│       ├── 04-team-absorption.md            ← 模組四：團隊吸收、重構、標準化策略
│       └── 05-integration-roadmap.md        ← 模組五：一體化能力平台路線圖
├── patterns/
│   ├── unified-gate-system.md
│   ├── namespace-governance.md
│   ├── ai-context-governance.md
│   ├── provider-decoupling.md
│   ├── semantic-decision-pipeline.md
│   ├── resilience-toolkit.md
│   ├── terminology-governance.md
│   └── test-complexity-gate.md
└── examples/
    ├── mycodexvantaos-v1-extraction.md      ← 範例一：程式碼庫萃取報告
    └── unified-architecture-patch.md        ← 範例二：架構規範補丁萃取報告
```

---

## 五大輸出類別 (5 Output Categories)

每次分析完成後，必須輸出以下五類成果：

### 1. 不可忽視的高價值架構亮點

> 找出這份資料中，大多數人看不到但一旦看到就無法忽視的架構設計。

評分標準：

- 解決了哪個困難問題？
- 是否具備可複製性？
- 是否具備治理價值？

### 2. 可複用的 AI 工程能力模組

> 將亮點抽象成獨立的、可單獨部署的技能模組。

輸出格式：

```text
Skill: <技能名稱>
Inputs: <輸入清單>
Execution Steps: <執行步驟>
Output Format: <輸出格式>
Safety Rules: <安全限制>
```

### 3. 可跨 repo / 跨專案整合的工程資產

> 識別哪些資產可以被抽取出來，在其他 repo 或專案中直接使用。

類別包含：

- Architecture patterns
- Governance rules (`.github/workflows/`)
- Schema contracts (`.yaml`, `.json`)
- SDK generators
- CLI tools (`scripts/`)
- CI validation scripts

### 4. AI 工程團隊應如何吸收、重構、標準化、產品化

> 不只是「閱讀」，而是把這些資產轉成五層可執行資產。

五層資產框架：

```text
Layer 1: Knowledge Extraction Layer
Layer 2: Architecture Pattern Library
Layer 3: Engineering Skill Modules
Layer 4: Governance CI Integration
Layer 5: Unified AI Engineering Platform
```

### 5. 最終集成為一體化能力平台的路線圖

> 畫出從現在到最終整合的清晰路線。

輸出格式：

```text
Phase 0: 資產識別與整理
Phase 1: 模組化與標準化
Phase 2: CI 整合與自動化
Phase 3: 產品化與平台化
Phase 4: 跨 repo 治理閉環
```

---

## 附加萃取維度（當輸入為程式碼庫時）

當輸入包含原始程式碼時，額外輸出以下 8 項：

```text
11. 可重用 source modules
12. 可轉成 packages/ 的 library candidates
13. 可轉成 ci/ rules 的 governance candidates
14. 可轉成 schemas/ contracts 的資料模型
15. 可轉成 scripts/ 的自動化工具
16. 可轉成 unified-gates/ 的品質門檻
17. 可轉成 navigation/ 的索引資料
18. 可轉成 foundation/ 的戰略規格映射
```

---

## 固定輸出格式 (Standard Output Format)

每次分析完成後，使用以下固定格式輸出：

```text
1. 專案一句話定位
2. 核心架構地圖
3. 最有價值的 10 個亮點
4. 可提煉的高階技能集清單
5. 可產品化模組（含優先排名）
6. 可併入現有 AI 工程平台的部分
7. 與前面分析的重疊 / 互補 / 衝突
8. 最終集成建議
9. AI 工程團隊吸收路線（5 層）
10. 下一步需要補充的檔案或資訊
```

---

## 持續演進機制 (Continuous Evolution)

此框架設計為可持續演進：

1. **Pattern 積累**：每次分析後，將新發現的 pattern 加入 `patterns/`
2. **技能模組更新**：發現新的技能類型時，在 `framework/skill-modules/` 新增模組
3. **範例豐富**：每次高質量分析完成後，將報告存入 `examples/`
4. **跨 repo 治理**：將萃取出的 CI rules 整合進 `.github/workflows/`

---

## 相關資源 (Related Resources)

- `framework/extraction-framework.md` — 完整萃取方法論
- `framework/output-template.md` — 可複製的輸出模板
- `patterns/` — 可複用架構模式庫
- `examples/` — 高質量分析範例
- `../unified-gates/` — 統一品質閘門系統
- `../foundation/` — 平台基礎能力規格
- `../navigation/` — AI/人類全域索引

---

## 版本歷程 (Version History)

| Version | Date       | Changes                                                     |
| ------- | ---------- | ----------------------------------------------------------- |
| 1.0.0   | 2026-06-21 | Initial framework creation based on MyCodexVantaOS analysis |

---

_此框架由 AI Engineering Guild 維護，作為 MyCodexVantaOS 統一工程治理作業系統的一部分。_
