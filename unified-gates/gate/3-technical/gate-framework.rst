.. path: unified-gates/gate/3-technical/gate-framework.rst
.. governanceCode: mycodexvantaos-00000

==============
Gate Framework
==============

:Version: 1.0.0
:Status: normative

Overview
--------

The gate framework defines the runtime execution model for all gates in the
MyCodexVantaOS unified gate system. It specifies how gate definitions are loaded,
how checks are executed, how results are collected, and how evidence is emitted.

Framework Components
--------------------

**Gate Loader**
  Reads gate YAML definitions from ``ai-infra-gates/`` and validates them against
  ``schemas/ai-infra-gate.schema.json``. Rejects malformed definitions before execution.

**Check Executor**
  Executes each check within a validation dimension. Checks are executed in declaration
  order. Critical check failures short-circuit the dimension.

**Evidence Emitter**
  Produces cryptographically-hashed evidence records (SHA-256, SHA3-512, BLAKE3)
  after each gate evaluation. Evidence is written to the append-only audit store.

**Result Aggregator**
  Collects dimension results and computes the overall gate result. Emits the
  ``gate-evaluated`` governance event to the platform event bus.

**Pipeline Orchestrator**
  Manages layer-ordered gate execution. Halts pipeline on blocking failures.
  Produces the unified gate summary report.

Framework Invariants
--------------------

1. Gate definitions are immutable during a pipeline run.
2. Evidence records are written before the pipeline result is reported.
3. The framework MUST NOT modify the artifact under evaluation.
4. Framework errors MUST produce ``ERROR`` gate results, not silent failures.
5. All framework operations MUST be idempotent for retry safety.
