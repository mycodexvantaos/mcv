# Governance Autonomy — Architecture Document

## Purpose

`governance-autonomy` orchestrates autonomous governance across the CodexVanta OS platform. It determines what actions can be taken automatically, what requires human approval, and what must be escalated — all based on configurable autonomy levels, policy evaluation results, and organizational governance rules.

## Autonomy Levels

```
┌─────────────────────────────────────────────────┐
│           Autonomy Level Spectrum                │
│                                                  │
│  Full-Auto ◀────────────────────▶ Manual-Only   │
│                                                  │
│  Level 1: Full-Auto                              │
│    All compliant changes auto-approved           │
│                                                  │
│  Level 2: Semi-Auto                              │
│    Low-risk auto-approved, high-risk gated       │
│                                                  │
│  Level 3: Review-Required                        │
│    All changes require at least one reviewer     │
│                                                  │
│  Level 4: Manual-Only                            │
│    Every action requires explicit approval        │
└─────────────────────────────────────────────────┘
```

## Approval Workflow Engine

```
Change Request
      │
      ▼
┌──────────────┐     ┌──────────────┐
│ Autonomy     │────▶│ Risk         │
│ Level Check  │     │ Assessment   │
└──────────────┘     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Auto-    │ │ Approval │ │ Escalate │
        │ Approve  │ │ Gate     │ │          │
        └──────────┘ └────┬─────┘ └──────────┘
                          │
                    ┌─────▼─────┐
                    │ Reviewer  │
                    │ Chain     │
                    │ (1..N)    │
                    └─────┬─────┘
                          │
                    ┌─────▼─────┐
                    │ Final     │
                    │ Verdict   │
                    └───────────┘
```

## Compliance Tracking Model

```typescript
interface CompliancePosture {
  repositoryId: string;
  overallScore: number; // 0-100
  policyResults: PolicyResult[];
  violations: Violation[];
  exemptions: Exemption[];
  lastEvaluated: Date;
  trend: 'improving' | 'stable' | 'degrading';
}
```

## Drift Detection

The drift detector continuously compares repository state against governance baselines:

1. **Configuration Drift** — Settings diverge from declared standards
2. **Dependency Drift** — Unapproved dependency changes
3. **Policy Drift** — New violations since last compliance check
4. **Structure Drift** — Required files missing or misplaced

## Exemption Lifecycle

```
Request → Review → Approve/Deny → Active (with TTL) → Expire → Re-evaluate
```

All exemptions have:

- Explicit expiration date
- Required justification
- Scope limitation (repo, policy, rule)
- Audit trail

## Design Principles

1. **Graduated Autonomy** — Trust earned through compliance history
2. **Full Auditability** — Every governance action has a traceable record
3. **Least Privilege** — Default to most restrictive autonomy level
4. **Temporal Exemptions** — No permanent policy bypasses
5. **Observable Governance** — Compliance metrics always available
