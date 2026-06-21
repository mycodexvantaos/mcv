## Binding-Mediator and Dependency Governance Instructions

This document provides modular instructions for managing service dependencies and logical bindings within **MyCodexVantaOS**.

### 1. Dependency Invariants

- **No Hard Cycles**: The system dependency graph MUST be a Directed Acyclic Graph (DAG).
- **Mediated Relationships**: All cross-service relationships must be mediated by a contract, event, or port.
- **Plane Isolation**: Control Plane MUST NOT hard-depend on Product Plane runtimes.

### 2. Implementing Bindings

When connecting two services (e.g., `service-a` and `service-b`):

1. Declare the relationship in `service-a/directory-context.yaml`.
2. Create a binding manifest in `navigation/bindings/service-a-service-b-binding.yaml`.
3. Define the mediator (e.g., `contracts/events/shared-event.yaml`).
4. Update the `navigation/dependency-graph.yaml`.

### 3. Using Mediators

Choose the appropriate mediator type:

- **Contract**: For synchronous API calls.
- **Event**: For asynchronous, decoupled communication.
- **Port**: For platform-neutral interface abstractions.
- **Catalog**: For discovery and late-binding resolution.

### 4. CI Validation (J.1.6)

- **Binding Guard**: Run `validate-directory-bindings` to ensure all relationships are properly declared and mediated.
- **Graph Guard**: Run `validate-dependency-graph` to check for cycles.
- **Closure Prover**: Run `validate-closure` to verify the end-to-end governance chain.

### 5. Remediation

- **Cycle Detected**: Identify the "back-edge" and introduce a mediator (e.g., an event bus or a shared contract) to break the direct dependency.
- **Missing Binding**: Create the required `*.binding.yaml` file in `navigation/bindings/`.

Agents must refer to these instructions when modifying service relationships or adding new modules.
