# MyCodexVantaOS — 統一架構規範正規化補丁

> 文件定位：`docs/unified-architecture-spec.md` 補丁章節  
> 規格等級：平台母規格 / 架構憲法 / CI 可執行治理依據  
> 適用範圍：root module、service manifest、provider manifest、foundation spec、service catalog、navigation、namespace governance、unified gates、CI、audit、exception、release、supply-chain  
> 機器識別：`mycodexvantaos`  
> 正式品牌識別：`MyCodexVantaOS`  
> 歷史品牌別名：`MyCodeXvantaOS`  
> 狀態：normative  
> 執行語義：MUST / MUST NOT / SHOULD / MAY

---

## A.0 補丁目的

本補丁用於正規化 MyCodexVantaOS 統一架構規範中的：

- 品牌名稱與機器名稱邊界
- manifest 類型邊界
- `foundation/` 結構
- canonical root layout
- `navigation/` 全域索引根目錄
- `mycodexvantaos-namespace-governance/` 命名空間治理根目錄
- `unified-gates/` 統一品質閘門與 AI infrastructure gate 根目錄
- CI 驗證
- 命名例外
- Provider capability
- hash policy
- Phase 0 交付物
- 平台閉環
- quantum-era extension

本補丁成立後，平台必須能同時支撐：

- `242-plus` flat root module governance
- effective canonical minimum root count `245`
- 七大 `foundation` 戰略規格
- `navigation/` AI 與人類全域索引
- `mycodexvantaos-namespace-governance/` 命名空間治理閉環
- `unified-gates/` 統一 gate 體系
- `mycodexvantaos-module.yaml` root module contract
- `module-manifest.yaml` service manifest
- `provider-manifest.yaml` provider manifest
- `platform/service-catalog.yaml` service topology
- provider abstraction
- runtime mode resolver
- CI gate
- exception / audit closure
- release supply chain
- quantum-era extension

---

# A.1 Canonical Identity Normalization

## A.1.1 Brand Name and Machine Name

The platform MUST distinguish between human-facing brand identity and machine-facing canonical identity.

```yaml
identity:
  canonical_machine_name: mycodexvantaos
  canonical_brand_name: MyCodexVantaOS
  legacy_brand_aliases:
    - MyCodeXvantaOS
    - MyCodeXvanta OS
    - MyCodeXvantaOS
  machine_identifiers_must_use: mycodexvantaos
```

## A.1.2 Machine Identifier Rule

All machine-readable identifiers MUST use:

```text
mycodexvantaos
```

This applies to:

- GitHub organization
- npm scope
- URN namespace
- OCI registry organization
- Kubernetes labels
- internal URI
- CI regex
- package names
- module contracts
- service manifests
- provider manifests
- audit records
- release artifacts
- navigation indexes
- namespace governance records
- gate catalogs

## A.1.3 Brand Name Rule

Human-facing documents SHOULD use:

```text
MyCodexVantaOS
```

Human-facing historical references MAY mention:

```text
MyCodeXvantaOS
```

However, historical aliases MUST NOT appear in canonical machine identifiers.

## A.1.4 Forbidden Legacy Prefixes

The following prefixes MUST NOT be used in canonical identifiers:

```yaml
forbidden_legacy_prefixes:
  - mycodexvanta-os
  - codexvanta-os
  - codexvanta
  - codevantaos
  - KUBO
  - kubo
  - AXIOM
  - axiom
```

CI MUST reject any canonical identifier containing these prefixes unless explicitly allowed by a temporary, non-expired exception record.

---

# A.2 Manifest Boundary Normalization

The platform uses multiple manifest types. These manifest types MUST NOT be conflated.

## A.2.1 Root Module Contract

File name:

```text
mycodexvantaos-module.yaml
```

Scope:

```text
root directory
```

Required location:

```text
<root-directory>/mycodexvantaos-module.yaml
```

Examples:

