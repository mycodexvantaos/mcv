.. path: unified-gates/gate/8-coverage/8-4-workflow/gate-step.rst
.. governanceCode: mycodexvantaos-00000

=============
Step Coverage
=============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Step coverage measures the percentage of workflow steps (CI pipeline steps,
automation task steps, gate evaluation steps) that are executed and validated
in the test environment. A step is considered covered if it is invoked at least
once during a test run and its output is verified.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Scope
     - Minimum Step Coverage
     - Enforcement
   * - Gate evaluation workflow steps
     - 100%
     - MUST
   * - CI pipeline steps
     - 100%
     - MUST
   * - Automation task steps
     - 90%
     - SHOULD

Gate Failure Conditions
-----------------------

Step coverage below the defined threshold MUST cause the quality gate to fail
with ``criticality: high`` and ``blocking: true``. Uncovered steps in the gate
evaluation workflow are treated as ``criticality: critical``.

Measurement
-----------

Step coverage is measured by the CI orchestration layer. Each step MUST emit
a ``step-executed`` event with a result of ``PASS``, ``FAIL``, or ``SKIP``.
Steps that are never executed are counted as uncovered.
