.. path: unified-gates/gate/8-coverage/8-4-workflow/gate-workflow-path.rst
.. governanceCode: mycodexvantaos-00000

===================
Workflow Path Coverage
===================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Workflow path coverage measures the percentage of distinct execution paths
through a workflow (CI pipeline, automation workflow, gate evaluation workflow)
that are exercised in the test environment. A path is defined as a unique
sequence of steps from workflow start to workflow end.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Workflow Type
     - Minimum Path Coverage
     - Enforcement
   * - Gate evaluation workflow
     - 100% (happy path + all failure paths)
     - MUST
   * - Release workflow
     - 100% (happy path + rollback path)
     - MUST
   * - Waiver workflow
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any workflow path that has not been exercised in the test suite MUST cause a
``FAIL`` result with ``criticality: high``. The failure path (gate FAIL →
pipeline halt → notification) MUST be explicitly tested.