```text
foundation/mycodexvantaos-module.yaml
compute/mycodexvantaos-module.yaml
contracts/mycodexvantaos-module.yaml
governance/mycodexvantaos-module.yaml
security/mycodexvantaos-module.yaml
navigation/mycodexvantaos-module.yaml
mycodexvantaos-namespace-governance/mycodexvantaos-module.yaml
unified-gates/mycodexvantaos-module.yaml
```

A root module contract MUST declare:

- directory identity
- URN
- package identity if applicable
- domain
- capability
- architecture layer
- module type
- exports
- dependencies
- `foundationRefs`
- runtime-code allowance
- deployment allowance
- metadata-only status
- governance requirements

## A.2.2 Service Manifest

File name:

```text
module-manifest.yaml
```

Scope:

```text
deployable service
```

Required location:

```text
modules/<service-id>/module-manifest.yaml
```

Examples:

```text
modules/mycodexvantaos-ai-embedding/module-manifest.yaml
modules/mycodexvantaos-core-auth/module-manifest.yaml
modules/mycodexvantaos-quantum-controller/module-manifest.yaml
```

A service manifest MUST declare:

- `service_id`
- tier
- required providers
- supported runtime modes
- deployment targets
- service dependencies
- environment contract
- provider mapping
- production readiness requirements

## A.2.3 Provider Manifest

File name:

```text
provider-manifest.yaml
```

Scope:

```text
provider instance
```

Required location:

```text
providers/<capability>/<capability>-<provider>/provider-manifest.yaml
```

A provider manifest MUST declare:

- provider id
- canonical capability
- provider source
- criticality
- supported runtime modes
- health check contract
- observability contract

## A.2.4 Foundation Spec

File name:

```text
foundation.yaml
```

Scope:

```text
foundation specification unit
```

Required location:

```text
foundation/<name>-foundation/foundation.yaml
```

A foundation spec MUST NOT represent a deployable service.

## A.2.5 Navigation Indexes

The `navigation/` root module owns AI and human global indexes.

Required examples:

```text
navigation/directory-index.yaml
navigation/module-index.yaml
navigation/dependency-graph.yaml
navigation/binding-index.yaml
navigation/service-navigation-map.yaml
```

Navigation indexes MUST NOT create hard runtime dependencies. They represent governance, discovery, and reasoning indexes.

## A.2.6 Namespace Governance Records

The `mycodexvantaos-namespace-governance/` root module owns namespace naming, governance code, lifecycle, and closure records.

Required examples:

```text
mycodexvantaos-namespace-governance/governance/codes/index.yaml
mycodexvantaos-namespace-governance/governance/registry/namespace-registry.yaml
mycodexvantaos-namespace-governance/governance/policies/naming-policy.yaml
```

## A.2.7 Unified Gate Catalogs

The `unified-gates/` root module owns both quality gate documentation and executable AI infrastructure gates.

Required examples:

```text
unified-gates/gate/gate-catalog.yaml
unified-gates/ai-infra-gates/ai-infra-gates-catalog.yaml
unified-gates/unified-gate-index.yaml
```

## A.2.8 Service Catalog

File name:

```text
platform/service-catalog.yaml
```

Scope:

```text
global service index
```

The service catalog is the canonical index of deployable services and MUST reference valid service manifests.

## A.2.9 Manifest Type Matrix

| File                          | Scope                      | Required For            | Represents Runtime Service |
| ----------------------------- | -------------------------- | ----------------------- | -------------------------- |
| `mycodexvantaos-module.yaml`  | root directory             | every root module       | optional                   |
| `module-manifest.yaml`        | service module             | deployable service only | yes                        |
| `provider-manifest.yaml`      | provider instance          | provider implementation | provider only              |
| `foundation.yaml`             | foundation spec unit       | foundation subdirectory | no                         |
| `service-catalog.yaml`        | global service index       | platform                | indirect                   |
| `navigation/*.yaml`           | navigation index           | AI/human navigation     | no                         |
| `unified-gate-index.yaml`     | gate index                 | unified gate system     | no                         |
| `governance/codes/index.yaml` | namespace governance index | namespace governance    | no                         |

