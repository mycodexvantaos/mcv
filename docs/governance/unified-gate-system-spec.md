# MyCodexVantaOS — Unified Gate System Specification

> 文件定位：`docs/governance/unified-gate-system-spec.md`  
> 建議母規格章節：`Appendix K — Unified Gate System Specification`  
> 規格等級：平台母規格 / AI-native Gate 體系 / 全生命週期品質閘門 / 算力-數據-算法-任務-計費-合規治理  
> 適用範圍：`unified-gates/`、`gate/`、`ai-infra-gates/`、`contracts/`、`schemas/`、`workflows/`、`pipelines/`、`governance/`、`compliance/`、`risk/`、`slo/`、`billing-model/`、`observability/`  
> 機器識別：`mycodexvantaos`  
> 品牌識別：`MyCodexVantaOS`  
> 狀態：normative  
> 命名規則：lowercase / kebab-case / no version in name / no environment marker  
> 執行語義：MUST / MUST NOT / SHOULD / MAY

---

## K.0 Purpose

This specification merges two gate systems into one unified architecture:

```text
1. full lifecycle quality gate documentation system
2. ai-native infrastructure gate system
```

The unified target is:

```text
mycodexvantaos unified gate system
```

It governs:

```text
design
development
testing
coverage
deployment
operation
ai compute foundation
ai data foundation
ai algorithm foundation
ai workload execution
ai task billing
cloud managed infrastructure
compliance
attestation
audit evidence
```

Core rule:

```text
traditional gates validate whether code can be released.
mycodexvantaos unified gates validate whether compute, data, algorithm,
workload, billing, infrastructure, compliance, and evidence can be formally delivered.
```

---

## K.1 Unified Gate Architecture

### K.1.1 Architecture Model

The unified gate system is divided into two complementary planes.

| Plane                 | Path                            | Responsibility                                                                |
| --------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| `quality-gate-plane`  | `unified-gates/gate/`           | lifecycle, governance, execution, monitoring, coverage, documentation         |
| `ai-infra-gate-plane` | `unified-gates/ai-infra-gates/` | compute, data, algorithm, workload, billing, cloud infra, attestation closure |

Relationship:

```text
gate/ defines how gates are governed.
ai-infra-gates/ defines what AI-native infrastructure gates must validate.
```

### K.1.2 Unified Gate Flow

```text
gate framework
  ↓
gate specification
  ↓
gate catalog
  ↓
gate composition
  ↓
ai-infra gate execution
  ↓
coverage validation
  ↓
compliance and attestation
  ↓
audit evidence
  ↓
release or block
```

---

## K.2 Canonical Directory Tree

