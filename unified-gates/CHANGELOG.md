<!--
  path: unified-gates/CHANGELOG.md
  governanceCode: mycodexvantaos-00000
  version: 1.0.0
-->

# Changelog — unified-gates

All notable changes to the Unified Gate System are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-01-01

### Added

**Core Gate System**

- Established `unified-gates/` as the single source of truth for the MyCodexVantaOS gate system.
- Defined eight gate layers (`l00`–`l90`) covering the full AI engineering lifecycle.
- Authored 44 executable gate definitions across all layers in `ai-infra-gates/`.
- Published `SPEC.md` as the normative v1.0.0 specification for the Unified Gate System.
- Published `unified-gate-index.yaml` as the authoritative gate plane index.

**Gate Documentation (`gate/`)**

- Section 1 (Core): `gate-overview.rst`, `gate-mapping.rst`, `gate-policies.rst`, `gate-validation.rst`
- Section 2 (Lifecycle): `gate-lifecycle.rst`, `gate-metadata.rst`, `gate-states.rst`
- Section 3 (Technical): `gate-catalog.rst`, `gate-composition.rst`, `gate-configuration.rst`, `gate-dependencies.rst`, `gate-framework.rst`, `gate-sdk.rst`, `gate-spec.rst`, `gate-templates.rst`
- Section 4 (Execution): `gate-alerting.rst`, `gate-audit.rst`, `gate-execution.rst`, `gate-metrics.rst`, `gate-monitoring.rst`, `gate-pipeline.rst`, `gate-reporting.rst`
- Section 5 (Governance): `gate-compliance.rst`, `gate-cost.rst`, `gate-escalation.rst`, `gate-governance.rst`, `gate-rbac.rst`, `gate-risk.rst`, `gate-slo.rst`, `gate-waiver.rst`
- Section 6 (Domain AI): `gate-billing-accuracy.rst`, `gate-data-quality.rst`, `gate-inference-latency.rst`, `gate-model-quality.rst`, `gate-model-safety.rst`, `gate-multi-tenant-isolation.rst`, `gate-training-stability.rst`, `gate-vector-index-quality.rst`
- Section 7 (Evolution): `gate-evolution.rst`, `gate-experiments.rst`, `gate-feedback.rst`, `gate-roadmap.rst`
- Section 8 (Coverage): 44 RST files covering 11 coverage sub-dimensions

**AI Infrastructure Gates (`ai-infra-gates/`)**

- `l00`: Gates 01–08 (meta-governance, namespace, lifecycle, evidence)
- `l10`: Gates 11–18 (AI compute, GPU, cluster, distributed training)
- `l20`: Gates 21–28 (dataset, lineage, license, PII, vector DB)
- `l30`: Gates 31–38 (AI framework, model contract, training pipeline, inference)
- `l40`: Gates 41–48 (workload contract, inference/training tasks, RAG, agent)
- `l50`: Gates 51–58 (usage metering, cost attribution, billing, invoice)
- `l60`: Gates 61–64 (cloud infra, Kubernetes, GitOps, managed services)
- `l90`: Gates 91–99 (SBOM, provenance, signatures, compliance, production closure)

**Contracts (`contracts/`)**

- `gate-contract.yaml` — Gate definition contract schema
- `gate-evidence.yaml` — Evidence record contract
- `gate-result.yaml` — Gate evaluation result contract
- `gate-waiver.yaml` — Waiver record contract
- `dataset-contract.yaml` — Dataset governance contract
- `model-contract.yaml` — Model lifecycle contract
- `ai-workload-contract.yaml` — AI workload execution contract
- `inference-result-contract.yaml` — Inference result contract
- `usage-event-contract.yaml` — Usage metering event contract
- `billing-event-contract.yaml` — Billing event contract
- `vector-index-contract.yaml` — Vector index contract

**Schemas (`schemas/`)**