## A.2.10 Deprecated Manifest Names

The following names are forbidden:

```text
mycodexvantaos.module.yaml
module.yaml
axiom.module.yaml
```

CI MUST reject any occurrence of these names.

---

# A.3 Foundation Directory Governance

## A.3.1 Foundation Directory Role

The `foundation/` directory is the strategic specification center for the seven platform foundations.

It is NOT:

- a service directory
- a runtime implementation directory
- a provider implementation directory
- a source-code root
- a deployment manifest directory

It is:

```text
七大平台基礎能力的戰略規格、產品邊界、能力地圖、商業模型、成熟度模型與跨模組映射中心。
```

## A.3.2 Foundation Root Module

The `foundation/` directory is a root module and MUST contain:

```text
foundation/mycodexvantaos-module.yaml
```

This is the only root module contract required under `foundation/`.

## A.3.3 Seven Foundation Specification Units

The seven foundation subdirectories are specification units, not independent root modules:

```text
foundation/compute-foundation/
foundation/data-foundation/
foundation/algorithm-foundation/
foundation/agent-foundation/
foundation/contract-foundation/
foundation/governance-foundation/
foundation/business-foundation/
```

These subdirectories MUST NOT contain their own `mycodexvantaos-module.yaml`.

## A.3.4 Required Files Per Foundation Unit

Each foundation subdirectory MUST contain:

```text
foundation.yaml
README.md
capability-map.yaml
module-map.yaml
service-map.yaml
package-map.yaml
urn-map.yaml
owner-map.yaml
boundary.yaml
roadmap.yaml
maturity.yaml
product-boundary.yaml
reference-architecture.yaml
commercial-model.yaml
```

## A.3.5 Foundation Subdirectory Boundary

Each foundation subdirectory is a `specification-unit` under the parent `foundation` root module.

Each `foundation/<name>-foundation/foundation.yaml` MUST declare:

```yaml
spec:
  boundary:
    boundaryType: specification-unit
    parentModule: foundation
    parentModuleUrn: urn:mycodexvantaos:foundation:module:foundation
    independentRootModule: false
    requiresModuleContract: false
    runtimeCodeAllowed: false
    serviceCodeAllowed: false
    deploymentManifestAllowed: false
```

## A.3.6 Foundation Prohibited Content

Foundation subdirectories MUST NOT contain:

- runtime source code
- service implementation
- provider implementation
- Dockerfile
- package manager lockfile
- deployment manifests
- Kubernetes runtime manifests
- application source code

## A.3.7 Foundation Export Paths

The `foundation/mycodexvantaos-module.yaml` file MUST export each foundation specification using subdirectory paths:

```yaml
exports:
  - type: foundation-spec
    name: compute-foundation
    path: ./compute-foundation/foundation.yaml
  - type: foundation-spec
    name: data-foundation
    path: ./data-foundation/foundation.yaml
  - type: foundation-spec
    name: algorithm-foundation
    path: ./algorithm-foundation/foundation.yaml
  - type: foundation-spec
    name: agent-foundation
    path: ./agent-foundation/foundation.yaml
  - type: foundation-spec
    name: contract-foundation
    path: ./contract-foundation/foundation.yaml
  - type: foundation-spec
    name: governance-foundation
    path: ./governance-foundation/foundation.yaml
  - type: foundation-spec
    name: business-foundation
    path: ./business-foundation/foundation.yaml
```

## A.3.8 Foundation Alignment Table

