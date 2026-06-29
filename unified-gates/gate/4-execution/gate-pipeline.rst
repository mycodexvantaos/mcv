.. path: unified-gates/gate/4-execution/gate-pipeline.rst
.. governanceCode: mycodexvantaos-00000

=============
Gate Pipeline
=============

:Version: 1.0.0
:Status: normative

Pipeline Architecture
---------------------

The gate pipeline is the ordered sequence of gate evaluations that an artifact
must pass before it can be promoted to the next lifecycle stage. The pipeline
is defined in ``workflows/gate-evaluation-workflow.yaml``.

Pipeline Stages
---------------

.. code-block:: text

   [Artifact submitted]
         │
         ▼
   [l00: Meta-governance gates]  ← MUST all pass before proceeding
         │
         ▼
   [l10: AI Compute gates]
         │
         ▼
   [l20: Data & Vector gates]
         │
         ▼
   [l30: AI Framework & Model gates]
         │
         ▼
   [l40: Workload Execution gates]
         │
         ▼
   [l50: Billing & Metering gates]
         │
         ▼
   [l60: Cloud Infrastructure gates]
         │
         ▼
   [l90: Supply Chain & Production gates]
         │
         ▼
   [Pipeline result: READY | BLOCKED | READY-WITH-WARNINGS]

Pipeline Invariants
-------------------

1. Layer ``l00`` gates MUST all pass before any other layer is evaluated.
2. A blocking failure in any layer halts the pipeline immediately.
3. Pipeline results are immutable once recorded.
4. Pipeline runs MUST be uniquely identified by a run ID (UUID v4).
