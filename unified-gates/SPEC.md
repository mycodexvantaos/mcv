<!--
  path: unified-gates/SPEC.md
  governanceCode: mycodexvantaos-00000
  version: 1.0.0
  status: normative
-->

# unified-gates — Formal Specification v1.0.0

> **Document Type:** Normative Specification  
> **Version:** 1.0.0  
> **Status:** normative  
> **Governance Code:** `mycodexvantaos-00000`  
> **Authority:** unified-gate-governance  
> **Effective Date:** 2026-01-01  
> **URN:** `urn:mycodexvantaos:unified-gates:spec:v1.0.0`

---

## Abstract

This specification defines the **Unified Gate System (UGS)** for the MyCodexVantaOS AI engineering platform. A gate is a machine-verifiable, blocking checkpoint that an artifact, service, or infrastructure component MUST satisfy before advancing to the next lifecycle stage. This document establishes the normative requirements for gate definition, evaluation, evidence production, lifecycle governance, and CI/CD integration.

All requirements in this document use the RFC 2119 keywords: **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY**.

---

## 1. Scope

This specification applies to:

- All gate definitions authored under `unified-gates/ai-infra-gates/`
- All gate documentation authored under `unified-gates/gate/`
- All schemas, contracts, policies, workflows, and scripts in this module
- All CI pipelines that consume or enforce gates in the MyCodexVantaOS platform
- All services in the `mycodexvantaos` (control-plane) and `softwareos` (product-plane) namespaces

---

## 2. Normative References

| Reference              | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `mycodexvantaos-00000` | Namespace Governance Closure Specification (baseline)    |
| `mycodexvantaos-00100` | Repository Naming Canonical Specification                |
| `mycodexvantaos-00200` | Lifecycle State Machine Specification                    |
| `mycodexvantaos-00700` | Audit Evidence Chain Specification                       |
| `mycodexvantaos-40100` | Dataset Contract Specification                           |
| `mycodexvantaos-51000` | Compliance Reporting Specification                       |
| RFC 2119               | Key words for use in RFCs to Indicate Requirement Levels |
| ISO 8601               | Date and time format standard                            |

---

## 3. Definitions

**Gate:** A machine-verifiable, blocking checkpoint defined in YAML that an artifact MUST pass before lifecycle advancement.

**Gate Layer:** A logical grouping of gates by infrastructure concern, identified by a two-character code (`l00`–`l90`).

**Gate Evaluation:** The act of executing all checks within a gate against a target artifact and producing an evidence record.

**Evidence Record:** An immutable, cryptographically-hashed record of a gate evaluation result.

**Evidence Chain:** A linked sequence of evidence records where each record references the hash of the previous record.

**Waiver:** A time-limited, governance-approved exception that permits a gate to be skipped for a specific artifact.

**Governance Code:** A unique identifier of the form `mycodexvantaos-NNNNN` that traces a gate or artifact to its governing specification.

**Blocking Gate:** A gate with `blocking: true` that MUST halt the CI pipeline upon failure.

---

## 4. Gate Identity Requirements

### 4.1 Gate ID Format

Every gate MUST have a unique `id` field conforming to the pattern:

```
^gate-[0-9]{2}-[a-z0-9-]+$
```

Example: `gate-01-namespace-governance-validation`

### 4.2 Gate API Version

Every gate MUST declare:

```yaml
apiVersion: mycodexvantaos.io/v1
kind: AIInfraGate
```

### 4.3 Gate Version

Every gate MUST declare a semantic version in `metadata.version` conforming to `^[0-9]+\.[0-9]+\.[0-9]+$`. The initial version MUST be `1.0.0`.

### 4.4 Governance Code

Every gate MUST reference a valid governance code in `metadata.governanceCode` conforming to `^mycodexvantaos-[0-9]{5}$`.

---

## 5. Gate Layer Model

The gate system is organized into eight layers. Each layer covers a distinct infrastructure concern and MUST be evaluated in ascending layer order.

| Layer | Code Range | Domain                            | Default Criticality |
| ----- | ---------- | --------------------------------- | ------------------- |
| `l00` | 01–08      | Meta-governance & namespace       | critical            |
| `l10` | 11–18      | AI compute infrastructure         | critical            |
| `l20` | 21–28      | Data & vector layer               | critical            |
| `l30` | 31–38      | AI framework & model layer        | critical            |
| `l40` | 41–48      | Workload execution                | critical            |
| `l50` | 51–58      | Billing & metering                | critical            |
| `l60` | 61–64      | Cloud infrastructure              | critical            |
| `l90` | 91–99      | Supply chain & production closure | critical            |