- `gate.schema.json` — Gate definition JSON Schema
- `gate-catalog.schema.json` — Gate catalog JSON Schema
- `gate-result.schema.json` — Gate result JSON Schema
- `gate-waiver.schema.json` — Waiver record JSON Schema
- `gate-policy.schema.json` — Policy document JSON Schema
- `gate-pipeline.schema.json` — Pipeline configuration JSON Schema
- `ai-infra-gate.schema.json` — AI infrastructure gate JSON Schema
- `dataset-contract.schema.json` — Dataset contract JSON Schema
- `model-contract.schema.json` — Model contract JSON Schema
- `ai-workload-contract.schema.json` — AI workload contract JSON Schema
- `usage-event.schema.json` — Usage event JSON Schema
- `vector-index.schema.json` — Vector index JSON Schema

**Policies (`policies/`)**

- `gate-waiver-policy.yaml` — Waiver duration, renewal, and approval rules
- `gate-risk-policy.yaml` — Risk escalation and mitigation policy
- `gate-rbac-policy.yaml` — Role-based access control for gate operations
- `gate-governance-policy.yaml` — Overall governance rules and council authority
- `gate-cost-policy.yaml` — Cost attribution and budget enforcement
- `production-closure-policy.yaml` — Production promotion requirements
- `ai-safety-policy.yaml` — AI model safety and alignment policy
- `ai-billing-policy.yaml` — AI usage billing and metering policy
- `ai-workload-policy.yaml` — AI workload scheduling and resource policy

**Workflows (`workflows/`)**

- `gate-evaluation-workflow.yaml` — Standard gate evaluation pipeline
- `gate-waiver-workflow.yaml` — Waiver request and approval workflow
- `gate-escalation-workflow.yaml` — Failure escalation workflow
- `gate-release-workflow.yaml` — Release gate sequence workflow
- `ai-workload-production-readiness-workflow.yaml` — AI workload production readiness

**Scripts (`scripts/`)**

- `evaluate-gate.py` — Single gate evaluation with evidence production
- `validate-gate-schema.py` — JSON Schema validation for all gate files
- `validate-gate-catalog.py` — Gate catalog completeness and consistency validation
- `validate-ai-infra-gates.py` — AI infrastructure gate layer validation
- `validate-gate-composition.py` — Gate dependency and composition validation
- `generate-gate-catalog.py` — Automated gate catalog generation
- `generate-gate-report.py` — Full gate validation report generation
- `generate-production-closure-report.py` — Production closure report generation

**CI Integration**

- `ci/namespace_check.py` — Namespace governance CI validator (28 rules, R/G/F/NR/LC/DP series)
- `.github/workflows/unified-gates-ci.yml` — GitHub Actions CI workflow
- `.github/workflows/namespace-governance.yml` — Namespace governance CI workflow

**Navigation**

- `navigation/bindings/` — Binding mediator artifacts for bidirectional service relations
- `navigation/dependency-policy.yaml` — Service dependency graph policy
- `navigation/owner-registry.yaml` — Gate and namespace owner registry

**Module Manifest**

- `mycodexvantaos-module.yaml` — Module manifest for the unified-gates module

---

## [0.9.0-rc1] — 2025-12-01

### Added

- Initial draft of gate layer model (`l00`–`l90`).
- Prototype gate definitions for `l00` (meta-governance) and `l90` (production closure).
- Draft SPEC.md for review by governance council.

### Changed

- Renamed `gate-framework/` to `gate/` for clarity.
- Consolidated catalog files into `gate-catalog.yaml` and `ai-infra-gate-catalog.yaml`.

### Removed

- Removed placeholder gate definitions that lacked concrete check specifications.

---

## [0.1.0] — 2025-10-01

### Added

- Initial repository structure proposal.
- Proof-of-concept gate definitions for namespace governance validation.
- Draft namespace governance closure specification (`mycodexvantaos-00000`).
