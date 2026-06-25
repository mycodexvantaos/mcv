# 模組二：可複用的 AI 工程能力模組

> **Module**: 02-reusable-modules
> **Category**: Output Category 2
> **Purpose**: 將架構亮點抽象為獨立、可部署、可組合的工程技能模組

---

## 模組定義

此模組負責將模組一識別出的架構亮點，進一步轉化為：

1. **AI Agent 可執行的技能模組** — 有清晰的 Inputs / Steps / Outputs
2. **可獨立部署的工程能力** — 無需整個系統即可單獨使用
3. **可組合的能力積木** — 多個模組可以串聯組合

**設計原則**：

```text
每個模組必須：
  ✓ 有明確的輸入邊界
  ✓ 有可重複執行的步驟
  ✓ 有可驗證的輸出
  ✓ 有清晰的失敗處理
  ✓ 不依賴外部狀態（或明確聲明依賴）
```

---

## 20 個核心高階技能類別

基於 MyCodexVantaOS 分析，識別出以下 20 個核心高階技能：

### 類別 01: Governed System Boundary Design
```text
描述: 設計跨模組門控，定義可審計的 inter-module contract
應用場景: 大型 monorepo、微服務架構、AI agent 系統
關鍵輸出: Gate catalog, Dependency boundary matrix, CI boundary checks
```

### 類別 02: Architecture Boundary Enforcement
```text
描述: 將架構原則轉成 CI 可執行規則，防止架構腐化
應用場景: 任何需要長期維護的 repo
關鍵輸出: Architecture validation CI, Violation reporter, ADR enforcer
```

### 類別 03: AI Context Safety and Governance
```text
描述: 建立 AI 輸入/輸出的治理管道，防止敏感資料外洩
應用場景: 所有整合 LLM 的系統
關鍵輸出: Context sanitization pipeline, Output policy checker, Audit trail
```

### 類別 04: Provider-Agnostic Infrastructure Abstraction
```text
描述: 解耦應用邏輯與雲廠商 SDK，支援多雲與測試
應用場景: 企業級系統、需要可測試性的服務
關鍵輸出: Provider adapter framework, Provider registry, Mock adapter
```

### 類別 05: Production Resilience Engineering
```text
描述: 建立生產級韌性工程：Circuit Breaker、Retry、Fallback
應用場景: 任何依賴外部服務的系統
關鍵輸出: Resilience toolkit, Health probe registry, Metrics instrumentation
```

### 類別 06: Semantic Decision Pipeline Engineering
```text
描述: 設計語意驅動的決策流程，整合 similarity scoring 與 context retrieval
應用場景: AI 決策系統、語意搜索、RAG 系統
關鍵輸出: Semantic pipeline, Decision orchestrator, Context retrieval adapter
```

### 類別 07: API Contract and SDK Automation
```text
描述: OpenAPI-first 設計，自動生成多語言 SDK
應用場景: 平台化產品、需要多語言客戶端的服務
關鍵輸出: OpenAPI contract, SDK generator pipeline, Contract validation CI
```

### 類別 08: Terminology Governance and Semantic Consistency
```text
描述: 建立術語字典，防止命名漂移，驗證 AI 輸出用詞
應用場景: 大型 AI 工程專案、有嚴格命名規範的平台
關鍵輸出: Terminology dictionary, Linter, AI output validator
```

### 類別 09: Testability and Coupling Complexity Governance
```text
描述: 用依賴複雜度衡量服務可測試性，將其轉成 CI gate
應用場景: 任何需要保持低耦合的系統
關鍵輸出: Complexity analyzer, Mock burden calculator, CI gate
```

### 類別 10: Cloud-Native Deployment and Observability
```text
描述: Kubernetes/Helm 部署設計，Prometheus/Loki 可觀測性
應用場景: 所有需要生產部署的服務
關鍵輸出: K8s manifests, Helm charts, Observability stack config
```

### 類別 11: CI/CD Governance Gate Engineering
```text
描述: 設計可組合、可索引、可審計的 CI gate 體系
應用場景: 任何需要品質把關的 repo
關鍵輸出: Gate catalog, Gate index, Policy evaluator, CI adapter
```

### 類別 12: Architecture Constitution Engineering
```text
描述: 將架構原則正規化為憲法，定義 MUST/SHOULD/MAY 規則
應用場景: 大型平台建設初期
關鍵輸出: Architecture constitution doc, Machine-readable rules, Freeze criteria
```

### 類別 13: Canonical Identity Governance
```text
描述: 品牌身份與機器身份分離，防止命名漂移
應用場景: 任何有品牌和機器身份的平台
關鍵輸出: Identity registry, Naming policy, CI identity gate
```

### 類別 14: Strategic Foundation Specification Engineering
```text
描述: 將平台能力拆成戰略規格單元，定義能力邊界
應用場景: 平台型產品、能力中台設計
關鍵輸出: Foundation spec, Capability map, Service map, Commercial model
```