| Foundation              | Unified Architecture Alignment                                      |
| ----------------------- | ------------------------------------------------------------------- |
| `compute-foundation`    | Deployment Layer, Runtime, Kubernetes, OCI, Compute Resource        |
| `data-foundation`       | Provider capability: database, storage, vector-store, graph, search |
| `algorithm-foundation`  | Provider capability: llm, embedding, model-provider, evaluation     |
| `agent-foundation`      | Service Layer, workflow, scheduler, agent, automation               |
| `contract-foundation`   | Manifest, Schema, URN, Service Catalog, Naming Closure              |
| `governance-foundation` | CI Gate, Exception, Audit, Policy, Supply Chain                     |
| `business-foundation`   | Billing, Usage Metering, Marketplace, Workspace, Quota              |

---

# A.4 Canonical Root Layout

The canonical root layout MUST include:

```text
foundation/
navigation/
mycodexvantaos-namespace-governance/
unified-gates/
```

The root directory count model is:

```yaml
rootDirectoryCount:
  declaredClass: 242-plus
  previousMappedCount: 242
  addedCanonicalRootDirectories: 3
  effectiveCanonicalMinimumCount: 245
  fixedCountRequired: false
  registryDrivenCountRequired: true
```

Canonical root layout excerpt:

```text
mycodexvantaos/
├── docs/
│   └── unified-architecture-spec.md
│
├── navigation/
│   ├── mycodexvantaos-module.yaml
│   ├── README.md
│   ├── directory-index.yaml
│   ├── module-index.yaml
│   ├── dependency-graph.yaml
│   ├── binding-index.yaml
│   └── service-navigation-map.yaml
│
├── mycodexvantaos-namespace-governance/
│   ├── mycodexvantaos-module.yaml
│   ├── README.md
│   ├── governance/
│   ├── navigation/
│   ├── contracts/
│   ├── schemas/
│   ├── scripts/
│   └── outputs/
│
├── unified-gates/
│   ├── mycodexvantaos-module.yaml
│   ├── README.md
│   ├── gate/
│   ├── ai-infra-gates/
│   ├── contracts/
│   ├── schemas/
│   ├── workflows/
│   ├── policies/
│   ├── scripts/
│   └── outputs/
│
├── foundation/
│   ├── mycodexvantaos-module.yaml
│   ├── README.md
│   ├── foundation-index.yaml
│   ├── foundation-taxonomy.yaml
│   ├── foundation-capability-map.yaml
│   ├── foundation-dependency-map.yaml
│   ├── foundation-roadmap.yaml
│   ├── foundation-product-boundary.yaml
│   ├── foundation-commercial-model.yaml
│   ├── foundation-reference-architecture.yaml
│   ├── compute-foundation/
│   ├── data-foundation/
│   ├── algorithm-foundation/
│   ├── agent-foundation/
│   ├── contract-foundation/
│   ├── governance-foundation/
│   ├── business-foundation/
│   ├── maps/
│   ├── diagrams/
│   ├── boundaries/
│   ├── capabilities/
│   ├── maturity/
│   ├── adoption/
│   └── commercial/
│
├── platform/
│   └── service-catalog.yaml
│
├── governance/
│   ├── platform-governance-spec.yaml
│   ├── naming-policy.schema.json
│   ├── capability-set.yaml
│   ├── provider-registry.yaml
│   ├── exceptions.yaml
│   ├── audit/
│   ├── schemas/
│   ├── naming-closure/
│   │   ├── l0-atomic-categories.yaml
│   │   ├── l1-specs/
│   │   └── l2-meta/
│   └── quantum-classical-bridge.yaml
│
├── ci/
│   ├── validate-architecture.ts
│   ├── utils/
│   │   ├── regex-table.ts
│   │   ├── service-id-parser.ts
│   │   └── naming-closure-prover.ts
│   ├── rules/
│   └── reporters/
│
├── modules/
│   └── <service-id>/
│       └── module-manifest.yaml
│
├── services/
│   └── <service-id>/
│
├── providers/
│   └── <capability>/
│       └── <capability>-<provider>/
│           └── provider-manifest.yaml
│
├── packages/
│   ├── core/
│   ├── ports/
│   ├── application/
│   └── adapters/
│
├── apps/
│   ├── api-node/
│   ├── api-worker/
│   ├── web-console/
│   ├── admin-console/
│   └── cli/
│
├── infra/
│   ├── docker-compose/
│   ├── kubernetes/
│   │   ├── base/
│   │   ├── overlays/
│   │   ├── namespaces/
│   │   └── crds/
│   └── helm/
│
├── contracts/
├── schemas/
├── policies/
├── rego/
├── release/
├── supply-chain/
├── sbom/
├── artifacts/
├── scripts/
└── outputs/
```

