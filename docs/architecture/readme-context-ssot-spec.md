# MyCodexVantaOS — README Context SSOT and Drift Control Specification

> 文件定位：`docs/architecture/readme-context-ssot-spec.md`  
> 建議母規格章節：`Appendix D — README Context SSOT and Drift Control Specification`  
> 規格等級：平台母規格 / AI 導航文件治理規範 / CI 可執行治理依據  
> 適用範圍：root README、domain README、local README、`directory-context.yaml`、`mycodexvantaos-module.yaml`、`module-manifest.yaml`、`provider-manifest.yaml`、`foundation.yaml`、README generated blocks、README generator、CI drift checks、`navigation/`  
> 機器識別：`mycodexvantaos`  
> 品牌識別：`MyCodexVantaOS`  
> 狀態：normative  
> 執行語義：MUST / MUST NOT / SHOULD / MAY

---

## D.0 Purpose

This specification defines how MyCodexVantaOS prevents README redundancy and documentation drift while still providing high-quality AI and human navigation context across a repository with `242-plus` root-level capability modules.

The core strategy is:

```text
SSOT authoritative metadata
  ↓
reference-based README
  ↓
generated README context blocks
  ↓
navigation indexes
  ↓
CI drift validation
```

The normative principle is:

```text
README is a human and AI navigation layer.
YAML / manifest / schema is the authoritative data layer.
navigation/ is the global index layer.
CI / generator is the synchronization and governance layer.
```

---

# D.1 Core Rule

## D.1.1 README Is Not the Source of Truth

README files MUST NOT be treated as the single source of truth for platform governance, directory boundaries, service contracts, provider contracts, foundation mappings, namespace governance, gate definitions, or architecture rules.

README files MAY provide:

- navigation
- summaries
- local directory purpose
- links to authoritative files
- generated context blocks
- AI guidance
- human onboarding guidance

README files MUST NOT replace:

- `directory-context.yaml`
- `mycodexvantaos-module.yaml`
- `module-manifest.yaml`
- `provider-manifest.yaml`
- `foundation.yaml`
- `contracts/INDEX.yaml`
- `navigation/*.yaml`
- `mycodexvantaos-namespace-governance/**`
- `unified-gates/**`
- JSON schemas
- CI validators
- policy-as-code

## D.1.2 Authoritative Sources

The following files are authoritative, depending on scope:

| Scope                        | Authoritative File                                                      |
| ---------------------------- | ----------------------------------------------------------------------- |
| Platform architecture        | `docs/unified-architecture-spec.md`                                     |
| Root directory boundary      | `<root>/mycodexvantaos-module.yaml`                                     |
| Directory AI context         | `<directory>/directory-context.yaml`                                    |
| Service contract             | `modules/<service-id>/module-manifest.yaml`                             |
| Provider contract            | `providers/<capability>/<capability>-<provider>/provider-manifest.yaml` |
| Foundation boundary          | `foundation/<name>-foundation/foundation.yaml`                          |
| Contract index               | `contracts/INDEX.yaml`                                                  |
| Global AI / human navigation | `navigation/*.yaml`                                                     |
| Service topology             | `platform/service-catalog.yaml`                                         |
| Provider registry            | `governance/provider-registry.yaml`                                     |
| Naming rules                 | `governance/naming-policy.schema.json`                                  |
| Namespace governance         | `mycodexvantaos-namespace-governance/**`                                |
| Gate governance              | `unified-gates/**`                                                      |

## D.1.3 README Duplication Prohibition

Local README files MUST NOT duplicate global architecture principles in full.

The following content MUST NOT be copied into every local README:

- full platform positioning
- complete seven-foundation explanation
- complete naming policy
- complete contract-first policy
- complete provider abstraction policy
- complete runtime mode policy
- complete CI rule list
- complete repository directory map
- complete namespace governance policy
- complete unified gate policy

Instead, local README files MUST reference authoritative global documents.

---

# D.2 Three-Level README Model

MyCodexVantaOS defines a three-level README model:

```text
L0: Global README
L1: Domain / Foundation README
L2: Local Directory README
```

## D.2.1 L0 — Global README

L0 files:

```text
README.md
docs/unified-architecture-spec.md
```

L0 README and architecture files SHOULD contain:

