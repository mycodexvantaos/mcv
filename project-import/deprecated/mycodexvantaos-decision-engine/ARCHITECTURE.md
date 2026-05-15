# Decision Engine — Architecture Document

## Purpose

`decision-engine` evaluates platform state against configurable rules and policies to produce autonomous decisions. It serves as the "brain" of the platform's automated governance, determining when to auto-remediate, when to escalate, and when to gate on human approval.

## Decision Flow

```
Input Event
     │
     ▼
┌──────────────┐
│ Input        │
│ Normalization│
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ Rule         │────▶│ Confidence   │
│ Evaluation   │     │ Scoring      │
└──────┬───────┘     └──────┬───────┘
       │                     │
       ▼                     ▼
┌──────────────────────────────────┐
│         Decision Router          │
├──────────┬───────────┬───────────┤
│ Auto-Fix │ Approval  │ Escalate  │
│ (>90%)   │ (50-90%)  │ (<50%)    │
└──────────┴───────────┴───────────┘
```

## Rule Evaluation Engine

### Rule Types

| Type          | Description                                                    |
| ------------- | -------------------------------------------------------------- |
| **Threshold** | Numeric comparison (e.g., vulnerability count > 10)            |
| **Pattern**   | Regex or glob matching (e.g., file path matches `*.secret*`)   |
| **Temporal**  | Time-based rules (e.g., no deploy on Friday after 5pm)         |
| **Composite** | AND/OR/NOT combinations of other rules                         |
| **Stateful**  | Rules that consider historical state (e.g., 3 failures in 24h) |

### Evaluation Context

```typescript
interface EvaluationContext {
  repository: RepositoryState;
  scanResults: ScanResult[];
  policies: PolicySet;
  history: DecisionHistory;
  environment: EnvironmentState;
  timestamp: Date;
}
```

## Confidence Scoring Model

```
Base Confidence = Rule Match Strength (0-1)
  × Data Freshness Factor (0.5-1.0)
  × Historical Accuracy (0.7-1.0)
  × Policy Alignment (0.8-1.0)
= Final Confidence Score
```

## Audit Trail Schema

Every decision produces an immutable audit record:

```typescript
interface DecisionAudit {
  id: string;
  timestamp: Date;
  input: EvaluationContext;
  rulesEvaluated: RuleResult[];
  confidence: number;
  outcome: 'auto-remediate' | 'approval-gate' | 'escalate' | 'log';
  rationale: string;
  executedBy: 'system' | 'human';
}
```

## Design Principles

1. **Deterministic in Native Mode** — Same inputs always produce same outputs
2. **Full Auditability** — Every decision traceable to inputs and rules
3. **Configurable Thresholds** — All confidence thresholds adjustable per policy
4. **Separation of Evaluation and Execution** — Engine decides, other services execute
5. **Graceful Degradation** — Unknown inputs result in escalation, never silent failure