### 5.1 Layer Ordering Invariant

Gates in layer `lNN` MUST NOT depend on gates in layer `lMM` where `MM > NN`. The gate dependency graph across layers MUST be a directed acyclic graph (DAG).

### 5.2 Layer Completeness

Each layer MUST contain at least one gate. A layer with no active gates is considered incomplete and MUST be flagged by the catalog validator.

---

## 6. Gate Metadata Requirements

The `metadata` block of every gate MUST contain the following fields:

| Field                   | Type    | Requirement | Description                                                         |
| ----------------------- | ------- | ----------- | ------------------------------------------------------------------- |
| `id`                    | string  | MUST        | Unique gate identifier                                              |
| `version`               | string  | MUST        | Semantic version                                                    |
| `layer`                 | string  | MUST        | Layer code (`l00`–`l90`)                                            |
| `plane`                 | string  | MUST        | Always `ai-infra` for this module                                   |
| `blocking`              | boolean | MUST        | Whether gate halts pipeline on failure                              |
| `lifecycle`             | string  | MUST        | One of: `proposed`, `active`, `deprecated`, `archived`, `destroyed` |
| `criticality`           | string  | MUST        | One of: `critical`, `high`, `medium`, `low`                         |
| `owner`                 | string  | MUST        | Owner email or URN                                                  |
| `governanceCode`        | string  | MUST        | Governance code reference                                           |
| `createdAt`             | string  | MUST        | ISO 8601 UTC creation timestamp                                     |
| `tags`                  | array   | SHOULD      | Searchable tags                                                     |
| `sloTarget`             | integer | MUST        | Maximum evaluation time in seconds                                  |
| `evidenceRetentionDays` | integer | MUST        | Minimum evidence retention period                                   |

---

## 7. Gate Spec Requirements

The `spec` block of every gate MUST contain:

| Field              | Type   | Requirement | Description                              |
| ------------------ | ------ | ----------- | ---------------------------------------- |
| `description`      | string | MUST        | Human-readable gate description          |
| `validates`        | array  | MUST        | One or more validation dimensions        |
| `dependsOn`        | array  | MUST        | List of gate IDs this gate depends on    |
| `waiverPolicy`     | string | MUST        | Path to the applicable waiver policy     |
| `escalationPolicy` | string | MUST        | Path to the applicable escalation policy |

### 7.1 Validation Dimension Requirements

Each entry in `spec.validates` MUST contain:

- `dimension`: A unique string identifier for the validation dimension.
- `description`: A human-readable description of what is being validated.
- `checks`: An array of one or more check objects.

### 7.2 Check Object Requirements

Each check object MUST contain:

- `id`: A unique check identifier conforming to `^chk-[a-z0-9-]+$`.
- `description`: A human-readable description of the check.
- `rule`: A machine-parseable rule expression.
- `severity`: One of `critical`, `high`, `medium`, `low`.
- `evidenceRequired`: Boolean indicating whether a pass requires evidence.

---

## 8. Evidence Requirements

### 8.1 Evidence Record Structure

Every gate evaluation MUST produce an evidence record containing:

```yaml
gateId: gate-NN-name
gateVersion: 1.0.0
evaluatedAt: '2026-01-01T00:00:00Z'
result: PASS | FAIL | WARN | SKIP
artifactRef: <artifact URN or path>
hashes:
  sha256: <hex>
  sha3_512: <hex>
  blake3: <hex>
evaluatorUrn: <CI runner URN or human URN>
waiverRef: <waiver ID or null>
previousRecordHash: <sha256 of previous evidence record or null>
```

### 8.2 Evidence Chain Integrity

Evidence records MUST be linked via `previousRecordHash` to form an unbroken chain. Any gap in the chain MUST be treated as a `FAIL` condition by the audit evidence chain validator (gate-95).

### 8.3 Evidence Retention

| Criticality | Minimum Retention   |
| ----------- | ------------------- |
| `critical`  | 2555 days (7 years) |
| `high`      | 1095 days (3 years) |
| `medium`    | 365 days (1 year)   |
| `low`       | 180 days (6 months) |

---

## 9. Lifecycle Requirements

### 9.1 Allowed States

A gate MUST be in one of the following lifecycle states:

- `proposed` — Gate is under review and MUST NOT be enforced in production CI.
- `active` — Gate is fully enforced. This is the normative operational state.
- `deprecated` — Gate is scheduled for removal. CI MUST emit a warning but MUST NOT fail.
- `archived` — Gate is no longer evaluated. CI MUST skip and record a `SKIP` evidence record.
- `destroyed` — Gate ID is permanently retired. MUST NOT be reused.