- platform positioning
- seven-foundation overview
- AI development principles
- naming constitution
- contract-first model
- governance-enforced model
- provider abstraction
- runtime mode overview
- high-level directory map
- navigation root explanation
- namespace governance root explanation
- unified gates root explanation

These concepts SHOULD be written once at L0 and referenced by lower-level README files.

## D.2.2 L1 — Domain / Foundation README

L1 files include:

```text
foundation/compute-foundation/README.md
foundation/data-foundation/README.md
foundation/algorithm-foundation/README.md
foundation/agent-foundation/README.md
foundation/contract-foundation/README.md
foundation/governance-foundation/README.md
foundation/business-foundation/README.md
navigation/README.md
mycodexvantaos-namespace-governance/README.md
unified-gates/README.md
```

L1 README files SHOULD describe only the relevant domain, foundation, or governance root.

They SHOULD include:

- domain or foundation mission
- included capabilities
- excluded responsibilities
- linked root modules
- linked services
- linked packages
- linked commercial model
- linked capability map
- linked service map
- linked navigation indexes if applicable

L1 README files MUST NOT restate the entire platform constitution.

## D.2.3 L2 — Local Directory README

L2 files include:

```text
vector-store/README.md
ai-task/README.md
billing-model/README.md
services/<service-id>/README.md
modules/<service-id>/README.md
providers/<capability>/<capability>-<provider>/README.md
```

L2 README files SHOULD be short and local.

They SHOULD describe:

- what the directory is
- what is allowed in the directory
- what is forbidden in the directory
- which authoritative files govern the directory
- which contracts and schemas are related
- what an AI agent must read before modifying the directory

L2 README files SHOULD NOT exceed 120 lines unless explicitly justified.

---

# D.3 Local README Template

## D.3.1 Required Template

Local README files SHOULD use the following structure:

```markdown
# <directory-name>

## Role

This directory is responsible for: <one sentence>.

## Foundation

- Primary: `<foundation-name>`
- Secondary: `<optional-foundation-name>`

## Authority

Authoritative sources for this directory:

- Module contract: `<path>`
- Directory context: `<path>`
- Related contracts: `<path>`
- Related schemas: `<path>`
- Related service catalog: `<path>`
- Related navigation index: `<path>`

## Allowed Content

- <allowed item>
- <allowed item>

## Forbidden Content

- <forbidden item>
- <forbidden item>

## AI Guidance

Before modifying this directory:

1. Read the authority files above.
2. Do not create contracts ad hoc.
3. Do not bypass provider / port boundaries.
4. Update indexes if new resources are added.
5. Update `navigation/` if directory relationships change.

## Generated Context

<!-- BEGIN:MYCODEXVANTAOS-GENERATED-CONTEXT -->

This section is generated from manifests. Do not edit manually.

<!-- END:MYCODEXVANTAOS-GENERATED-CONTEXT -->
```

## D.3.2 Local README Maximum Size

Local README files SHOULD remain between:

```text
80 and 120 lines
```

If more detail is required, it SHOULD be moved to:

- `directory-context.yaml`
- `docs/`
- relevant manifest
- relevant schema
- relevant foundation spec
- relevant navigation index

---

# D.4 Directory Context SSOT

## D.4.1 Required Role

`directory-context.yaml` is the machine-readable single source of truth for local AI navigation context.

It SHOULD exist in every high-value directory and MAY be extended to all root modules.

## D.4.2 Recommended Location

```text
<directory>/directory-context.yaml
```

Examples:

```text
vector-store/directory-context.yaml
ai-task/directory-context.yaml
billing-model/directory-context.yaml
foundation/compute-foundation/directory-context.yaml
modules/mycodexvantaos-ai-embedding/directory-context.yaml
providers/vector-store/vector-store-pgvector/directory-context.yaml
navigation/directory-context.yaml
unified-gates/directory-context.yaml
mycodexvantaos-namespace-governance/directory-context.yaml
```

## D.4.3 Canonical Directory Context Example

