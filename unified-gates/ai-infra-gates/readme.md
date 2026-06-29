# ai-infra-gates/ — AI Infrastructure Gate Definitions

> **Path:** `unified-gates/ai-infra-gates/`
> **Version:** 1.0.0
> **Type:** Executable YAML gate definitions
> **Authority:** unified-gate-governance

This directory contains the executable YAML gate definitions for all AI infrastructure
layers in the MyCodexVantaOS platform. Each gate is a machine-verifiable, blocking
checkpoint that an artifact or infrastructure component must satisfy before advancing.

## Layer Index

| Layer  | Range | Domain                            | Gates |
| ------ | ----- | --------------------------------- | ----- |
| `l00/` | 01–08 | Meta-governance                   | 8     |
| `l10/` | 11–18 | AI Compute Infrastructure         | 8     |
| `l20/` | 21–28 | Data & Vector Layer               | 8     |
| `l30/` | 31–38 | AI Framework & Model Layer        | 8     |
| `l40/` | 41–48 | Workload Execution Layer          | 8     |
| `l50/` | 51–58 | Billing & Metering Layer          | 8     |
| `l60/` | 61–64 | Cloud Infrastructure Layer        | 4     |
| `l90/` | 91–99 | Supply Chain & Production Closure | 9     |

**Total: 61 gate definitions**

## Validation

```bash
python scripts/validate-ai-infra-gates.py --root . --layer all
```
