.. path: unified-gates/gate/8-coverage/8-10-change/gate-changetype-coverage.rst
.. governanceCode: mycodexvantaos-00000

======================
Change Type Coverage
======================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Change type coverage measures the percentage of defined change categories
(feature, bugfix, refactor, dependency-update, configuration, documentation)
that have been exercised in the test suite. A change type is considered covered
if at least one test case explicitly validates behavior for that change category.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Change Type
     - Minimum Coverage
     - Enforcement
   * - feature
     - 100%
     - MUST
   * - bugfix
     - 100%
     - MUST
   * - refactor
     - 80%
     - SHOULD
   * - dependency-update
     - 100%
     - MUST
   * - configuration
     - 100%
     - MUST
   * - documentation
     - 50%
     - MAY

Gate Failure Conditions
-----------------------

Uncovered ``feature`` or ``bugfix`` change types MUST cause a ``FAIL`` result
with ``criticality: critical``. Uncovered ``dependency-update`` or
``configuration`` changes MUST cause a ``FAIL`` with ``criticality: high``.
