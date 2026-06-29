.. path: unified-gates/gate/8-coverage/8-3-requirements/gate-testdata.rst
.. governanceCode: mycodexvantaos-00000

==================
Test Data Coverage
==================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Test data coverage measures the percentage of defined test data categories
(boundary values, equivalence classes, negative cases, edge cases) that are
represented in the test suite. A test data category is considered covered if
at least one test case uses data from that category.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Test Data Category
     - Minimum Coverage
     - Enforcement
   * - Boundary values
     - 100%
     - MUST
   * - Equivalence classes
     - 100%
     - MUST
   * - Negative / invalid inputs
     - 100%
     - MUST
   * - Edge cases
     - 80%
     - SHOULD

Gate Failure Conditions
-----------------------

Missing boundary value or negative input test data MUST cause a ``FAIL`` result
with ``criticality: high``. All test data MUST be version-controlled and
immutable once used in a gate evaluation.
