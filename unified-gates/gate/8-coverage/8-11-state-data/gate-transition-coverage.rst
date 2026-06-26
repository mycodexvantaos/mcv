.. path: unified-gates/gate/8-coverage/8-11-state-data/gate-transition-coverage.rst
.. governanceCode: mycodexvantaos-00000

====================
Transition Coverage
====================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Transition coverage measures the percentage of defined state transitions in
the lifecycle state machine (from ``gate/2-lifecycle/gate-states.rst``) that
have been exercised in the test suite. A transition is considered covered if
it has been triggered at least once and the resulting state has been verified.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Transition Category
     - Minimum Coverage
     - Enforcement
   * - Valid transitions
     - 100%
     - MUST
   * - Invalid transitions (guard conditions)
     - 100%
     - MUST
   * - Terminal state transitions
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any valid lifecycle transition that has not been exercised in the test suite
MUST cause a ``FAIL`` result with ``criticality: high``. Invalid transitions
MUST also be tested to verify that guard conditions correctly reject them.