```text
unified-gates/
├── readme.md
├── gate-catalog.yaml
├── ai-infra-gate-catalog.yaml
├── unified-gate-index.yaml
│
├── gate/
│   ├── readme.md
│   ├── gate-catalog.yaml
│   │
│   ├── 1-core/
│   │   ├── gate-overview.rst
│   │   ├── gate-policies.rst
│   │   ├── gate-validation.rst
│   │   └── gate-mapping.rst
│   │
│   ├── 2-lifecycle/
│   │   ├── gate-lifecycle.rst
│   │   ├── gate-states.rst
│   │   └── gate-metadata.rst
│   │
│   ├── 3-technical/
│   │   ├── gate-framework.rst
│   │   ├── gate-spec.rst
│   │   ├── gate-catalog.rst
│   │   ├── gate-composition.rst
│   │   ├── gate-dependencies.rst
│   │   ├── gate-configuration.rst
│   │   ├── gate-templates.rst
│   │   └── gate-sdk.rst
│   │
│   ├── 4-execution/
│   │   ├── gate-execution.rst
│   │   ├── gate-pipeline.rst
│   │   ├── gate-metrics.rst
│   │   ├── gate-monitoring.rst
│   │   ├── gate-alerting.rst
│   │   ├── gate-audit.rst
│   │   └── gate-reporting.rst
│   │
│   ├── 5-governance/
│   │   ├── gate-governance.rst
│   │   ├── gate-rbac.rst
│   │   ├── gate-compliance.rst
│   │   ├── gate-risk.rst
│   │   ├── gate-waiver.rst
│   │   ├── gate-escalation.rst
│   │   ├── gate-slo.rst
│   │   └── gate-cost.rst
│   │
│   ├── 6-domain-ai/
│   │   ├── gate-model-quality.rst
│   │   ├── gate-model-safety.rst
│   │   ├── gate-data-quality.rst
│   │   ├── gate-inference-latency.rst
│   │   ├── gate-training-stability.rst
│   │   ├── gate-vector-index-quality.rst
│   │   ├── gate-billing-accuracy.rst
│   │   └── gate-multi-tenant-isolation.rst
│   │
│   ├── 7-evolution/
│   │   ├── gate-experiments.rst
│   │   ├── gate-evolution.rst
│   │   ├── gate-roadmap.rst
│   │   └── gate-feedback.rst
│   │
│   └── 8-coverage/
│       ├── 8-1-code/
│       │   ├── gate-line.rst
│       │   ├── gate-branch.rst
│       │   ├── gate-condition.rst
│       │   ├── gate-decision.rst
│       │   ├── gate-mcdc.rst
│       │   └── gate-path.rst
│       │
│       ├── 8-2-structure/
│       │   ├── gate-function.rst
│       │   ├── gate-method.rst
│       │   ├── gate-class.rst
│       │   └── gate-module.rst
│       │
│       ├── 8-3-requirements/
│       │   ├── gate-requirement.rst
│       │   ├── gate-userstory.rst
│       │   ├── gate-acceptance.rst
│       │   ├── gate-ac-registry.rst
│       │   ├── gate-testcase.rst
│       │   ├── gate-testdata.rst
│       │   └── gate-traceability.rst
│       │
│       ├── 8-4-workflow/
│       │   ├── gate-step.rst
│       │   ├── gate-workflow-path.rst
│       │   ├── gate-trigger.rst
│       │   └── gate-environment.rst
│       │
│       ├── 8-5-artifacts/
│       │   ├── gate-artifact.rst
│       │   ├── gate-toolchain.rst
│       │   ├── gate-rule.rst
│       │   ├── gate-check.rst
│       │   └── gate-scenario.rst
│       │
│       ├── 8-6-resilience/
│       │   ├── gate-error.rst
│       │   ├── gate-rollback.rst
│       │   └── gate-retry.rst
│       │
│       ├── 8-7-observability/
│       │   ├── gate-metrics-coverage.rst
│       │   ├── gate-logging-coverage.rst
│       │   ├── gate-trace-coverage.rst
│       │   ├── gate-alert-coverage.rst
│       │   └── gate-dashboard-coverage.rst
│       │
│       ├── 8-8-security-supplychain/
│       │   ├── gate-policy-coverage.rst
│       │   ├── gate-scan-coverage.rst
│       │   ├── gate-sbom-coverage.rst
│       │   ├── gate-signing-coverage.rst
│       │   └── gate-privesc-coverage.rst
│       │
│       ├── 8-9-api-contract/
│       │   ├── gate-endpoint-coverage.rst
│       │   ├── gate-contract-coverage.rst
│       │   └── gate-compatibility-coverage.rst
│       │
│       ├── 8-10-change/
│       │   ├── gate-changetype-coverage.rst
│       │   ├── gate-version-coverage.rst
│       │   └── gate-regression-coverage.rst
│       │
│       └── 8-11-state-data/
│           ├── gate-state-coverage.rst
│           ├── gate-transition-coverage.rst
│           └── gate-partition-coverage.rst
│
├── ai-infra-gates/
│   ├── readme.md
│   ├── ai-infra-gates.yaml
│   ├── ai-infra-gates-01-99-spec.md
│   ├── ai-infra-gates-catalog.yaml
│   │
│   ├── l00/
│   │   ├── gate-01-namespace-governance-validation.yaml
│   │   ├── gate-02-repository-naming-validation.yaml
│   │   ├── gate-03-governance-code-validation.yaml
│   │   ├── gate-04-directory-binding-mediator-validation.yaml
│   │   ├── gate-05-dependency-graph-acyclic-validation.yaml
│   │   ├── gate-06-lifecycle-state-validation.yaml
│   │   ├── gate-07-owner-registry-validation.yaml
│   │   └── gate-08-audit-evidence-validation.yaml
│   │
│   ├── l10/
│   │   ├── gate-11-ai-chip-capability-validation.yaml
│   │   ├── gate-12-gpu-driver-validation.yaml
│   │   ├── gate-13-accelerator-topology-validation.yaml
│   │   ├── gate-14-smart-server-baseline-validation.yaml
│   │   ├── gate-15-ai-compute-cluster-readiness.yaml
│   │   ├── gate-16-distributed-training-runtime-validation.yaml
│   │   ├── gate-17-resource-quota-and-scheduler-validation.yaml
│   │   └── gate-18-compute-cost-metering-validation.yaml
│   │
│   ├── l20/
│   │   ├── gate-21-dataset-contract-validation.yaml
│   │   ├── gate-22-dataset-lineage-validation.yaml
│   │   ├── gate-23-dataset-license-validation.yaml
│   │   ├── gate-24-pii-and-sensitive-data-scan.yaml
│   │   ├── gate-25-vector-database-schema-validation.yaml
│   │   ├── gate-26-embedding-dimension-validation.yaml
│   │   ├── gate-27-data-quality-threshold-validation.yaml
│   │   └── gate-28-data-access-policy-validation.yaml
│   │
│   ├── l30/
│   │   ├── gate-31-ai-framework-compatibility-validation.yaml
│   │   ├── gate-32-model-contract-validation.yaml
│   │   ├── gate-33-training-pipeline-validation.yaml
│   │   ├── gate-34-inference-runtime-validation.yaml
│   │   ├── gate-35-ai-agent-framework-validation.yaml
│   │   ├── gate-36-tool-calling-contract-validation.yaml
│   │   ├── gate-37-model-registry-validation.yaml
│   │   └── gate-38-algorithm-safety-policy-validation.yaml
│   │
│   ├── l40/
│   │   ├── gate-41-ai-workload-contract-validation.yaml
│   │   ├── gate-42-inference-task-validation.yaml
│   │   ├── gate-43-training-task-validation.yaml
│   │   ├── gate-44-rag-pipeline-validation.yaml
│   │   ├── gate-45-agent-task-policy-validation.yaml
│   │   ├── gate-46-workload-resource-estimation.yaml
│   │   ├── gate-47-workload-slo-validation.yaml
│   │   └── gate-48-workload-runtime-sandbox-validation.yaml
│   │
│   ├── l50/
│   │   ├── gate-51-usage-event-contract-validation.yaml
│   │   ├── gate-52-inference-metering-validation.yaml
│   │   ├── gate-53-training-metering-validation.yaml
│   │   ├── gate-54-embedding-metering-validation.yaml
│   │   ├── gate-55-agent-run-metering-validation.yaml
│   │   ├── gate-56-cost-attribution-validation.yaml
│   │   ├── gate-57-billing-policy-validation.yaml
│   │   └── gate-58-invoice-evidence-validation.yaml
│   │
│   ├── l60/
│   │   ├── gate-61-cloud-infra-readiness-validation.yaml
│   │   ├── gate-62-kubernetes-baseline-validation.yaml
│   │   ├── gate-63-gitops-sync-validation.yaml
│   │   └── gate-64-managed-service-sla-validation.yaml
│   │
│   └── l90/
│       ├── gate-91-sbom-generation-validation.yaml
│       ├── gate-92-provenance-validation.yaml
│       ├── gate-93-signature-validation.yaml
│       ├── gate-94-policy-attestation-validation.yaml
│       ├── gate-95-audit-evidence-chain-validation.yaml
│       ├── gate-96-release-readiness-validation.yaml
│       ├── gate-97-rollback-readiness-validation.yaml
│       ├── gate-98-compliance-report-validation.yaml
│       └── gate-99-production-closure-validation.yaml
│
├── contracts/
│   ├── gate-contract.yaml
│   ├── gate-result.yaml
│   ├── gate-waiver.yaml
│   ├── gate-evidence.yaml
│   ├── ai-workload-contract.yaml
│   ├── usage-event-contract.yaml
│   ├── billing-event-contract.yaml
│   ├── model-contract.yaml
│   ├── dataset-contract.yaml
│   ├── vector-index-contract.yaml
│   └── inference-result-contract.yaml
│
├── schemas/
│   ├── gate.schema.json
│   ├── gate-catalog.schema.json
│   ├── gate-result.schema.json
│   ├── gate-waiver.schema.json
│   ├── gate-policy.schema.json
│   ├── gate-pipeline.schema.json
│   ├── ai-infra-gate.schema.json
│   ├── ai-workload-contract.schema.json
│   ├── usage-event.schema.json
│   ├── model-contract.schema.json
│   ├── dataset-contract.schema.json
│   └── vector-index.schema.json
│
├── workflows/
│   ├── gate-evaluation-workflow.yaml
│   ├── gate-waiver-workflow.yaml
│   ├── gate-escalation-workflow.yaml
│   ├── gate-release-workflow.yaml
│   └── ai-workload-production-readiness-workflow.yaml
│
├── policies/
│   ├── gate-governance-policy.yaml
│   ├── gate-rbac-policy.yaml
│   ├── gate-waiver-policy.yaml
│   ├── gate-risk-policy.yaml
│   ├── gate-cost-policy.yaml
│   ├── ai-workload-policy.yaml
│   ├── ai-safety-policy.yaml
│   ├── ai-billing-policy.yaml
│   └── production-closure-policy.yaml
│
├── scripts/
│   ├── validate-gate-catalog.py
│   ├── validate-gate-schema.py
│   ├── validate-gate-composition.py
│   ├── validate-ai-infra-gates.py
│   ├── evaluate-gate.py
│   ├── generate-gate-report.py
│   ├── generate-gate-catalog.py
│   └── generate-production-closure-report.py
│
└── outputs/
    ├── gate-validation-report.json
    ├── gate-coverage-report.json
    ├── ai-infra-gate-report.json
    ├── gate-waiver-report.json
    ├── gate-audit-report.json
    ├── production-closure-report.json
    └── unified-gate-summary.json
```

