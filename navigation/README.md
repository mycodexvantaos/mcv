# Navigation

The `navigation/` directory is the global AI and human navigation index root for MyCodexVantaOS.

## Purpose

Navigation indexes provide:

- **Discovery**: AI agents and human operators can discover all platform modules, services, and providers.
- **Reasoning**: Dependency graphs and binding indexes enable automated reasoning about platform topology.
- **Governance**: Navigation indexes are governance artifacts that enforce architectural constraints.

## Key Indexes

| File | Description |
|---|---|
| `directory-index.yaml` | Index of all root directories |
| `module-index.yaml` | Index of all root modules |
| `dependency-graph.yaml` | Computed dependency topology |
| `binding-index.yaml` | Service-to-provider binding index |
| `service-navigation-map.yaml` | Service navigation map |
| `provider-navigation-map.yaml` | Provider navigation map |
| `foundation-navigation-map.yaml` | Foundation navigation map |
| `gate-navigation-map.yaml` | Gate navigation map |
| `namespace-navigation-map.yaml` | Namespace navigation map |

## Rules

- Navigation indexes MUST NOT create hard runtime dependencies.
- Navigation indexes represent governance, discovery, and reasoning indexes.
- Hard dependency graphs MUST be acyclic.
- Bidirectional logical relations MUST use approved mediator artifacts.

## Subdirectories

| Directory | Description |
|---|---|
| `maps/` | Detailed navigation maps |
| `graphs/` | Dependency and relationship graphs |
| `schemas/` | JSON Schema validation for navigation artifacts |
| `outputs/` | Generated navigation reports (derived, not SSOT) |
