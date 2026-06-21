# Pattern: Unified Gate System（統一治理門控架構）

**Category**: Governance
**Maturity**: Production
**Score**: 95/100
**Source**: MyCodexVantaOS Core Archive

---

## Problem

在大型 monorepo 或微服務架構中，模組之間的直接依賴會逐漸形成「蜘蛛網」——每個模組都直接調用其他模組，沒有明確的邊界控制。這導致：

- 架構逐漸腐化，無法追溯
- 安全策略無法統一執行
- 速率限制只能在每個服務單獨設定
- 審計日誌散落在各處
- AI Agent 修改時容易越界

## Context

適用於以下情境：

- 超過 10 個模組的 monorepo
- 微服務架構中需要統一策略執行
- 需要讓 AI Agent 安全修改 repo
- 需要完整的操作審計日誌
- 需要跨模組速率限制

## Forces

| 張力 | 說明 |
|------|------|
| 自由 vs 控制 | 直接依賴開發最快，但難以治理 |
| 性能 vs 安全 | Gate 增加一層調用，但提供安全保障 |
| 靈活 vs 標準 | 標準 gate 限制了某些靈活用法 |
| 可見 vs 隱藏 | Gate 讓依賴顯式化，但增加學習成本 |

## Solution

設計一個中介層（Unified Gate），所有跨模組通訊必須通過它：

```text
Unified Gate System
  ├── Input Normalizer         — 正規化跨模組輸入
  ├── Policy Evaluator         — 執行安全策略
  ├── Dependency Boundary Checker — 驗證依賴合法性
  ├── Security Guard           — 安全檢查
  ├── Rate Limiter             — 速率控制
  ├── Audit Logger             — 審計日誌
  └── Integration Adapter      — 整合下游模組
```

**關鍵設計原則**：

```text
1. 所有跨模組通訊必須通過 gate（MUST）
2. Gate 本身不包含業務邏輯（MUST NOT）
3. Gate 必須是無狀態的（SHOULD）
4. Gate 的 policy 必須可配置（MUST）
5. Gate 的每次調用必須有審計記錄（MUST）
```

## Tradeoffs

| 優點 | 代價 |
|------|------|
| 統一的策略執行 | 每次跨模組調用多一層延遲 |
| 完整的審計日誌 | 需要維護 gate 服務本身 |
| AI Agent 安全邊界 | 開發者需要理解 gate 協議 |
| 集中的速率控制 | Gate 成為單點，需要高可用設計 |
| 依賴關係顯式化 | 初期建設成本較高 |

## Implementation Guide

### Step 1: 定義 Gate Contract

```yaml
# unified-gates/gate/gate-catalog.yaml
gates:
  - id: module-communication-gate
    type: inter-module
    policies:
      - rate-limit: 1000/minute
      - security: require-auth-token
      - audit: log-all-requests
    boundary:
      allowed-sources: [module-a, module-b]
      allowed-targets: [module-c, module-d]
      forbidden-direct-imports: true
```

### Step 2: 實作 Gate Middleware

```typescript
// unified-gates/gate/middleware.ts
interface GateRequest {
  source: ModuleId;
  target: ModuleId;
  operation: string;
  payload: unknown;
}

class UnifiedGate {
  async process(request: GateRequest): Promise<GateResponse> {
    await this.normalizeInput(request);
    await this.checkDependencyBoundary(request);
    await this.evaluatePolicy(request);
    await this.checkRateLimit(request);
    await this.auditLog(request);
    return this.forward(request);
  }
}
```

### Step 3: 建立 CI Gate 驗證

```yaml
# .github/workflows/architecture-governance.yml
jobs:
  gate-compliance:
    steps:
      - name: Check direct imports (violations)
        run: |
          node ci/check-direct-cross-module-imports.ts
          # 任何 module-a → module-b 的直接 import 都應 exit 1
```

### Step 4: 建立 Gate Index

```yaml
# unified-gates/unified-gate-index.yaml
version: 1.0.0
gates:
  - id: module-communication-gate
    location: unified-gates/gate/
    status: active
  - id: ai-infra-gate
    location: unified-gates/ai-infra-gates/
    status: active
```

## CI Enforcement

```yaml
# .github/workflows/architecture-governance.yml
name: Architecture Governance
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  gate-compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate gate compliance
        run: node ci/validate-gate-boundaries.ts
      - name: Check direct imports
        run: python scripts/check-direct-imports.py --fail-on-violation
```

## Security Considerations

- Gate 必須驗證調用方身份（來源 module 的 token 或 signature）
- Audit log 必須不可篡改（考慮 append-only storage 或 hash chain）
- Rate limiting 必須按調用方區分，防止一個模組拖垮整個系統
- Gate 的 policy 文件本身需要版本控制和 code review 保護

## Example Structure

```text
unified-gates/
├── gate/
│   ├── gate-catalog.yaml       — Gate 目錄
│   ├── middleware.ts           — Gate 中介軟體
│   └── policies/
│       ├── rate-limit.policy.yaml
│       ├── security.policy.yaml
│       └── audit.policy.yaml
├── ai-infra-gates/
│   └── ai-infra-gates-catalog.yaml
└── unified-gate-index.yaml     — Gate 全域索引
```

## Migration Strategy

**從無 Gate 到有 Gate 的遷移**：

```text
Week 1-2: 分析階段
  - 掃描所有直接跨模組 import
  - 建立依賴圖
  - 識別最高流量的跨模組通訊

Week 3-4: Gate 建立
  - 為最高流量路徑建立 Gate
  - 部署 Gate，設為 pass-through（不攔截）
  - 收集 audit log

Week 5-8: 漸進式執行
  - 為每個 module 切換到 gate-mediated 通訊
  - 每次切換後執行測試
  - CI gate 設為 warning（不 block）

Week 9+: 完全執行
  - CI gate 設為 blocking
  - 刪除所有直接依賴
  - Gate 開始執行 policy
```

---

*Pattern Score: 95/100 | Priority: Must Implement | Related Skill: SM-01-A*
