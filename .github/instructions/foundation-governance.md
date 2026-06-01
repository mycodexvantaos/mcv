## Foundation Directory Governance Instructions

This document provides modular instructions for managing the `foundation/` directory, which serves as the strategic specification center for **MyCodexVantaOS**.

### 1. Directory Role (A.3)

The `foundation/` directory is exclusively for:
- Strategic specifications and capability maps.
- Maturity models and commercial models.
- Reference architectures and product boundaries.

**Prohibited Content**: Runtime source code, service implementations, Dockerfiles, and deployment manifests are strictly forbidden in foundation subdirectories.

### 2. Structure and Manifests

- **Root Contract**: `foundation/mycodexvantaos-module.yaml` is the ONLY root module contract allowed in this directory.
- **Specification Units**: Each of the seven subdirectories (e.g., `compute-foundation/`, `agent-foundation/`) must contain a `foundation.yaml` file.
- **Required Files**: Every unit must include `README.md`, `capability-map.yaml`, `service-map.yaml`, `urn-map.yaml`, and `roadmap.yaml`.

### 3. Boundary Definitions

Each `foundation.yaml` must explicitly declare its boundary as a `specification-unit` under the parent `foundation` module. It must specify that `runtimeCodeAllowed: false` and `serviceCodeAllowed: false`.

### 4. Seven Platform Foundations

1. **Compute**: Resource and runtime strategy.
2. **Data**: Data governance and storage strategy.
3. **Algorithm**: AI and processing strategy.
4. **Agent**: Autonomous agent and orchestration strategy.
5. **Contract**: Interface and protocol strategy.
6. **Governance**: Policy and compliance strategy.
7. **Business**: Commercial and product boundary strategy.

Agents must refer to these foundation specs when planning new capabilities to ensure architectural alignment.
