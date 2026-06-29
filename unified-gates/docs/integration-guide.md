<!--
  path: unified-gates/docs/integration-guide.md
  governanceCode: mycodexvantaos-00000
  version: 1.0.0
  status: normative
-->

# Unified Gates — Integration Guide v1.0.0

> **Version:** 1.0.0  
> **Governance Code:** `mycodexvantaos-00000`  
> **Status:** normative

---

## 1. Overview

This guide explains how to integrate the Unified Gate System (UGS) into a repository's CI/CD pipeline. Integration requires three components: the namespace governance validator (`ci/namespace_check.py`), the gate evaluation scripts (`unified-gates/scripts/`), and the GitHub Actions workflows (`.github/workflows/`).

---

## 2. Prerequisites

Before integrating the gate system, ensure the following conditions are met:

- Python 3.12 or higher is available in the CI environment.
- The `pyyaml` and `jsonschema` packages are installable via `pip`.
- The repository name follows the canonical pattern: `^(?:mycodexvantaos|softwareos)-[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]+(?:-[a-z0-9]+)*$`.
- The `unified-gates/` directory is present at the repository root.
- The `ci/namespace_check.py` script is present at `ci/namespace_check.py`.

---

## 3. Quick Start

```bash
# 1. Install dependencies
pip install pyyaml jsonschema

# 2. Validate namespace governance
python ci/namespace_check.py \
  --repo-name "mycodexvantaos-governance-gates" \
  --report-dir outputs/ \
  --verbose

# 3. Validate gate schemas
python unified-gates/scripts/validate-gate-schema.py \
  --root unified-gates/ \
  --output unified-gates/outputs/gate-validation-report.json

# 4. Validate gate catalog
python unified-gates/scripts/validate-gate-catalog.py \
  --root unified-gates/ \
  --output unified-gates/outputs/gate-catalog-validation.json

# 5. Validate AI infrastructure gates
python unified-gates/scripts/validate-ai-infra-gates.py \
  --root unified-gates/ \
  --layer all \
  --output unified-gates/outputs/ai-infra-gate-validation.json

# 6. Generate full gate report
python unified-gates/scripts/generate-gate-report.py \
  --root unified-gates/ \
  --output unified-gates/outputs/gate-validation-report.json
```

---

## 4. GitHub Actions Integration

Copy the workflow files to your repository:

```bash
cp unified-gates/.github/workflows/unified-gates-ci.yml .github/workflows/
cp unified-gates/.github/workflows/namespace-governance.yml .github/workflows/
```

The `unified-gates-ci.yml` workflow runs five sequential jobs:

| Job                           | Depends On                    | Description                                     |
| ----------------------------- | ----------------------------- | ----------------------------------------------- |
| `namespace-governance`        | —                             | Validates namespace, registry, and file headers |
| `schema-validation`           | `namespace-governance`        | Validates gate YAML against JSON schemas        |
| `gate-catalog-validation`     | `schema-validation`           | Validates catalog completeness                  |
| `ai-infra-gates-validation`   | `gate-catalog-validation`     | Validates all gate definitions                  |
| `gate-composition-validation` | `ai-infra-gates-validation`   | Validates gate dependencies                     |
| `generate-reports`            | `gate-composition-validation` | Generates all output reports                    |

---

## 5. Input File Formats

### 5.1 Namespace Registry

The namespace registry is located at `unified-gates/navigation/owner-registry.yaml`. It follows the `OwnerRegistry` schema and lists all registered gate owners.

### 5.2 Dependency Graph

The dependency graph is located at `unified-gates/navigation/dependency-policy.yaml`. It follows the `DependencyPolicy` schema and defines all service dependencies and cross-plane policies.

### 5.3 Gate YAML Files

Gate YAML files are located at `unified-gates/ai-infra-gates/{layer}/gate-{NN}-{name}.yaml`. They MUST conform to `unified-gates/schemas/gate.schema.json`.

---

## 6. Output Reports

All reports are written to `unified-gates/outputs/`:

| Report File                      | Description                          |
| -------------------------------- | ------------------------------------ |
| `gate-validation-report.json`    | Full gate validation results         |
| `gate-audit-report.json`         | Evidence chain records               |
| `gate-coverage-report.json`      | Coverage taxonomy results            |
| `gate-waiver-report.json`        | Active waivers summary               |
| `production-closure-report.json` | Production closure gate results      |
| `unified-gate-summary.json`      | High-level summary across all planes |

---

## 7. Strict Mode

Enable strict mode to treat `SHOULD` violations as failures:

```bash
python ci/namespace_check.py \
  --scan-dir unified-gates/ \
  --strict \
  --report-dir outputs/ \
  --verbose
```

Strict mode is recommended for production branches (`main`) and MUST be enabled for production closure validation.

---

## 8. Waiver Management

To create a waiver for a blocking gate failure:

1. Author a waiver record conforming to `schemas/gate-waiver.schema.json`.
2. Submit the waiver for approval via the waiver workflow: `workflows/gate-waiver-workflow.yaml`.
3. Obtain approval from the gate owner (P3/P4 gates) or governance council (P1/P2 gates).
4. Place the approved waiver record in `outputs/gate-waiver-report.json`.
5. Re-run the gate evaluation. The gate will produce a `SKIP` result with the waiver reference.

---

## 9. Troubleshooting

| Error                                                    | Cause                                                      | Resolution                                         |
| -------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| `R-01: Repository name does not match canonical pattern` | Repository name violates naming rules                      | Rename repository per `mycodexvantaos-00100`       |
| `G-01: Governance code format invalid`                   | Governance code does not match `^mycodexvantaos-[0-9]{5}$` | Correct the governance code                        |
| `DP-03: Cycle detected in hard dependency graph`         | Circular dependency in service graph                       | Remove the cycle or introduce a mediator           |
| `Schema validation failed`                               | Gate YAML does not conform to schema                       | Fix the YAML fields per `schemas/gate.schema.json` |
| `Gate catalog incomplete`                                | A gate is defined but not registered in the catalog        | Add the gate to `ai-infra-gate-catalog.yaml`       |
