# MyCodexVantaOS Gate Integration Guide

## Quick Start

1. Install dependencies: `pip install pyyaml jsonschema`
2. Run gate validation: `python unified-gates/scripts/validate-ai-infra-gates.py`
3. Generate report: `python unified-gates/scripts/generate-gate-report.py`

## Production Closure

Gate 99 (gate-99-production-closure-validation) is the final gate.
All preceding gates must pass before gate-99 can be evaluated.