```yaml
apiVersion: mycodexvantaos.io/v1
kind: DirectoryContext

metadata:
  name: vector-store
  organization: mycodexvantaos

spec:
  role: Vector store abstraction and provider-neutral vector storage contracts.

  foundation:
    primary: data-foundation
    secondary:
      - algorithm-foundation

  authority:
    moduleContract: vector-store/mycodexvantaos-module.yaml
    relatedContracts:
      - contracts/vector/vector-store.proto
      - contracts/events/vector-events.yaml
    relatedSchemas:
      - schemas/vector-store.schema.json
    relatedIndexes:
      - foundation/data-foundation/module-map.yaml
      - foundation/data-foundation/service-map.yaml
      - navigation/module-index.yaml
      - navigation/dependency-graph.yaml

  allowedContent:
    - vector store contracts
    - provider-neutral vector storage abstractions
    - vector index metadata
    - README and examples

  forbiddenContent:
    - provider SDK implementation
    - runtime database credentials
    - billing ledger implementation
    - deployment manifests

  aiGuidance:
    - Prefer provider-neutral interfaces.
    - Do not import Qdrant, pgvector, Pinecone, or Vectorize SDKs directly here.
    - Use adapters or provider manifests for concrete implementations.
    - Update vector index contracts when changing storage semantics.
    - Update navigation indexes when relationships change.
```

## D.4.4 Directory Context Requirements

`directory-context.yaml` SHOULD include:

- `apiVersion`
- `kind`
- `metadata.name`
- `metadata.organization`
- `spec.role`
- `spec.foundation`
- `spec.authority`
- `spec.allowedContent`
- `spec.forbiddenContent`
- `spec.aiGuidance`

It MAY include:

- `tags`
- `related`
- `owner`
- `lifecycle`
- `readme`
- `upstream`
- `downstream`
- `services`
- `packages`
- `navigation`
- `gates`

---

# D.5 Reference-Based README Rule

## D.5.1 Reference Instead of Copy

README files MUST reference authoritative files instead of duplicating their contents.

Incorrect:

```markdown
This directory must follow local-first, cloud-agnostic, contract-first,
governance-enforced, provider abstraction, runtime mode, naming policy,
and CI rules...
```

Correct:

```markdown
This directory follows the global architecture rules defined in:

- `docs/unified-architecture-spec.md`
- `governance/naming-policy.schema.json`
- `governance/capability-set.yaml`
- `foundation/data-foundation/foundation.yaml`
- `navigation/module-index.yaml`
```

## D.5.2 Local Difference Rule

A local README SHOULD only define local differences, local responsibilities, and local constraints.

It MUST NOT duplicate global policy text unless required for a generated summary block.

---

# D.6 Generated README Context Blocks

## D.6.1 Generated Block Format

README files MAY contain generated context blocks.

Canonical block markers:

```markdown
<!-- BEGIN:MYCODEXVANTAOS-GENERATED-CONTEXT -->

...

<!-- END:MYCODEXVANTAOS-GENERATED-CONTEXT -->
```

## D.6.2 Edit Rule

Content between generated block markers MUST NOT be manually edited.

## D.6.3 Generated Content Sources

Generated README context blocks SHOULD be derived from:

- `directory-context.yaml`
- `mycodexvantaos-module.yaml`
- `module-manifest.yaml`
- `provider-manifest.yaml`
- `foundation.yaml`
- `foundation/*/module-map.yaml`
- `platform/service-catalog.yaml`
- `governance/capability-set.yaml`
- `navigation/*.yaml`
- `unified-gates/unified-gate-index.yaml`

## D.6.4 Example Generated Block

```markdown
## Generated Context

<!-- BEGIN:MYCODEXVANTAOS-GENERATED-CONTEXT -->

Generated from:

- directory-context.yaml
- mycodexvantaos-module.yaml
- foundation/\*/module-map.yaml
- navigation/module-index.yaml

Primary foundation: data-foundation

Allowed content:

- vector store contracts
- provider-neutral vector storage abstractions

Forbidden content:

- provider SDK implementation
- deployment manifests
<!-- END:MYCODEXVANTAOS-GENERATED-CONTEXT -->
```

## D.6.5 Drift Rule

CI MUST be able to verify that generated README blocks match their authoritative sources.

---

# D.7 README Generation Tooling

## D.7.1 Recommended Generator

A README context generator SHOULD be provided.

Recommended paths:

```text
tools/context/generate-readme-context.ts
```

or:

```text
scripts/generate-directory-readmes.py
```

## D.7.2 Generator Inputs

The generator SHOULD read:

