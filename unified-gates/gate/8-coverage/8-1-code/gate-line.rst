.. path: unified-gates/gate/8-coverage/8-1-code/gate-line.rst
.. governanceCode: mycodexvantaos-10100

================
Line Coverage
================

:Version: 1.0.0
:Status: normative

Definition
----------

Line coverage measures the percentage of executable source code lines that are
executed by the test suite. A line is considered covered if it is executed at
least once during a test run.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Namespace
     - Minimum Line Coverage
   * - ``mycodexvantaos`` (control-plane)
     - 85%
   * - ``softwareos`` (product-plane)
     - 80%
   * - ``critical`` governance code range (00000–09999)
     - 95%

Gate Failure Conditions
-----------------------

Line coverage below the defined threshold MUST cause the quality gate to fail
with ``criticality: high`` and ``blocking: true``.