---

# A.5 Naming Normalization

## A.5.1 Naming Closure Paths

The naming closure paths MUST be lowercase kebab-case.

The following paths are forbidden:

```text
governance/naming-closure/L1-specs/
governance/naming-closure/L2-meta/
governance/naming-closure/L0-atomic-categories.yaml
```

They MUST be normalized to:

```text
governance/naming-closure/l1-specs/
governance/naming-closure/l2-meta/
governance/naming-closure/l0-atomic-categories.yaml
```

## A.5.2 Kubernetes API Group Dot Exception

The global rule forbids semantic dots in canonical basenames. However, Kubernetes API groups MAY use DNS-like names.

```yaml
protocolSpecificExceptions:
  kubernetesApiGroup:
    dotAllowed: true
    example: mycodexvantaos.quantum
    reason: Kubernetes API group convention requires DNS-like naming.
```

This exception applies only to protocol-specific Kubernetes API group values, not to file basenames, directory names, service IDs, packages, URNs, or OCI names.

## A.5.3 Environment Name Exception

Environment markers such as:

```text
dev
staging
prod
production
local
```

MUST NOT appear in canonical identifiers such as:

- service ID
- package name
- URN
- K8s base resource name
- OCI repository name
- root module name

They MAY appear only in deployment overlay paths:

```text
infra/kubernetes/overlays/<env>/
infra/kubernetes/namespaces/
infra/helm/values-<env>.yaml
deploy/kustomize/overlays/<env>/
```

## A.5.4 Emoji Path Rule

Emoji MAY appear in explanatory documentation text, but MUST NOT appear in actual paths, registry keys, package names, URNs, service IDs, module IDs, or CI path filters.

Correct:

```text
docs may describe 📂 coverage as a visual label
```

Incorrect:

```text
📂coverage/
📊observability/
🔐compliance/
```

---

# A.6 Foundation Structure Validation

The `foundation/` directory MUST be validated as part of architecture CI.

## A.6.1 Validator

```text
scripts/validate-foundation-structure.py
```

## A.6.2 Required Checks

The validator MUST verify:

- `foundation/` exists.
- `foundation/mycodexvantaos-module.yaml` exists.
- Seven foundation subdirectories exist.
- Each foundation subdirectory contains required YAML files.
- Each `foundation.yaml` has:
  - `apiVersion: mycodexvantaos.io/v1`
  - `kind: Foundation`
  - valid `metadata.name`
  - valid `spec.boundary`
  - `independentRootModule: false`
  - `runtimeCodeAllowed: false`
- No runtime source code exists under `foundation/`.
- No Dockerfile, package lockfile, or deployment manifest exists under foundation subdirectories.
- All names are lowercase kebab-case.

## A.6.3 CI Command

```bash
python3 scripts/validate-foundation-structure.py --root foundation
```

## A.6.4 GitHub Actions Step

```yaml
- name: Validate Foundation Structure
  run: python3 scripts/validate-foundation-structure.py --root foundation
```

---

# A.7 Provider Capability Normalization

The canonical provider capability set MUST include quantum-era capabilities.

```yaml
canonical_capabilities:
  - database
  - storage
  - auth
  - queue
  - state-store
  - secrets
  - repo
  - deploy
  - validation
  - security
  - observability
  - notification
  - scheduler
  - vector-store
  - embedding
  - llm
  - graph
  - cache
  - search
  - quantum-runtime
  - quantum-simulator
  - quantum-processor
  - quantum-circuit
  - quantum-observability
```