---

## K.3 Unified Gate Category System

### K.3.1 Quality Gate Documentation Layers

| Layer          | Directory           | Count | Purpose                                                                            |
| -------------- | ------------------- | ----: | ---------------------------------------------------------------------------------- |
| `1-core`       | `gate/1-core`       |     4 | overview, policy, validation, mapping                                              |
| `2-lifecycle`  | `gate/2-lifecycle`  |     3 | lifecycle, states, metadata                                                        |
| `3-technical`  | `gate/3-technical`  |     8 | framework, spec, catalog, composition, dependencies, configuration, templates, sdk |
| `4-execution`  | `gate/4-execution`  |     7 | execution, pipeline, metrics, monitoring, alerting, audit, reporting               |
| `5-governance` | `gate/5-governance` |     8 | governance, rbac, compliance, risk, waiver, escalation, slo, cost                  |
| `6-domain-ai`  | `gate/6-domain-ai`  |     8 | model, data, inference, training, vector, billing, tenant isolation                |
| `7-evolution`  | `gate/7-evolution`  |     4 | experiments, evolution, roadmap, feedback                                          |
| `8-coverage`   | `gate/8-coverage`   |    51 | coverage dimensions                                                                |

### K.3.2 AI Infrastructure Gate Layers

| Range   | Directory | Count | Purpose                                                        |
| ------- | --------- | ----: | -------------------------------------------------------------- |
| `01-08` | `l00`     |     8 | naming, registry, lifecycle, binding, dependency, owner, audit |
| `11-18` | `l10`     |     8 | ai chip, gpu, accelerator, smart server, compute center        |
| `21-28` | `l20`     |     8 | dataset, vector database, embedding, data quality              |
| `31-38` | `l30`     |     8 | ai framework, model, training, inference, agent                |
| `41-48` | `l40`     |     8 | declarative workload contract, inference, training, rag, agent |
| `51-58` | `l50`     |     8 | usage event, metering, cost attribution, billing evidence      |
| `61-64` | `l60`     |     4 | cloud infra, kubernetes, gitops, managed sla                   |
| `91-99` | `l90`     |     9 | sbom, provenance, signature, audit, release closure            |

