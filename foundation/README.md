# Foundation

The `foundation/` directory is the strategic specification center for the seven platform foundations of MyCodexVantaOS.

## Purpose

Foundation directories define:

- Strategic capability boundaries
- Product boundaries
- Capability maps
- Commercial models
- Maturity models
- Cross-module mappings

## What Foundation Is NOT

- NOT a service directory
- NOT a runtime implementation directory
- NOT a provider implementation directory
- NOT a source-code root
- NOT a deployment manifest directory

## Seven Foundation Specification Units

| Foundation | Alignment |
|---|---|
| `compute-foundation` | Deployment Layer, Runtime, Kubernetes, OCI, Compute Resource |
| `data-foundation` | Provider capability: database, storage, vector-store, graph, search |
| `algorithm-foundation` | Provider capability: llm, embedding, model-provider, evaluation |
| `agent-foundation` | Service Layer, workflow, scheduler, agent, automation |
| `contract-foundation` | Manifest, Schema, URN, Service Catalog, Naming Closure |
| `governance-foundation` | CI Gate, Exception, Audit, Policy, Supply Chain |
| `business-foundation` | Billing, Usage Metering, Marketplace, Workspace, Quota |

## Prohibited Content

Foundation subdirectories MUST NOT contain:

- Runtime source code
- Service implementation
- Provider implementation
- Dockerfile
- Package manager lockfile
- Deployment manifests
- Kubernetes runtime manifests
- Application source code

## Foundation-to-Service Relationship

```text
foundation/<foundation>/service-map.yaml
  ↓
platform/service-catalog.yaml
  ↓
modules/<service-id>/module-manifest.yaml
  ↓
services/<service-id>/
```
