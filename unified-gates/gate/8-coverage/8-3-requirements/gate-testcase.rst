.. path: unified-gates/gate/8-coverage/8-3-requirements/gate-testcase.rst
.. governanceCode: mycodexvantaos-00000

=================
Test Case Coverage
=================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Test case coverage measures the percentage of defined test cases in the test
registry that have been executed and have a recorded result in the current
release cycle. A test case is considered covered if it has been executed at
least once and its result (PASS, FAIL, SKIP) has been recorded.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Test Case Type
     - Minimum Execution Rate
     - Enforcement
   * - Unit tests
     - 100%
     - MUST
   * - Integration tests
     - 100%
     - MUST
   * - End-to-end tests
     - 95%
     - SHOULD
   * - Performance tests
     - 90%
     - SHOULD

Gate Failure Conditions
-----------------------

Any unit or integration test case that has not been executed in the current
release cycle MUST cause a ``FAIL`` result with ``criticality: high``.
