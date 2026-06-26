<!--
  path: unified-gates/docs/governance-model.md
  governanceCode: mycodexvantaos-00000
  version: 1.0.0
  status: normative
-->

# Unified Gates — Governance Model v1.0.0

> **Version:** 1.0.0  
> **Governance Code:** `mycodexvantaos-00000`  
> **Status:** normative

---

## 1. Governance Authority

The **Platform Governance Council** (`platform-governance-council@mycodexvantaos.com`) is the ultimate authority for the Unified Gate System. The council is responsible for:

- Approving new gate definitions and lifecycle transitions.
- Reviewing and approving waivers for critical gates.
- Resolving escalated gate failures that cannot be resolved at the team level.
- Maintaining the normative specifications in `SPEC.md` and `gate/`.

---

## 2. Role Hierarchy

| Role | Permissions | Assigned To |
|------|-------------|-------------|
| `gate-reader` | Read gate definitions and reports | All engineers |
| `gate-evaluator` | Execute gate evaluations, write results | CI runners |
| `gate-owner` | Modify gate definitions, approve P3/P4 waivers | Team leads |
| `gate-approver` | Approve lifecycle transitions, P2 waivers | Senior engineers |
| `governance-council` | Approve P1 waivers, cross-layer changes | Council members |
| `gate-admin` | Full access (requires root approval) | Platform admins |

---

## 3. Gate Lifecycle Governance

Every gate lifecycle transition MUST be approved by the appropriate authority:

| Transition | Required Approver |
|-----------|------------------|
| `proposed` → `active` | Governance council |
| `active` → `deprecated` | Gate owner + council review |
| `deprecated` → `archived` | Gate owner (after 30-day notice) |
| `archived` → `destroyed` | Governance council |

---

## 4. Waiver Governance

Waivers are time-limited exceptions that permit a gate to be skipped. The waiver process is defined in `workflows/gate-waiver-workflow.yaml` and governed by `policies/gate-waiver-policy.yaml`.

| Gate Criticality | Waiver Approver | Max Duration | Max Renewals |
|-----------------|-----------------|--------------|--------------|
| `critical` | Governance council | 30 days | 2 |
| `high` | Gate owner | 30 days | 2 |
| `medium` | Gate owner | 30 days | 2 |
| `low` | Gate evaluator | 30 days | 2 |

---

## 5. Evidence Governance

All gate evaluations MUST produce cryptographically-chained evidence records. Evidence records are immutable, append-only, and MUST be retained for the periods defined in `SPEC.md` Section 8.3.

The evidence chain is validated by `gate-95-audit-evidence-chain-validation` on every pipeline run. Any gap in the chain is treated as a `FAIL` condition.

---

## 6. SLO Governance

Gate SLOs are defined in `gate/5-governance/gate-slo.rst`. SLO breaches are recorded as governance events and reviewed in the weekly governance council meeting. Repeated SLO breaches (3+ consecutive weeks) for the same gate MUST trigger a gate review.

---

## 7. Cost Governance

Gate evaluation costs are tracked per namespace and attributed to the owning team. Cost attribution records are validated by `gate-56-cost-attribution-validation`. Budget overruns MUST be escalated to the governance council within 24 hours.
