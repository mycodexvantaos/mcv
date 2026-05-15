<div align="center">

# CodexVanta OS — Decision Engine

**Autonomous Decision-Making & Policy Evaluation Core**

[![CI](https://img.shields.io/github/actions/workflow/status/codexvanta/codexvanta-os-decision-engine/ci.yml?branch=main&label=CI)](../../actions)
[![Provider Architecture](https://img.shields.io/badge/architecture-Native--first-blue)](#architecture)
[![Tier](https://img.shields.io/badge/tier-3-orange)](#dependency-tier)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Overview

`decision-engine` is the platform's autonomous decision-making core. It evaluates repository states, scan results, policy violations, and operational metrics against configurable rule sets to produce actionable decisions — auto-remediation triggers, approval gates, escalation paths, and governance verdicts. The engine operates deterministically in Native mode using a built-in rule evaluator and can optionally connect to external AI/ML services for enhanced decision support.

## Key Capabilities

- **Rule Evaluation** — Executes policy rules against repository and platform state
- **Decision Trees** — Configurable decision trees for complex multi-step evaluations
- **Auto-Remediation** — Triggers automated fixes when confidence exceeds threshold
- **Approval Gates** — Routes decisions requiring human review to appropriate reviewers
- **Escalation Paths** — Automatic escalation based on severity and response time
- **Audit Trail** — Every decision logged with full context, inputs, and rationale
- **Confidence Scoring** — Probabilistic confidence scores for all decisions

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  decision-engine                      │
│                                                       │
│  ┌──────────┐   ┌───────────────┐   ┌─────────────┐ │
│  │ Input    │──▶│ Rule          │──▶│ Decision    │ │
│  │ Collector│   │ Evaluator     │   │ Router      │ │
│  └──────────┘   └───────────────┘   └──────┬──────┘ │
│                                             │        │
│                  ┌──────────────────────┐    │        │
│                  │ Decision Outcomes    │◀───┘        │
│                  ├──────────────────────┤             │
│                  │ • Auto-Remediate     │             │
│                  │ • Approval Gate      │             │
│                  │ • Escalate           │             │
│                  │ • Log & Continue     │             │
│                  └──────────────────────┘             │
│                                                       │
│  ┌──────────┐   ┌───────────────┐                    │
│  │ Audit    │◀──│ Confidence    │                    │
│  │ Logger   │   │ Scorer        │                    │
│  └──────────┘   └───────────────┘                    │
└──────────────────────────────────────────────────────┘
```

## Provider Dependencies

| Provider              | Usage                                           |
| --------------------- | ----------------------------------------------- |
| DatabaseProvider      | Decision history, rule definitions, audit trail |
| StateStoreProvider    | Current evaluation state and pending decisions  |
| NotificationProvider  | Escalation alerts and approval requests         |
| ObservabilityProvider | Decision metrics, evaluation latency            |
| ValidationProvider    | Input validation before rule evaluation         |

## Operational Modes

| Mode          | Behavior                                                        |
| ------------- | --------------------------------------------------------------- |
| **Native**    | Built-in rule evaluator, SQLite decision store, in-memory state |
| **Connected** | External rule engine, PostgreSQL history, Redis state cache     |
| **Hybrid**    | Native evaluator with external notification delivery            |

## Directory Structure

```
codexvanta-os-decision-engine/
├── src/
│   ├── index.ts
│   └── services/
│       ├── DecisionEngineService.ts
│       ├── RuleEvaluatorService.ts
│       ├── ConfidenceService.ts
│       └── AuditService.ts
├── tests/
│   └── index.test.ts
├── REPO_MANIFEST.yaml
├── package.json
├── tsconfig.json
└── README.md
```

## Dependency Tier

**Tier 3** — Depends on Tier 0–2 packages including `core-main`, `data-pipeline`, `policy-engine`.

```
Tier 0: core-kernel
  └─▶ Tier 1 → Tier 2: core-main, data-pipeline, ...
       └─▶ Tier 3: decision-engine ◀── You are here
```

## Quick Start

```bash
pnpm install
pnpm build
pnpm test
```

## Related Packages

- [`policy-engine`](../codexvanta-os-policy-engine) — Policy definitions consumed by rule evaluator
- [`governance-autonomy`](../codexvanta-os-governance-autonomy) — Governance decisions and approvals
- [`automation-core`](../codexvanta-os-automation-core) — Executes auto-remediation actions

---

<div align="center">
<sub>Part of the <a href="https://github.com/codexvanta">CodexVanta OS</a> platform — Native-first / Provider-agnostic Architecture</sub>
</div>
