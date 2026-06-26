.. path: unified-gates/gate/8-coverage/8-11-state-data/gate-partition-coverage.rst
.. governanceCode: mycodexvantaos-00000

===================
Partition Coverage
===================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Partition coverage (equivalence partitioning) measures the percentage of
defined input equivalence classes that are represented in the test suite.
A partition is considered covered if at least one test case uses an input
value from that partition and validates the expected output.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Partition Category
     - Minimum Coverage
     - Enforcement
   * - Valid input partitions
     - 100%
     - MUST
   * - Invalid input partitions
     - 100%
     - MUST
   * - Boundary partitions
     - 100%
     - MUST
   * - Edge case partitions
     - 80%
     - SHOULD

Gate Failure Conditions
-----------------------

Any valid or invalid input partition without a corresponding test case MUST
cause a ``FAIL`` result with ``criticality: high``.
