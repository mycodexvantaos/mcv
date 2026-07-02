# Pattern: Namespace Governance（命名空間治理與依賴邊界控制）

**Category**: Governance
**Maturity**: Production
**Score**: 92/100
**Source**: MyCodexVantaOS Core Archive + Unified Architecture Patch

---

## Problem

大型 repo 中命名空間的腐化是最常見但最難察覺的問題：

- 不同模組使用相同概念但不同名稱
- 依賴關係隨時間變成「依賴蜘蛛網」
- AI Agent 生成的代碼使用錯誤的命名
- Package name、URN、Kubernetes label 不一致
- 沒有機制可以防止「名稱漂移」

## Context

適用於：

- 有超過 20 個模組的 monorepo
- 多個團隊共同維護的平台
- 使用 AI Agent 進行代碼生成的項目
- 需要長期維護（> 2 年）的系統

## Forces

| 張力                 | 說明                           |
| -------------------- | ------------------------------ |
| 靈活命名 vs 嚴格規範 | 靈活命名開發快，但長期造成混亂 |
| 向後相容 vs 清晰命名 | 歷史遺留命名不一定是最好的     |
| 自動化 vs 人工審查   | 純靠 code review 無法防止漂移  |

## Solution

建立三層命名空間治理閉環：

```text
Layer 1: Canonical Identity Definition
  - Human-facing brand identity（品牌名稱）
  - Machine-facing canonical identity（機器名稱）
  - Legacy alias isolation（歷史別名隔離）

Layer 2: Namespace Registry
  - 所有合法命名空間登記
  - 每個命名空間的生命週期
  - 治理代碼（governance code）

Layer 3: CI Enforcement
  - 驗證每個新增命名空間是否在 registry 中
  - 驗證命名是否符合 policy
  - 阻止未登記的命名空間進入 main
```

**品牌與機器身份分離範例**：

```yaml
# mycodexvantaos-namespace-governance/governance/registry/namespace-registry.yaml
canonical_identity:
  machine: mycodexvantaos # 機器用（全小寫）
  brand: MyCodexVantaOS # 品牌用（CamelCase）
  legacy_aliases:
    - MyCodeXvantaOS # 歷史名稱（已棄用）
    - MyCodeXvanta OS # 歷史名稱（已棄用）
  forbidden_prefixes:
    - codex- # 禁止使用的前綴
    - vanta-
```

## Tradeoffs

| 優點             | 代價                        |
| ---------------- | --------------------------- |
| 防止命名腐化     | 需要維護 namespace registry |
| AI 輸出可驗證    | 新增命名空間需要申請流程    |
| 跨 repo 命名一致 | 初期需要大量整理工作        |
| CI 自動強制執行  | 可能阻止合理的快速實驗      |

## Implementation Guide

### Step 1: 建立命名政策

```json
// governance/naming-policy.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "title": "Naming Policy",
  "properties": {
    "namespace": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "maxLength": 63
    },
    "service_id": {
      "type": "string",
      "pattern": "^mycodexvantaos-[a-z][a-z0-9-]*$"
    },
    "capability_id": {
      "type": "string",
      "pattern": "^[a-z]+-[a-z0-9-]+$"
    }
  }
}
```

### Step 2: 建立 Namespace Registry

```yaml
# mycodexvantaos-namespace-governance/governance/registry/namespace-registry.yaml
namespaces:
  - id: mycodexvantaos-core
    status: active
    governance_code: NS-CORE-001
    created: 2026-01-01
    owner: platform-team

  - id: mycodexvantaos-provider
    status: active
    governance_code: NS-PROV-001
    created: 2026-01-01
    owner: provider-team
```

### Step 3: 建立 Closure Validator

```python
# scripts/validate-namespace-closure.py
import yaml, sys, re

def validate_namespace(name: str, registry: dict) -> bool:
    """驗證命名空間是否在 registry 中"""
    registered = {ns['id'] for ns in registry['namespaces']}
    if name not in registered:
        print(f"ERROR: Namespace '{name}' not registered")
        return False
    return True

def check_naming_policy(name: str, policy: dict) -> bool:
    """驗證命名是否符合政策"""
    pattern = policy['properties']['namespace']['pattern']
    if not re.match(pattern, name):
        print(f"ERROR: '{name}' violates naming policy")
        return False
    return True
```

### Step 4: 整合 CI

```yaml
# .github/workflows/namespace-closure-check.yml
name: Namespace Closure Check
on:
  pull_request:
    paths:
      - 'mycodexvantaos-namespace-governance/**'
      - 'modules/*/module-manifest.yaml'
      - 'providers/**'

jobs:
  namespace-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate namespace closure
        run: python scripts/validate-namespace-closure.py
```

## CI Enforcement

```yaml
name: Namespace Governance
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  namespace-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check canonical identity usage
        run: |
          # 確保沒有使用 legacy 別名
          grep -r "MyCodeXvantaOS\|MyCodeXvanta OS" . \
            --include="*.ts" --include="*.py" --include="*.yaml" \
            && echo "FAIL: Legacy alias found" && exit 1 || echo "PASS"

      - name: Validate namespace registry
        run: python scripts/validate-namespace-closure.py --strict

      - name: Check naming policy compliance
        run: node ci/utils/naming-closure-prover.ts
```

## Security Considerations

- Namespace registry 本身需要 code review 保護（不能隨意添加命名空間）
- AI Agent 生成的代碼必須通過 namespace validation 才能合入
- Legacy alias 需要有明確的棄用時間表，不能永久保留

## Example Structure

```text
mycodexvantaos-namespace-governance/
├── mycodexvantaos-module.yaml      — 根模組契約
├── governance/
│   ├── codes/
│   │   └── index.yaml             — 治理代碼索引
│   ├── registry/
│   │   └── namespace-registry.yaml — 命名空間登記冊
│   ├── policies/
│   │   └── naming-policy.yaml     — 命名政策
│   └── lifecycle/
│       └── deprecation-schedule.yaml — 棄用時間表
└── closure-records/
    └── closure-validation.yaml    — 閉環驗證記錄
```

## Migration Strategy

```text
Week 1: 現狀掃描
  - 掃描所有現有命名空間
  - 識別命名不一致的位置
  - 建立 legacy alias 清單

Week 2-3: Registry 建立
  - 建立 namespace-registry.yaml
  - 將所有現有命名空間登記
  - 建立 naming-policy.schema.json

Week 4-6: CI 整合
  - 部署驗證腳本
  - CI 設為 warning 模式（觀察期）
  - 修復所有 violation

Week 7+: 全面執行
  - CI 設為 blocking 模式
  - 開始強制執行 legacy alias 棄用
```

---

_Pattern Score: 92/100 | Priority: Must Implement | Related Skill: SM-16-A_