---

## K.4 Gate Identity Model

### K.4.1 Quality Gate Document Identity

Quality gate document IDs SHOULD follow:

```text
gate-{topic}
```

Examples:

```text
gate-overview
gate-validation
gate-model-quality
gate-line
gate-sbom-coverage
```

### K.4.2 AI Infra Gate Identity

AI infrastructure gate IDs MUST follow:

```text
gate-[0-9]{2}-{kebab-case-name}
```

Examples:

```text
gate-11-ai-chip-capability-validation
gate-41-ai-workload-contract-validation
gate-58-invoice-evidence-validation
gate-99-production-closure-validation
```

### K.4.3 Full Canonical Gate Resource Name

Full canonical name:

```text
mycodexvantaos-ai-infra-gates-gate-41-ai-workload-contract-validation
```

Regex:

```text
^mycodexvantaos-ai-infra-gates-gate-[0-9]{2}-[a-z0-9]+(?:-[a-z0-9]+)*$
```

---

## K.5 Unified Gate Catalog Schema

`unified-gate-index.yaml` SHOULD contain both documentation gates and executable AI infrastructure gates.

```yaml
apiVersion: mycodexvantaos.io/v1
kind: UnifiedGateIndex

metadata:
  name: unified-gate-index
  organization: mycodexvantaos

spec:
  planes:
    - id: quality-gate-plane
      path: gate/
      purpose: documentation-governance-coverage

    - id: ai-infra-gate-plane
      path: ai-infra-gates/
      purpose: executable-ai-native-infrastructure-gates

  gates:
    - id: gate-overview
      plane: quality-gate-plane
      path: gate/1-core/gate-overview.rst
      lifecycle: active
      blocking: false

    - id: gate-41-ai-workload-contract-validation
      plane: ai-infra-gate-plane
      path: ai-infra-gates/l40/gate-41-ai-workload-contract-validation.yaml
      lifecycle: active
      blocking: true
      validates:
        - ai-workload-contract
        - runtime-policy
        - resource-declaration
```