```text
directory-context.yaml
mycodexvantaos-module.yaml
module-manifest.yaml
provider-manifest.yaml
foundation.yaml
foundation/*/module-map.yaml
platform/service-catalog.yaml
governance/capability-set.yaml
navigation/*.yaml
unified-gates/unified-gate-index.yaml
```

## D.7.3 Generator Outputs

The generator SHOULD update:

```text
<directory>/README.md
```

or only update the generated block inside:

```text
<!-- BEGIN:MYCODEXVANTAOS-GENERATED-CONTEXT -->
<!-- END:MYCODEXVANTAOS-GENERATED-CONTEXT -->
```

## D.7.4 Recommended Commands

```bash
pnpm generate:directory-context
```

or:

```bash
python3 scripts/generate-directory-readmes.py
```

## D.7.5 Check Mode

The generator SHOULD support a check-only mode:

```bash
pnpm generate:directory-context --check
```

or:

```bash
python3 scripts/generate-directory-readmes.py --check
```

Check mode MUST fail when generated blocks are outdated.

---

# D.8 README Drift Validation

## D.8.1 Required Drift Checks

CI SHOULD check:

- README generated block matches `directory-context.yaml`
- README generated block matches related manifests
- README generated block matches navigation indexes
- README references only existing authority files
- `directory-context.yaml` references existing foundation specs
- `directory-context.yaml` references existing contracts
- `directory-context.yaml` references existing schemas
- `directory-context.yaml` references existing navigation indexes
- allowed / forbidden content does not conflict with foundation boundary
- local README does not duplicate forbidden global sections
- generated block markers are valid and balanced

## D.8.2 Recommended Commands

```bash
pnpm validate:directory-context
pnpm generate:directory-context --check
```

or:

```bash
python3 scripts/validate-directory-context.py
python3 scripts/generate-directory-readmes.py --check
```

## D.8.3 CI Step Example

```yaml
- name: Validate Directory Context
  run: pnpm validate:directory-context

- name: Check Generated README Drift
  run: pnpm generate:directory-context --check
```

---

# D.9 Short README + Long Specification Model

## D.9.1 Content Placement Matrix

| Type                     | Location                                    | Content                         |
| ------------------------ | ------------------------------------------- | ------------------------------- |
| Global principles        | `docs/unified-architecture-spec.md`         | Platform mother specification   |
| Platform entry           | `README.md`                                 | High-level summary              |
| Foundation specification | `foundation/*/foundation.yaml`              | Strategic boundaries            |
| Root module boundary     | `*/mycodexvantaos-module.yaml`              | Directory boundary              |
| Service contract         | `modules/<service-id>/module-manifest.yaml` | Service contract                |
| Provider contract        | `providers/*/*/provider-manifest.yaml`      | Provider contract               |
| Global navigation        | `navigation/*.yaml`                         | AI and human navigation indexes |
| Namespace governance     | `mycodexvantaos-namespace-governance/**`    | Namespace governance closure    |
| Gate governance          | `unified-gates/**`                          | Gate definitions and catalogs   |
| Local navigation         | `<directory>/README.md`                     | Short guidance                  |
| AI context               | `<directory>/directory-context.yaml`        | Machine-readable local context  |
| Repeated summary         | README generated block                      | Auto-generated summary          |

## D.9.2 Canonical Principle

```text
Short README.
Long specification.
Machine-readable authority.
Navigation-indexed discovery.
Generated repeated context.
CI-enforced drift control.
```

---

# D.10 Anti-Redundancy Rules

## Rule 1 — Global Principles Written Once

Global principles MUST be written in:

```text
README.md
docs/unified-architecture-spec.md
```

They MUST NOT be copied into every local README.

## Rule 2 — Local README Only Describes Local Responsibility

Local README files MUST focus on local directory responsibility.

## Rule 3 — Authority Belongs in YAML / Manifest / Schema

README files MUST NOT be the authoritative source for architecture facts.

## Rule 4 — README References Authority

README files SHOULD link to authoritative files.

## Rule 5 — Repeated Content Is Generated

Repeated content SHOULD be generated, especially:

- allowed content
- forbidden content
- foundation mapping
- related contracts
- related services
- related packages
- owner mapping
- related navigation indexes
- related gates

## Rule 6 — Generated Blocks Are Protected

Generated blocks MUST NOT be manually edited.

## Rule 7 — CI Checks README Drift

CI SHOULD fail when README generated blocks drift from authoritative metadata.

