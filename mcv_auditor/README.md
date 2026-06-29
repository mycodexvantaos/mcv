# MyCodexVantaOS MCV Auditor (IM-MCV-002)

Security audit tool for the MyCodexVantaOS platform.

**Document ID:** IM-MCV-002  
**Spec Reference:** IM-MCV-001 (Security Audit Framework)  
**Version:** 1.0.0  
**Machine Identity:** mycodexvantaos  
**Canonical URL:** https://mycodexvantaos.com

## Overview

The MCV Auditor provides a six-phase security audit methodology:

| Phase | Description                                 |
| ----- | ------------------------------------------- |
| 0     | Environment validation                      |
| 1     | System prompt extraction                    |
| 2     | System prompt consistency analysis          |
| 3     | Tool schema analysis                        |
| 4     | Guardrail effectiveness testing (F1 ≥ 0.90) |
| 5     | Comprehensive audit report generation       |

## Quick Start

```bash
pip install -r requirements.txt
python run_audit.py --all --output audit-report.json
```

## Test Coverage

42 tests across 4 test files:

- test_analyzers.py: 22 tests
- test_prompt_leakage.py: 7 tests
- test_guardrail.py: 9 tests
- test_report.py: 6 tests

## Probes

32 audit probes covering T1-T12 threat vectors.