### 類別 15: AI-Native Repository Navigation Indexing
```text
描述: 建立機器可讀的 repo 全域索引，支援 AI Agent 安全修改
應用場景: 任何 AI Agent 需要操作的大型 repo
關鍵輸出: Directory index, Module index, Dependency graph, Service navigation map
```

### 類別 16: Namespace Closure Governance
```text
描述: 建立命名空間治理閉環，防止依賴腐化
應用場景: 大型 monorepo、模組化平台
關鍵輸出: Namespace registry, Naming policy, Closure validator, Drift reporter
```

### 類別 17: Multi-Tier Integrity Hash Policy Design
```text
描述: 為不同用途設計分層 hash 策略，支援供應鏈安全
應用場景: 任何需要供應鏈安全的系統
關鍵輸出: Hash policy config, Audit chain hasher, Release digest generator
```

### 類別 18: Security-First AI Engineering
```text
描述: 將安全考量融入 AI 工程的每個層面
應用場景: 所有 AI 系統
關鍵輸出: Security scan CI, Secret management, SBOM, Vulnerability policy
```

### 類別 19: Repository-Scale Engineering Continuity
```text
描述: 建立超大型 repo 的可維護性機制，確保長期演進
應用場景: 超過 50 個模組的 monorepo
關鍵輸出: Module manifest system, Continuity gates, Deprecation policy
```

### 類別 20: AI Agent Repository Reasoning Governance
```text
描述: 治理 AI Agent 對 repo 的理解與修改行為
應用場景: 任何使用 AI Agent 進行 code generation 的專案
關鍵輸出: Agent boundary policy, Reasoning index, Modification gate
```

---

## 技能模組標準格式

每個可複用技能模組的完整定義格式：

```markdown
## Skill Module: <技能模組名稱>

**ID**: SM-<category>-<number>
**Category**: <對應上述 20 個類別之一>
**Complexity**: Low / Medium / High
**Reusability**: Repo-local / Cross-repo / Platform-level
**Dependencies**: <依賴的其他模組>

### Problem Statement
<這個模組解決了什麼問題>

### Inputs
| Input | Type | Required | Description |
|-------|------|----------|-------------|
| <input 1> | <type> | Yes/No | <說明> |

### Required Files
- `<file pattern>` — <說明>

### Execution Steps
1. <具體步驟>
2. <具體步驟>

### Validation Commands
```bash
<命令>
```

### Expected Output
```yaml
<輸出結構>
```

### Failure Modes & Recovery
| Failure | Recovery |
|---------|----------|
| <失敗情境> | <處理方式> |

### Composition
此模組可與以下模組組合使用：
- `SM-<X>-<N>`: <組合說明>

### Integration Points
```text
→ patterns/<name>.md
→ .github/workflows/<name>.yml
→ scripts/<name>.py
```
```

---

## 模組組合矩陣

顯示哪些技能模組可以組合使用：

```text
COMPOSITION MATRIX:
                        | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 |
------------------------|----|----|----|----|----|----|----|----|
01 Governed Boundary    |  - |  ✓ |  ✓ |  ○ |  ○ |  ○ |  ✓ |  ✓ |
02 Arch Enforcement     |  ✓ |  - |  ○ |  ○ |  ○ |  ○ |  ✓ |  ✓ |
03 AI Context Governance|  ✓ |  ○ |  - |  ○ |  ○ |  ✓ |  ○ |  ✓ |
04 Provider Abstraction |  ○ |  ○ |  ○ |  - |  ✓ |  ✓ |  ○ |  ○ |
05 Resilience           |  ○ |  ○ |  ○ |  ✓ |  - |  ○ |  ○ |  ○ |
06 Semantic Pipeline    |  ○ |  ○ |  ✓ |  ✓ |  ○ |  - |  ✓ |  ○ |
07 SDK Automation       |  ✓ |  ✓ |  ○ |  ○ |  ○ |  ✓ |  - |  ○ |
08 Terminology          |  ✓ |  ✓ |  ✓ |  ○ |  ○ |  ○ |  ○ |  - |

✓ = 強組合（通常一起使用）
○ = 弱組合（可以但不必要）
- = 同一模組
```

---

## 輸出格式（模組二標準輸出）

```markdown
## 可複用模組清單

### 高優先級模組（立即可產品化）

| 模組 | Skill Category | Reusability | Effort |
|------|---------------|-------------|--------|
| <名稱> | <類別> | Cross-repo | Small |

### 中優先級模組（需要標準化後可複用）

| 模組 | Skill Category | Reusability | Effort |
|------|---------------|-------------|--------|
| <名稱> | <類別> | Cross-repo | Medium |

### 模組詳細定義

#### Module: <模組名稱>

**Skill Category**: <類別>
**Inputs**: <輸入>
**Steps**: <步驟>
**Output**: <輸出>
**Compose with**: <可組合的其他模組>
```

---

*此模組為 Skrill 框架的輸出類別二（可複用模組）的標準化執行指南。*
