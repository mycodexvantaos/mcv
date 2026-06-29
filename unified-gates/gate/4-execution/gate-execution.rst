.. path: unified-gates/gate/4-execution/gate-execution.rst
.. governanceCode: mycodexvantaos-00000

==============
Gate Execution
==============

:Version: 1.0.0
:Status: normative

Execution Model
---------------

Gate execution is the process by which the gate framework evaluates a gate
definition against a target artifact or infrastructure component. Execution
is always triggered by a CI pipeline run and MUST be reproducible.

Execution Steps
---------------

1. **Load**: Read gate YAML from ``ai-infra-gates/lNN/gate-NN-*.yaml``. Validate against schema.
2. **Resolve dependencies**: Confirm all ``dependsOn`` gates have ``PASS`` results.
3. **Execute dimensions**: For each dimension, execute all checks in declaration order.
4. **Aggregate results**: Compute overall gate result from dimension results.
5. **Emit evidence**: Write SHA-256/SHA3-512/BLAKE3 evidence record to audit store.
6. **Emit event**: Publish ``gate-evaluated`` event to ``mycodexvantaos-event-bus``.
7. **Report**: Write result to ``outputs/gate-validation-report.json``.

Execution Guarantees
--------------------

- Execution is **idempotent**: re-running with the same inputs produces the same result.
- Execution is **isolated**: gates MUST NOT modify the artifact under evaluation.
- Execution is **time-bounded**: each gate has an ``sloTarget`` (default: 30 seconds).
- Execution is **auditable**: every execution produces an immutable evidence record.