---

## K.6 Executable Gate Resource Schema

Each executable AI infrastructure gate SHOULD use:

```yaml
apiVersion: mycodexvantaos.io/v1
kind: AiInfrastructureGate

metadata:
  id: gate-41-ai-workload-contract-validation
  name: ai-workload-contract-validation
  organization: mycodexvantaos

spec:
  layer: ai-workload
  gateNumber: 41
  blocking: true
  lifecycle: active
  owner: platform-ai-governance
  riskLevel: high

  validates:
    - ai-workload-contract
    - task-type
    - input-output-schema
    - resource-requirement
    - runtime-policy

  inputs:
    - path: contracts/ai-workload-contract.yaml
    - path: schemas/ai-workload-contract.schema.json

  outputs:
    - path: outputs/gate-41-ai-workload-contract-validation-report.json
      type: gate-report

  failurePolicy:
    onFailure: block
    waiverAllowed: true
    waiverPolicy: policies/gate-waiver-policy.yaml

  evidence:
    required: true
    path: outputs/gate-audit-report.json
```

---

## K.7 Gate Composition Rule

### K.7.1 Production Readiness Gate Chain

A production AI workload MUST pass the following chain:

```text
meta-governance
  ↓
compute-foundation
  ↓
data-foundation
  ↓
algorithm-foundation
  ↓
ai-workload
  ↓
ai-task-billing
  ↓
cloud-managed-infrastructure
  ↓
attestation-compliance-closure
```

### K.7.2 Minimum Blocking Gates

The minimum blocking set for production is:

```text
gate-01 namespace-governance-validation
gate-04 directory-binding-mediator-validation
gate-05 dependency-graph-acyclic-validation
gate-15 ai-compute-cluster-readiness
gate-21 dataset-contract-validation
gate-25 vector-database-schema-validation
gate-32 model-contract-validation
gate-34 inference-runtime-validation
gate-41 ai-workload-contract-validation
gate-47 workload-slo-validation
gate-51 usage-event-contract-validation
gate-56 cost-attribution-validation
gate-62 kubernetes-baseline-validation
gate-63 gitops-sync-validation
gate-91 sbom-generation-validation
gate-92 provenance-validation
gate-93 signature-validation
gate-99 production-closure-validation
```