## Rule 8 — Local README Length Is Limited

Local README files SHOULD remain short.

Recommended size:

```text
80–120 lines
```

## Rule 9 — Contracts Are Indexed

`contracts/INDEX.yaml` SHOULD exist so local README files do not need to list every contract manually.

## Rule 10 — Foundation Maps Are Indexed

`foundation/maps/` SHOULD exist so local README files do not need to manually duplicate module mappings.

## Rule 11 — Navigation Owns Discovery

`navigation/` SHOULD own global discovery indexes so local README files do not need to duplicate repository-wide maps.

---

# D.11 Recommended Directory Context Layouts

## D.11.1 Root Directory Layout

For root directories:

```text
<root-directory>/
├── README.md
├── directory-context.yaml
└── mycodexvantaos-module.yaml
```

## D.11.2 Deployable Service Layout

For deployable services:

```text
modules/<service-id>/
├── README.md
├── module-manifest.yaml
└── directory-context.yaml
```

## D.11.3 Provider Layout

For providers:

```text
providers/<capability>/<capability>-<provider>/
├── README.md
├── provider-manifest.yaml
└── directory-context.yaml
```

## D.11.4 Foundation Specification Unit Layout

For foundation specification units:

```text
foundation/compute-foundation/
├── README.md
├── foundation.yaml
├── directory-context.yaml
├── capability-map.yaml
├── module-map.yaml
└── ...
```

## D.11.5 Navigation Root Layout

For navigation root:

```text
navigation/
├── README.md
├── directory-context.yaml
├── mycodexvantaos-module.yaml
├── directory-index.yaml
├── module-index.yaml
├── dependency-graph.yaml
├── binding-index.yaml
└── service-navigation-map.yaml
```

---

# D.12 Minimum Rollout Plan

## D.12.1 Phase 1 — High-Value README Coverage

First create local README files for:

```text
foundation/README.md
foundation/*-foundation/README.md
contracts/README.md
contracts/INDEX.yaml
navigation/README.md
mycodexvantaos-namespace-governance/README.md
unified-gates/README.md
ai-task/README.md
ai-task/task-template.yaml
billing-model/README.md
vector-store/README.md
services/README.md
modules/README.md
providers/README.md
governance/README.md
ci/README.md
```

## D.12.2 Phase 2 — Directory Context Coverage

First create `directory-context.yaml` for:

```text
navigation/
mycodexvantaos-namespace-governance/
unified-gates/
ai-task/
billing-model/
vector-store/
knowledge-graph/
model-endpoint/
agent-runtime-platform/
governance/
foundation/
```

## D.12.3 Phase 3 — Generator and CI

Add:

```text
scripts/generate-directory-readmes.py
scripts/validate-directory-context.py
```

or TypeScript equivalents.

CI MUST include:

```text
validate directory context
check README generated block drift
validate navigation indexes
```

---

# D.13 Final Operating Model

The final documentation governance flow is:

```text
docs/unified-architecture-spec.md
  ↓
global architecture specification

foundation.yaml / module-manifest.yaml / directory-context.yaml
  ↓
machine-readable facts

navigation/
  ↓
global AI and human discovery indexes

README.md
  ↓
human and AI navigation

generator + CI
  ↓
synchronization and drift prevention
```

Final rule:

```text
README writes navigation, not authority.
YAML writes facts, not duplicated prose.
navigation indexes discovery, not runtime ownership.
Generator writes repeated summaries.
CI prevents drift.
```

---

# D.14 Compliance Criteria

This specification is implemented when:

1. Global principles are written once at L0.
2. Local README files do not duplicate global platform rules.
3. `directory-context.yaml` exists for high-value directories.
4. README files reference authoritative files.
5. README generated block markers are standardized.
6. README generated blocks are generated from machine-readable metadata.
7. A generator exists for README generated context.
8. The generator supports check mode.
9. CI validates directory context.
10. CI checks README drift.
11. CI validates navigation index references.
12. `contracts/INDEX.yaml` exists or is planned.
13. `foundation/maps/` exists or is planned.
14. `navigation/` indexes exist or are planned.
15. Local README files remain short and local.
16. README files are not treated as authoritative governance sources.

When all criteria are met, the repository has a scalable README context system suitable for `242-plus` root-directory AI navigation without excessive maintenance cost.
