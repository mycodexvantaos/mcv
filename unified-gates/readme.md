# unified-gates — MyCodexVantaOS Unified Gate System

> **Version:** 1.0.0
> **apiVersion:** `mycodexvantaos.io/v1`
> **Governance Code:** `mycodexvantaos-00000`
> **Status:** normative
> **Authority:** unified-gate-governance
> **URN:** `urn:mycodexvantaos:unified-gates:module:unified-gates`

---

## Overview

`unified-gates/` is the **single source of truth** for the MyCodexVantaOS platform gate system. It defines, catalogs, and enforces quality gates across all AI infrastructure layers — from namespace governance and compute provisioning through model lifecycle, workload execution, billing metering, and production closure.

A **gate** is a machine-verifiable checkpoint that a software artifact, service, or infrastructure component must satisfy before advancing to the next lifecycle stage. Gates are not advisory; they are **blocking by default** and emit cryptographically-chained audit evidence.

---

## Directory Structure

```
unified-gates/
├── readme.md                        ← This file
├── gate-catalog.yaml                ← Master gate catalog (all planes)
├── ai-infra-gate-catalog.yaml       ← AI infrastructure gate catalog
├── unified-gate-index.yaml          ← Authoritative gate plane index
│
├── gate/                            ← Gate specification documentation (RST)
│   ├── 1-core/                      ← Core gate model and policies
│   ├── 2-lifecycle/                 ← Gate lifecycle and state machine
│   ├── 3-technical/                 ← Technical framework and SDK
│   ├── 4-execution/                 ← Execution engine and observability
│   ├── 5-governance/                ← RBAC, compliance, risk, SLO
│   ├── 6-domain-ai/                 ← AI-specific gate domains
│   ├── 7-evolution/                 ← Experiments and roadmap
│   └── 8-coverage/                  ← Coverage taxonomy (11 sub-dimensions)
│
├── ai-infra-gates/                  ← Executable AI infrastructure gates (YAML)
│   ├── l00/                         ← Meta-governance (gates 01–08)
│   ├── l10/                         ← Compute infrastructure (gates 11–18)
│   ├── l20/                         ← Data and vector layer (gates 21–28)
│   ├── l30/                         ← AI framework and model layer (gates 31–38)
│   ├── l40/                         ← Workload execution layer (gates 41–48)
│   ├── l50/                         ← Billing and metering layer (gates 51–58)
│   ├── l60/                         ← Cloud infrastructure layer (gates 61–64)
│   └── l90/                         ← Supply chain and production closure (gates 91–99)
│
├── contracts/                       ← Gate contract schemas (YAML)
├── schemas/                         ← JSON Schema definitions
├── workflows/                       ← Gate evaluation workflows (YAML)
├── policies/                        ← Governance policies (YAML)
├── scripts/                         ← CI validation and reporting scripts (Python)
└── outputs/                         ← Report output templates (JSON)
```

---

## Gate Layer Model

| Layer | Code Range | Domain | Blocking |
|-------|-----------|--------|----------|
| `l00` | 01–08 | Meta-governance & namespace | MUST |
| `l10` | 11–18 | AI compute infrastructure | MUST |
| `l20` | 21–28 | Data & vector layer | MUST |
| `l30` | 31–38 | AI framework & model layer | MUST |
| `l40` | 41–48 | Workload execution | MUST |
| `l50` | 51–58 | Billing & metering | MUST |
| `l60` | 61–64 | Cloud infrastructure | MUST |
| `l90` | 91–99 | Supply chain & production closure | MUST |

---

## Core Principles

All gates in this system adhere to the following invariants derived from `mycodexvantaos-00000`:

1. **Machine-verifiable** — every gate check must be executable by a CI runner without human judgment.
2. **Evidence-chained** — every gate evaluation emits a SHA-256 / SHA3-512 / BLAKE3 evidence record.
3. **Lifecycle-governed** — gates follow the `proposed → active → deprecated → archived → destroyed` lifecycle.
4. **Namespace-compliant** — all gate IDs, owner references, and artifact paths follow canonical kebab-case naming.
5. **Dependency-acyclic** — gate dependency graphs must remain directed acyclic graphs (DAGs).
6. **Audit-traceable** — every gate state transition is recorded in the immutable audit log.

---

## Quick Start

```bash
# Validate the gate catalog
python scripts/validate-gate-catalog.py --root .

# Validate all AI infrastructure gates
python scripts/validate-ai-infra-gates.py --root . --layer all

# Generate a full gate report
python scripts/generate-gate-report.py --root . --output outputs/gate-validation-report.json

# Generate the production closure report
python scripts/generate-production-closure-report.py --root . --output outputs/production-closure-report.json
```

---

## Evidence Retention Policy

| Criticality | Minimum Retention |
|-------------|-------------------|
| `critical` | 2555 days (7 years) |
| `high` | 1095 days (3 years) |
| `medium` | 365 days (1 year) |
| `low` | 180 days (6 months) |

---

## Related Specifications

- Namespace Governance: `docs/governance/namespace-governance-closure-spec.md`
- Governance Baseline: `mycodexvantaos-00000`
- CI Validator: `ci/namespace_check.py`
- Module Manifest: `unified-gates/mycodexvantaos-module.yaml`
