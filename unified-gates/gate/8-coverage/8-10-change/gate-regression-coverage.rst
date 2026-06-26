.. path: unified-gates/gate/8-coverage/8-10-change/gate-regression-coverage.rst
.. governanceCode: mycodexvantaos-00000

====================
Regression Coverage
====================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Regression coverage measures the percentage of previously reported defects and
incidents that have corresponding regression test cases. A defect is considered
covered if a test case exists that would have detected the defect before it
reached production.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Defect Severity
     - Minimum Regression Coverage
     - Enforcement
   * - P1 (Critical)
     - 100%
     - MUST
   * - P2 (High)
     - 100%
     - MUST
   * - P3 (Medium)
     - 80%
     - SHOULD
   * - P4 (Low)
     - 50%
     - MAY

Gate Failure Conditions
-----------------------

Any P1 or P2 defect without a regression test case MUST cause a ``FAIL`` result
with ``criticality: critical``. The regression test case MUST be authored within
5 business days of the defect being resolved.