Provider manifests MUST NOT use vendor-specific names as canonical capabilities.

Correct:

```text
llm-openai
database-postgres
quantum-processor-native
```

Incorrect:

```text
openai-llm
postgres-database
ibm-quantum-processor
```

Vendor name MAY appear in the provider segment, but MUST NOT replace the canonical capability segment.

---

# A.8 Hash Policy Normalization

Hash policy MUST distinguish between runtime audit compatibility, long-term integrity, and fast CI comparison.

```yaml
hash_policy:
  runtime_audit_chain:
    algorithm: sha256
    reason: compatibility with existing audit-chain implementation

  long_term_integrity:
    algorithm: sha3-512
    reason: canonical long-term integrity proof

  fast_ci_comparison:
    algorithm: blake3
    reason: high-speed local and CI comparison
```

Release artifacts SHOULD use `sha3-512` as the primary long-term integrity digest.

CI MAY use `blake3` for high-speed comparison.

Existing runtime audit chains MAY continue to use `sha256` for compatibility.

---

# A.9 Foundation and Service Catalog Relationship

The `foundation/` directory does not define deployable services directly.

It defines strategic capability boundaries and maps them to service categories.

The canonical flow is:

```text
foundation/<foundation>/service-map.yaml
  ↓
platform/service-catalog.yaml
  ↓
modules/<service-id>/module-manifest.yaml
  ↓
services/<service-id>/
```

Rules:

- A foundation MAY reference many services.
- A service MAY be referenced by one or more foundations.
- A deployable service MUST exist in `platform/service-catalog.yaml`.
- A service catalog entry MUST point to a valid `module-manifest.yaml`.
- A foundation `service-map.yaml` MUST NOT bypass the service catalog.
- A service implementation MUST NOT be placed under `foundation/`.

---

# A.10 Phase 0 Delivery Normalization

Phase 0 MUST freeze both the platform mother specification and the foundation strategic specification layer.

## A.10.1 Phase 0 — Specification Freeze

Required deliverables:

```text
docs/unified-architecture-spec.md
navigation/mycodexvantaos-module.yaml
navigation/directory-index.yaml
navigation/module-index.yaml
navigation/dependency-graph.yaml
navigation/binding-index.yaml
mycodexvantaos-namespace-governance/mycodexvantaos-module.yaml
mycodexvantaos-namespace-governance/governance/codes/index.yaml
mycodexvantaos-namespace-governance/governance/registry/namespace-registry.yaml
unified-gates/mycodexvantaos-module.yaml
unified-gates/unified-gate-index.yaml
unified-gates/gate/gate-catalog.yaml
unified-gates/ai-infra-gates/ai-infra-gates-catalog.yaml
foundation/mycodexvantaos-module.yaml
foundation/foundation-index.yaml
foundation/foundation-dependency-map.yaml
foundation/compute-foundation/foundation.yaml
foundation/data-foundation/foundation.yaml
foundation/algorithm-foundation/foundation.yaml
foundation/agent-foundation/foundation.yaml
foundation/contract-foundation/foundation.yaml
foundation/governance-foundation/foundation.yaml
foundation/business-foundation/foundation.yaml
governance/platform-governance-spec.yaml
governance/naming-policy.schema.json
governance/capability-set.yaml
scripts/validate-foundation-structure.py
```

Phase 0 MUST NOT be considered complete unless all deliverables exist and pass validation.

---

# A.11 Normalized Platform Closure

## A.11.1 Previous Closure

The service-centric closure is:

```text
service_id
  ↓
module-manifest
  ↓
service-catalog
  ↓
provider-registry
  ↓
runtime-mode-resolver
  ↓
deployment-target
  ↓
ci-gates
  ↓
audit-evidence
  ↓
release-supply-chain
  ↓
production-runtime
```

## A.11.2 Normalized Foundation-Aware Closure

The normalized platform closure is:

