# Pattern Library Index（架構模式庫索引）

> **Version**: 1.0.0
> **Last Updated**: 2026-06-21
> **Total Patterns**: 8

---

## 使用說明

每個 Pattern 文件包含：

- **Problem** — 它解決什麼問題
- **Context** — 在什麼情境適用
- **Solution** — 具體解決方案
- **Tradeoffs** — 取捨分析
- **Implementation Guide** — 實作步驟
- **CI Enforcement** — CI 執行配置
- **Example Structure** — 目錄結構範例
- **Migration Strategy** — 遷移策略

---

## Pattern 清單

| Pattern                                                       | 類別            | 成熟度     | 評分   | 來源                             |
| ------------------------------------------------------------- | --------------- | ---------- | ------ | -------------------------------- |
| [Unified Gate System](./unified-gate-system.md)               | Governance      | Production | 95/100 | MyCodexVantaOS Core              |
| [Namespace Governance](./namespace-governance.md)             | Governance      | Production | 92/100 | MyCodexVantaOS Core + Arch Patch |
| [AI Context Governance](./ai-context-governance.md)           | AI Governance   | Production | 93/100 | MyCodexVantaOS Core              |
| [Provider Decoupling](./provider-decoupling.md)               | Architecture    | Production | 90/100 | MyCodexVantaOS Core + Arch Patch |
| [Resilience Toolkit](./resilience-toolkit.md)                 | Resilience      | Production | 88/100 | MyCodexVantaOS Core              |
| [Semantic Decision Pipeline](./semantic-decision-pipeline.md) | AI Architecture | Proven     | 87/100 | MyCodexVantaOS Core              |
| [Test Complexity Gate](./test-complexity-gate.md)             | Governance      | Proven     | 86/100 | MyCodexVantaOS Core              |
| [Terminology Governance](./terminology-governance.md)         | Governance      | Proven     | 85/100 | MyCodexVantaOS Core              |

---

## 按類別瀏覽

### Governance（治理）

- [Unified Gate System](./unified-gate-system.md) — 跨模組通訊治理
- [Namespace Governance](./namespace-governance.md) — 命名空間治理閉環
- [Test Complexity Gate](./test-complexity-gate.md) — 測試複雜度門控
- [Terminology Governance](./terminology-governance.md) — 術語一致性治理

### Architecture（架構）

- [Provider Decoupling](./provider-decoupling.md) — 雲廠商解耦抽象

### AI Governance（AI 治理）

- [AI Context Governance](./ai-context-governance.md) — AI 上下文安全

### AI Architecture（AI 架構）

- [Semantic Decision Pipeline](./semantic-decision-pipeline.md) — 語意決策管道

### Resilience（韌性）

- [Resilience Toolkit](./resilience-toolkit.md) — 生產韌性工程

---

## 按成熟度瀏覽

### Production（已在生產環境驗證）

- Unified Gate System (95)
- AI Context Governance (93)
- Namespace Governance (92)
- Provider Decoupling (90)
- Resilience Toolkit (88)

### Proven（已驗證但尚未廣泛生產部署）

- Semantic Decision Pipeline (87)
- Test Complexity Gate (86)
- Terminology Governance (85)

---

## 新增 Pattern 指南

當發現新的高價值架構設計時：

1. 使用 `extraction-framework.md` 的 Pattern 評分矩陣評分
2. 若總分 ≥ 65，則建立新 Pattern 文件
3. 複製任意現有 Pattern 作為模板
4. 填寫所有必填欄位（Problem 至 Migration Strategy）
5. 更新此 INDEX.md
6. 在 `skrill/examples/` 的相應報告中引用

---

_此索引由 Skrill 框架維護，每次新增 Pattern 後必須更新。_