### 9.2 Allowed Transitions

| From         | To           | Requirement                      |
| ------------ | ------------ | -------------------------------- |
| `proposed`   | `active`     | Governance council approval      |
| `active`     | `deprecated` | Owner request + council review   |
| `deprecated` | `archived`   | 30-day deprecation notice period |
| `archived`   | `destroyed`  | Permanent retirement decision    |
| Any          | `destroyed`  | MUST NOT transition back         |

---

## 10. Waiver Requirements

### 10.1 Waiver Eligibility

A waiver MAY be granted only for gates with criticality `high`, `medium`, or `low`. Gates with criticality `critical` MUST require governance council approval for any waiver.

### 10.2 Waiver Duration

Waivers MUST NOT exceed 30 calendar days. Waivers MAY be renewed up to 2 times with renewed justification. A third renewal MUST require a gate redesign review.

### 10.3 Waiver Record Requirements

A valid waiver record MUST contain:

- `id`: Unique waiver identifier
- `gateId`: The gate being waived
- `artifactRef`: The specific artifact receiving the waiver
- `justification`: Minimum 50-character justification text
- `remediationPlan`: Concrete remediation steps
- `approvedBy`: Approver URN
- `expiresAt`: ISO 8601 UTC expiry timestamp
- `riskAcknowledged`: Boolean

---

## 11. CI/CD Integration Requirements

### 11.1 Gate Evaluation Order

CI pipelines MUST evaluate gates in ascending layer order: `l00` → `l10` → `l20` → `l30` → `l40` → `l50` → `l60` → `l90`.

### 11.2 Failure Propagation

A `FAIL` result on any `blocking: true` gate MUST halt the pipeline immediately. No gates in subsequent layers MAY be evaluated.

### 11.3 Report Generation

Every CI pipeline run MUST produce:

- `outputs/gate-validation-report.json` — Full validation results
- `outputs/gate-audit-report.json` — Evidence chain records
- `outputs/gate-coverage-report.json` — Coverage taxonomy results
- `outputs/gate-waiver-report.json` — Active waivers summary

### 11.4 Production Closure

Promotion to production MUST require a passing `gate-99-production-closure-validation` result with a valid `outputs/production-closure-report.json`.

---

## 12. Schema Conformance

All gate YAML files MUST conform to `schemas/gate.schema.json`. All contract YAML files MUST conform to their respective schemas in `schemas/`. Schema validation MUST be performed by `scripts/validate-gate-schema.py` as part of every CI run.

---

## 13. Namespace Compliance

All gate IDs, owner references, artifact paths, and governance codes MUST comply with the Namespace Governance Closure Specification (`mycodexvantaos-00000`). Specifically:

- Gate IDs MUST use kebab-case with no uppercase, underscores, or version suffixes.
- Governance codes MUST match `^mycodexvantaos-[0-9]{5}$`.
- File path headers MUST declare the canonical path using the format `# path: unified-gates/...`.

---

## 14. Conformance Levels

A gate implementation is considered **fully conformant** with this specification when:

1. All `MUST` requirements in Sections 4–13 are satisfied.
2. The gate passes `scripts/validate-gate-schema.py`.
3. The gate passes `scripts/validate-ai-infra-gates.py`.
4. The gate produces a valid evidence record on evaluation.
5. The gate is registered in `ai-infra-gate-catalog.yaml` and `gate-catalog.yaml`.

A gate implementation is considered **partially conformant** when all `MUST` requirements are satisfied but one or more `SHOULD` requirements are not.

---

## Appendix A: Gate File Path Convention

All gate YAML files MUST be located at:

```
unified-gates/ai-infra-gates/{layer}/gate-{NN}-{name}.yaml
```

Where `{NN}` is the two-digit gate number and `{name}` is the kebab-case gate name.

## Appendix B: Governance Code Era Mapping

| Era Range     | Domain                            |
| ------------- | --------------------------------- |
| `00000–09999` | Platform governance & namespace   |
| `10000–19999` | AI compute infrastructure         |
| `20000–29999` | Data & vector layer               |
| `30000–39999` | AI framework & model layer        |
| `40000–49999` | Dataset & contract governance     |
| `50000–59999` | Billing, metering & compliance    |
| `60000–69999` | Cloud infrastructure              |
| `90000–99999` | Supply chain & production closure |