```text
foundation-spec
  ↓
root-module-contract
  ↓
navigation-index
  ↓
namespace-governance
  ↓
service-catalog
  ↓
service-module-manifest
  ↓
provider-registry
  ↓
runtime-mode-resolver
  ↓
deployment-target
  ↓
unified-gates
  ↓
audit-evidence
  ↓
exception-control
  ↓
release-supply-chain
  ↓
production-runtime
  ↓
runtime-feedback
```

## A.11.3 Target State Formula

```text
foundation/
  defines strategic capability boundaries

navigation/
  defines AI and human global indexes

mycodexvantaos-namespace-governance/
  defines namespace governance closure

unified-gates/
  defines quality gates and AI infrastructure gates

mycodexvantaos-module.yaml
  defines root directory module boundaries

platform/service-catalog.yaml
  defines service topology

modules/<service-id>/module-manifest.yaml
  defines deployable service contract

providers/<capability>/<provider>/provider-manifest.yaml
  defines provider implementation contract

ci/validate-architecture.ts
  enforces naming, manifest, topology, provider, runtime, gate, and drift rules

governance/audit/
  records evidence

release + supply-chain
  freezes deployable artifacts
```

---

# A.12 Freeze Criteria

The unified architecture specification MAY be frozen as the MyCodexVantaOS Unified Architecture Constitution only when the following criteria are satisfied:

1. Brand identity and machine identity are normalized.
2. `mycodexvantaos-module.yaml` and `module-manifest.yaml` are explicitly separated.
3. `foundation/` is included in canonical root layout.
4. `navigation/` is included as the AI and human global index root.
5. `mycodexvantaos-namespace-governance/` is included as namespace governance closure root.
6. `unified-gates/` is included as unified quality and AI infrastructure gate root.
7. Foundation directory governance is defined.
8. Foundation structure validation is executable.
9. Naming closure paths are lowercase kebab-case.
10. Kubernetes API group dot exception is explicitly scoped.
11. Environment marker exception is explicitly scoped to deployment overlays.
12. Emoji is forbidden in actual paths and allowed only in documentation labels.
13. Quantum provider capabilities are included.
14. Hash policy is normalized.
15. Foundation-to-service-catalog relationship is defined.
16. Foundation deliverables are included in Phase 0.
17. Navigation deliverables are included in Phase 0.
18. Namespace governance deliverables are included in Phase 0.
19. Unified gate deliverables are included in Phase 0.
20. CI can reject deprecated manifest names.
21. CI can validate foundation structure.
22. CI can validate provider capability mappings.
23. CI can validate navigation indexes.
24. CI can validate namespace governance records.
25. CI can validate unified gate catalogs.

When these criteria are met, the document becomes:

```text
MyCodexVantaOS Unified Architecture Constitution
```

and serves as the normative source for:

- root module governance
- foundation strategic specifications
- navigation indexes
- namespace governance
- unified gate governance
- service manifest topology
- provider abstraction
- runtime mode resolution
- CI enforcement
- audit / exception closure
- release supply chain
- quantum-era extension

---

# A.13 CI Enforcement Summary

CI MUST reject:

```text
deprecated manifest names
missing mycodexvantaos-module.yaml in root modules
missing foundation structure
foundation submodule mycodexvantaos-module.yaml
runtime code under foundation specification units
invalid provider capability order
vendor-first provider IDs
uppercase naming-closure paths
environment markers in canonical resource names
emoji in actual paths
missing navigation indexes
invalid namespace governance records
invalid unified gate catalogs
missing Phase 0 deliverables
```

CI MAY allow:

```text
environment markers in deployment overlay paths
Kubernetes API group DNS-like dotted values
historical brand aliases in human-facing documents
blake3 fast comparison outputs
sha256 runtime audit compatibility
```

CI MUST produce:

```text
architecture-validation-report.json
foundation-validation-report.json
navigation-validation-report.json
namespace-governance-validation-report.json
unified-gates-validation-report.json
provider-capability-validation-report.json
phase-zero-freeze-report.json
```
