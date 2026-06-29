.. path: unified-gates/gate/8-coverage/8-11-state-data/gate-state-coverage.rst
.. governanceCode: mycodexvantaos-00000

==============
State Coverage
==============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

State coverage measures the percentage of defined system states (lifecycle
states, gate states, service states) that are exercised in the test suite.
A state is considered covered if at least one test case exercises the system
while it is in that state and validates the expected behavior.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - State Category
     - Minimum Coverage
     - Enforcement
   * - Gate lifecycle states
     - 100%
     - MUST
   * - Namespace lifecycle states
     - 100%
     - MUST
   * - Service operational states
     - 90%
     - SHOULD

Gate Failure Conditions
-----------------------

Any gate or namespace lifecycle state that is not exercised in the test suite
MUST cause a ``FAIL`` result with ``criticality: high``. The ``destroyed`` state
MUST be tested to verify that it is a terminal state with no valid outgoing
transitions.