---

## K.8 Integration with Existing Gate Documents

### K.8.1 Mapping Quality Documents to Executable Gates

| Quality Gate Document        | Executable Gate Usage                                     |
| ---------------------------- | --------------------------------------------------------- |
| `gate-policies.rst`          | defines global policy semantics for all executable gates  |
| `gate-validation.rst`        | defines input/output validation style                     |
| `gate-mapping.rst`           | maps gate result to registry, report, billing, compliance |
| `gate-lifecycle.rst`         | controls executable gate lifecycle                        |
| `gate-states.rst`            | controls gate execution result state machine              |
| `gate-framework.rst`         | defines plugin and SDK architecture                       |
| `gate-composition.rst`       | defines chained and parallel gates                        |
| `gate-dependencies.rst`      | prevents cyclic gate dependencies                         |
| `gate-execution.rst`         | defines scheduler, timeout, retry                         |
| `gate-audit.rst`             | defines evidence and audit record                         |
| `gate-waiver.rst`            | defines waiver process                                    |
| `gate-cost.rst`              | links gate execution to billing model                     |
| `gate-model-quality.rst`     | defines model quality thresholds                          |
| `gate-data-quality.rst`      | defines data quality thresholds                           |
| `gate-billing-accuracy.rst`  | defines billing evidence checks                           |
| `gate-sbom-coverage.rst`     | supports gate-91                                          |
| `gate-signing-coverage.rst`  | supports gate-93                                          |
| `gate-contract-coverage.rst` | supports gate-41 and gate-51                              |

---

## K.9 CI Validation Requirements

CI MUST validate:

```text
gate catalog schema
ai infra gate schema
gate id regex
gate file path existence
gate lifecycle state
gate owner existence
gate dependency graph acyclic
gate composition validity
gate waiver policy
gate evidence output
coverage gate presence
production blocking gate set
```

CI MUST fail when:

```text
a blocking gate is missing
a gate id is malformed
a gate references a missing contract
a gate references a missing schema
a gate dependency cycle exists
an active gate has no owner
a high-risk gate allows unrestricted waiver
a production workload skips mandatory ai-infra gates
attestation closure gates are absent
```

Recommended CI reports:

```text
outputs/gate-validation-report.json
outputs/gate-coverage-report.json
outputs/ai-infra-gate-report.json
outputs/gate-waiver-report.json
outputs/gate-audit-report.json
outputs/production-closure-report.json
outputs/unified-gate-summary.json
```

---

## K.10 Business Capability Mapping

| Business Capability                | Required Gate Layer                                            |
| ---------------------------------- | -------------------------------------------------------------- |
| ai compute center hosting          | `l10`                                                          |
| vector database service            | `l20`                                                          |
| ai agent framework                 | `l30` + `l40`                                                  |
| ai full-chain development platform | `layer-00` + `layer-10` + `layer-20` + `layer-30` + `layer-40` |
| inference billing                  | `l50`                                                          |
| training billing                   | `gate-53-training-metering-validation`                         |
| embedding billing                  | `gate-54-embedding-metering-validation`                        |
| agent run billing                  | `gate-55-agent-run-metering-validation`                        |
| cloud managed infrastructure       | `l60`                                                          |
| compliance-grade delivery          | `l90`                                                          |

---

## K.11 Compliance Criteria

The unified gate system is implemented when:

1. every gate has documentation.
2. every executable gate has a machine-readable YAML definition.
3. every gate has metadata, owner, lifecycle, risk level, and validation target.
4. every production AI workload passes mandatory compute, data, algorithm, workload, billing, infrastructure, and attestation gates.
5. every gate result is auditable.
6. every waiver is governed.
7. every coverage dimension is represented.
8. every gate catalog entry is CI-verifiable.
9. high-risk gates do not allow unrestricted waiver.
10. gate dependency graphs remain acyclic.
11. attestation closure gates are present for production delivery.

---

## K.12 Final Rule

Final statement:

```text
mycodexvantaos gates are not only quality checks.
they are the formal delivery boundary for ai-native compute, data, algorithm,
workload, billing, infrastructure, compliance, and evidence.
```
