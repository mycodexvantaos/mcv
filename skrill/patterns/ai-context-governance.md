# Pattern: AI Context Governance（AI 上下文安全治理）

**Category**: AI Governance
**Maturity**: Production
**Score**: 93/100
**Source**: MyCodexVantaOS Core Archive

---

## Problem

大多數 AI 工程專案只把 AI 當作調用工具，沒有治理 AI 的輸入、輸出和上下文：

- 敏感資料（PII、密鑰、商業機密）可能進入 LLM
- Context window 沒有壓縮，浪費 token 且效率低
- AI 輸出沒有驗證，可能包含不一致的術語或有害內容
- 沒有審計日誌，無法追溯 AI 的決策過程

## Context

適用於：

- 任何整合 LLM API 的系統
- 需要合規審計的 AI 應用
- 企業內部 AI 工具
- 涉及敏感資料處理的 AI Pipeline

## Forces

| 張力 | 說明 |
|------|------|
| 完整 Context vs 隱私保護 | 完整 context 有利 AI 理解，但可能包含敏感資料 |
| 速度 vs 安全 | 跳過治理更快，但有安全風險 |
| 彈性 vs 一致性 | 靈活的 prompt 不易審計 |

## Solution

建立四層 AI 上下文治理管道：

```text
AI Context Governance Layer
  ├── Sensitive Data Redactor    — 遮罩敏感資料後再送入 LLM
  ├── Context Compressor         — 壓縮 context，保留最相關部分
  ├── Context Relevance Ranker   — 對 context 片段排序
  ├── Terminology Validator      — 驗證 AI 輸出是否使用正確術語
  ├── Output Policy Checker      — 驗證 AI 輸出是否符合政策
  └── Audit Trail Recorder       — 記錄每次 AI 調用的審計鏈
```

## Tradeoffs

| 優點 | 代價 |
|------|------|
| 防止敏感資料洩漏 | 遮罩可能降低 AI 理解能力 |
| 完整審計日誌 | 審計存儲成本 |
| 術語一致性 | 輸出驗證增加延遲 |
| 合規可審計 | 需要維護規則集 |

## Implementation Guide

### Step 1: 敏感資料遮罩

```python
# python/ai_context/redactor.py
import re

SENSITIVE_PATTERNS = {
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'api_key': r'\b(sk-|pk-|api-)[A-Za-z0-9]{20,}\b',
    'ip_address': r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
    'credit_card': r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b',
}

def redact_sensitive_data(text: str) -> str:
    """遮罩所有敏感資料"""
    for name, pattern in SENSITIVE_PATTERNS.items():
        text = re.sub(pattern, f'[REDACTED:{name}]', text)
    return text
```

### Step 2: Context 壓縮

```python
# python/ai_context/compressor.py
from typing import List

def compress_context(
    messages: List[dict],
    max_tokens: int = 8000,
    strategy: str = 'relevance-first'
) -> List[dict]:
    """壓縮 context 到指定 token 數"""
    if strategy == 'relevance-first':
        return rank_and_trim(messages, max_tokens)
    elif strategy == 'recency-first':
        return trim_oldest(messages, max_tokens)
    else:
        raise ValueError(f"Unknown strategy: {strategy}")
```

### Step 3: 術語驗證

```python
# python/ai_context/terminology_validator.py
import yaml

def load_terminology_dictionary(path: str) -> dict:
    with open(path) as f:
        return yaml.safe_load(f)

def validate_ai_output(text: str, dictionary: dict) -> dict:
    """驗證 AI 輸出是否符合術語規範"""
    violations = []
    for deprecated, correct in dictionary.get('deprecated_terms', {}).items():
        if deprecated in text:
            violations.append({
                'found': deprecated,
                'replace_with': correct,
                'severity': 'warning'
            })
    return {'valid': len(violations) == 0, 'violations': violations}
```

### Step 4: 審計日誌

```python
# python/ai_context/audit_recorder.py
import json, hashlib
from datetime import datetime

def record_ai_call(
    input_hash: str,
    output_hash: str,
    model: str,
    policy_results: dict,
    previous_chain_hash: str = ""
) -> dict:
    """記錄每次 AI 調用的審計記錄"""
    record = {
        'timestamp': datetime.utcnow().isoformat(),
        'model': model,
        'input_hash': input_hash,
        'output_hash': output_hash,
        'policy_results': policy_results,
        'previous_chain_hash': previous_chain_hash,
        'chain_hash': None  # 稍後計算
    }
    # 計算與前一條記錄的 hash chain
    chain_payload = {
        'timestamp': record['timestamp'],
        'model': model,
        'input_hash': input_hash,
        'output_hash': output_hash,
        'policy_results': policy_results,
        'previous_chain_hash': previous_chain_hash,
    }
    record['chain_hash'] = hashlib.sha256(
        json.dumps(chain_payload, sort_keys=True).encode()
    ).hexdigest()
    return record
```

## CI Enforcement

```yaml
name: AI Context Governance Check
on:
  pull_request:
    paths:
      - 'python/ai_context/**'
      - 'services/*/ai-integration/**'

jobs:
  ai-governance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check redactor coverage
        run: python scripts/check-redactor-coverage.py
      - name: Validate terminology dictionary
        run: python scripts/validate-terminology-dict.py
      - name: Check audit trail completeness
        run: python scripts/check-audit-trail.py
```

## Security Considerations

- 遮罩規則必須定期更新，跟上新的敏感資料類型
- 審計日誌必須使用 hash chain，防止篡改
- Terminology dictionary 必須版本控制，防止被惡意修改
- AI 輸出不能直接傳給下游系統，必須先通過 policy checker

## Example Structure

```text
python/ai_context/
├── __init__.py
├── redactor.py           — 敏感資料遮罩
├── compressor.py         — Context 壓縮
├── ranker.py             — Relevance 排序
├── terminology_validator.py — 術語驗證
├── output_policy.py      — 輸出政策檢查
└── audit_recorder.py     — 審計記錄

docs/governance/
├── terminology-dictionary.md    — 術語字典
├── sensitive-data-categories.md — 敏感資料類別
└── ai-context-policy.md         — AI 上下文政策
```

## Migration Strategy

```text
Week 1: 現狀評估
  - 掃描所有 LLM 調用點
  - 識別是否有敏感資料可能進入 LLM
  - 建立 sensitivity audit report

Week 2-3: 最小可行治理
  - 部署 Sensitive Data Redactor
  - 建立 terminology dictionary 初版
  - 記錄所有 LLM 調用（audit log）

Week 4-6: 完整管道
  - 部署 Context Compressor
  - 部署 Output Policy Checker
  - 整合 Terminology Validator

Week 7+: CI 整合
  - 建立 ai-context-governance.yml
  - 要求所有 AI 代碼通過 governance gate
```

---

*Pattern Score: 93/100 | Priority: Must Implement | Related Skill: SM-03-A*
