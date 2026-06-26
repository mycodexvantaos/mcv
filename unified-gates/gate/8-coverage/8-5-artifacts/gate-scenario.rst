.. path: unified-gates/gate/8-coverage/8-5-artifacts/gate-scenario.rst
.. governanceCode: mycodexvantaos-00000

=================
Scenario Coverage
=================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Scenario coverage measures the percentage of defined end-to-end scenarios
(BDD scenarios, integration test scenarios, chaos engineering scenarios) that
have been executed and validated. A scenario is considered covered if all its
steps have been executed and the expected outcome has been verified.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Scenario Type
     - Minimum Coverage
     - Enforcement
   * - Happy path scenarios
     - 100%
     - MUST
   * - Failure scenarios
     - 100%
     - MUST
   * - Chaos engineering scenarios
     - 80%
     - SHOULD
   * - Performance scenarios
     - 90%
     - SHOULD

Gate Failure Conditions
-----------------------

Any happy path or failure scenario that has not been executed MUST cause a
``FAIL`` result with ``criticality: high``.
