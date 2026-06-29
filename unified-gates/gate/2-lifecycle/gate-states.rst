.. path: unified-gates/gate/2-lifecycle/gate-states.rst
.. governanceCode: mycodexvantaos-00200

===========
Gate States
===========

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Evaluation State Machine
------------------------

Each gate evaluation produces a result state. The evaluation state machine is
independent of the gate lifecycle state. A gate in ``active`` lifecycle may
produce any evaluation result.

Evaluation States
~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 10 90

   * - State
     - Meaning
   * - ``PASS``
     - All validation dimensions and checks passed. Artifact may advance.
   * - ``FAIL``
     - One or more validation dimensions failed. Artifact MUST NOT advance if gate is ``blocking: true``.
   * - ``WARN``
     - One or more checks produced warnings (``medium`` or ``low`` severity). Artifact MAY advance.
   * - ``SKIP``
     - Gate evaluation was skipped due to a valid waiver, lifecycle stage, or explicit exclusion.
   * - ``ERROR``
     - Gate evaluation could not complete due to an infrastructure or configuration error. Treated as ``FAIL``.

State Transition Diagram
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: text

   [Artifact submitted]
          │
          ▼
   [Gate evaluation starts]
          │
          ├─── All checks pass ──────────────────────────────► PASS
          │
          ├─── Critical/high check fails ──────────────────► FAIL
          │         │
          │         └─── blocking: true ─────────────────► Pipeline halts
          │
          ├─── Medium/low check fails ──────────────────── WARN
          │         │
          │         └─── --strict mode active ──────────► FAIL
          │
          ├─── Valid waiver exists ─────────────────────── SKIP
          │
          └─── Infrastructure error ────────────────────── ERROR ──► FAIL

Gate Result Immutability
------------------------

Once a gate result is recorded, it MUST NOT be modified. If a re-evaluation is
required (e.g., after a fix), a new evaluation record MUST be created with a new
timestamp. The original ``FAIL`` record MUST be retained for audit purposes.

Aggregate Pipeline State
------------------------

The aggregate state of a pipeline run is determined as follows:

- If any gate in ``l00`` fails with ``blocking: true``: pipeline state is ``BLOCKED``.
- If all gates pass: pipeline state is ``READY``.
- If any gate produces ``WARN`` and no gate fails: pipeline state is ``READY-WITH-WARNINGS``.
- If any gate is ``SKIP``: pipeline state includes ``WAIVED`` annotation.
