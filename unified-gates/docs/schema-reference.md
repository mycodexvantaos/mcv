<!--
  path: unified-gates/docs/schema-reference.md
  governanceCode: mycodexvantaos-00000
  version: 1.0.0
  status: normative
-->

# Unified Gates — Schema Reference v1.0.0

> **Version:** 1.0.0  
> **Governance Code:** `mycodexvantaos-00000`  
> **Status:** normative

---

## Overview

This document provides a reference for all JSON Schema definitions in `unified-gates/schemas/`. All gate artifacts MUST conform to their respective schemas. Schema validation is performed by `scripts/validate-gate-schema.py`.

---

## Schema Index

| Schema File                        | `$id`                    | Validates                           |
| ---------------------------------- | ------------------------ | ----------------------------------- |
| `gate.schema.json`                 | `…/gate`                 | Gate YAML definition files          |
| `ai-infra-gate.schema.json`        | `…/ai-infra-gate`        | AI infrastructure gate definitions  |
| `gate-catalog.schema.json`         | `…/gate-catalog`         | Gate catalog YAML files             |
| `gate-result.schema.json`          | `…/gate-result`          | Gate evaluation result records      |
| `gate-waiver.schema.json`          | `…/gate-waiver`          | Waiver request and approval records |
| `gate-policy.schema.json`          | `…/gate-policy`          | Policy YAML documents               |
| `gate-pipeline.schema.json`        | `…/gate-pipeline`        | Pipeline configuration YAML         |
| `dataset-contract.schema.json`     | `…/dataset-contract`     | Dataset governance contracts        |
| `model-contract.schema.json`       | `…/model-contract`       | Model lifecycle contracts           |
| `ai-workload-contract.schema.json` | `…/ai-workload-contract` | AI workload execution contracts     |
| `usage-event.schema.json`          | `…/usage-event`          | Usage metering event records        |
| `vector-index.schema.json`         | `…/vector-index`         | Vector index contracts              |

---

## gate.schema.json — Key Fields

| Field Path                | Type                                    | Required | Description            |
| ------------------------- | --------------------------------------- | -------- | ---------------------- |
| `apiVersion`              | string (const: `mycodexvantaos.io/v1`)  | MUST     | API version            |
| `kind`                    | string (const: `AIInfraGate`)           | MUST     | Resource kind          |
| `metadata.id`             | string (`^gate-[0-9]{2}-[a-z0-9-]+$`)   | MUST     | Unique gate ID         |
| `metadata.version`        | string (semver)                         | MUST     | Gate version           |
| `metadata.layer`          | enum (`l00`–`l90`)                      | MUST     | Gate layer             |
| `metadata.blocking`       | boolean                                 | MUST     | Pipeline blocking flag |
| `metadata.lifecycle`      | enum (lifecycle states)                 | MUST     | Lifecycle state        |
| `metadata.criticality`    | enum (`critical`/`high`/`medium`/`low`) | MUST     | Criticality level      |
| `metadata.owner`          | string                                  | MUST     | Owner email or URN     |
| `metadata.governanceCode` | string (`^mycodexvantaos-[0-9]{5}$`)    | MUST     | Governance code        |
| `spec.description`        | string                                  | MUST     | Gate description       |
| `spec.validates`          | array                                   | MUST     | Validation dimensions  |
| `spec.dependsOn`          | array                                   | MUST     | Gate dependencies      |
| `spec.waiverPolicy`       | string                                  | MUST     | Waiver policy path     |
| `spec.escalationPolicy`   | string                                  | MUST     | Escalation policy path |

---

## gate-result.schema.json — Key Fields

| Field Path           | Type                               | Required | Description                   |
| -------------------- | ---------------------------------- | -------- | ----------------------------- |
| `recordId`           | string (UUID)                      | MUST     | Unique evidence record ID     |
| `gateId`             | string                             | MUST     | Gate that was evaluated       |
| `gateVersion`        | string                             | MUST     | Gate version                  |
| `pipelineRunId`      | string                             | MUST     | CI pipeline run ID            |
| `artifactRef`        | string                             | MUST     | Evaluated artifact reference  |
| `evaluatedAt`        | string (ISO 8601)                  | MUST     | Evaluation timestamp          |
| `result`             | enum (`PASS`/`FAIL`/`WARN`/`SKIP`) | MUST     | Evaluation result             |
| `evidence.sha256`    | string                             | MUST     | SHA-256 hash                  |
| `evidence.sha3_512`  | string                             | MUST     | SHA3-512 hash                 |
| `evidence.blake3`    | string                             | MUST     | BLAKE3 hash                   |
| `previousRecordHash` | string or null                     | MUST     | Previous evidence record hash |

---

## gate-waiver.schema.json — Key Fields

| Field Path              | Type                  | Required | Description               |
| ----------------------- | --------------------- | -------- | ------------------------- |
| `metadata.id`           | string                | MUST     | Unique waiver ID          |
| `metadata.gateId`       | string                | MUST     | Gate being waived         |
| `metadata.artifactRef`  | string                | MUST     | Artifact receiving waiver |
| `metadata.approvedBy`   | string                | MUST     | Approver URN              |
| `metadata.expiresAt`    | string (ISO 8601)     | MUST     | Waiver expiry timestamp   |
| `spec.justification`    | string (min 50 chars) | MUST     | Waiver justification      |
| `spec.remediationPlan`  | string                | MUST     | Remediation steps         |
| `spec.riskAcknowledged` | boolean               | MUST     | Risk acknowledgement      |
