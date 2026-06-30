# Pattern: Terminology Governance（術語治理與語意一致性）

**Category**: Governance
**Maturity**: Proven
**Score**: 85/100
**Source**: MyCodexVantaOS Core Archive

---

## Problem

大型 AI 工程專案中，術語不一致是最容易被低估卻影響深遠的問題：

- 同一概念在代碼、文件、API、PR 描述中有多種命名
- AI Agent 生成的內容用詞隨時間漂移
- 新團隊成員無法快速理解術語體系
- 外部 SDK/API 文件與內部術語不對齊

## Solution

```text
Terminology Governance Engine
  ├── Terminology Dictionary    — 術語正典
  ├── Deprecated Term Detector  — 棄用詞偵測
  ├── Replacement Suggestion    — 替代詞建議
  ├── Documentation Scanner     — 文件掃描
  ├── Code Comment Scanner      — 代碼注釋掃描
  └── AI Output Validator       — AI 輸出驗證
```

## Implementation Guide

### Terminology Dictionary Format

```markdown
# docs/governance/terminology-dictionary.md

## Canonical Terms

| Canonical Term         | Deprecated Terms                    | Context             |
| ---------------------- | ----------------------------------- | ------------------- |
| `unified-gate`         | `api-gateway`, `middleware-gate`    | 跨模組通訊治理層    |
| `provider-adapter`     | `cloud-connector`, `vendor-wrapper` | 雲廠商抽象層        |
| `namespace-governance` | `namespace-management`              | 命名空間治理體系    |
| `capability-id`        | `feature-id`, `function-id`         | Provider 能力標識符 |
```

### Terminology Linter

```python
# scripts/terminology_linter.py
import re, yaml, sys
from pathlib import Path

def load_dictionary(path: str) -> dict:
    with open(path) as f:
        content = f.read()
    # 從 Markdown 表格解析術語字典
    canonical_map = {}
    for line in content.split('\n'):
        if '|' in line and 'Canonical' not in line and '---' not in line:
            parts = [p.strip('` ') for p in line.split('|')[1:4]]
            if len(parts) >= 2:
                canonical = parts[0]
                deprecated = [t.strip() for t in parts[1].split(',')]
                for dep in deprecated:
                    if dep:
                        canonical_map[dep] = canonical
    return canonical_map

def lint_file(file_path: str, canonical_map: dict) -> list:
    violations = []
    with open(file_path) as f:
        content = f.read()
    for deprecated, canonical in canonical_map.items():
        pattern = re.compile(r'\b' + re.escape(deprecated) + r'\b', re.IGNORECASE)
        for match in pattern.finditer(content):
            line_num = content[:match.start()].count('\n') + 1
            violations.append({
                'file': file_path,
                'line': line_num,
                'found': match.group(),
                'replace_with': canonical,
                'severity': 'warning'
            })
    return violations

if __name__ == '__main__':
    dictionary = load_dictionary('docs/governance/terminology-dictionary.md')
    all_violations = []

    for ext in ['*.md', '*.ts', '*.py', '*.yaml']:
        for file in Path('.').rglob(ext):
            if '.git' not in str(file) and 'node_modules' not in str(file):
                violations = lint_file(str(file), dictionary)
                all_violations.extend(violations)

    if all_violations:
        for v in all_violations:
            print(f"{v['file']}:{v['line']}: Found '{v['found']}', use '{v['replace_with']}'")
        sys.exit(1)
    else:
        print("✓ All terminology is correct")
        sys.exit(0)
```

## CI Enforcement

```yaml
name: Terminology Lint
on:
  pull_request:
    paths:
      - "**/*.md"
      - "**/*.ts"
      - "**/*.py"
      - "**/*.yaml"

jobs:
  terminology-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      - name: Run terminology linter
        run: python scripts/terminology_linter.py
```

## Example Structure

```text
docs/governance/
└── terminology-dictionary.md

scripts/
└── terminology_linter.py

.github/workflows/
└── terminology-lint.yml
```

---

_Pattern Score: 85/100 | Priority: High | Related Skill: SM-08-A_
