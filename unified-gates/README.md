# Unified Gates

The `unified-gates/` directory owns the platform gate system for MyCodexVantaOS.

## Gate Planes

| Plane | Description |
|---|---|
| `gate/` | Core gate catalog and policies |
| `ai-infra-gates/` | AI infrastructure gates (executable) |
| `quality-gates/` | Quality gates (static analysis, coverage, security) |
| `production-gates/` | Production readiness gates |

## Gate Evidence

Every gate MUST require evidence with:
- SHA-256 for runtime audit chain compatibility
- SHA3-512 for long-term integrity
- BLAKE3 for fast CI comparison

## Evidence Retention

| Criticality | Minimum Retention |
|---|---|
| critical | 2555 days (7 years) |
| high | 1095 days (3 years) |
| medium | 365 days (1 year) |
| low | 180 days (6 months) |
