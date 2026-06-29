.. path: unified-gates/gate/8-coverage/8-7-observability/gate-logging-coverage.rst
.. governanceCode: mycodexvantaos-00000

================
Logging Coverage
================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Logging coverage measures the percentage of defined log events (from
``gate/4-execution/gate-audit.rst``) that are emitted and validated in the
test environment. A log event is considered covered if it is emitted at least
once and its format, severity, and content are verified.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Log Event Category
     - Minimum Coverage
     - Enforcement
   * - Gate evaluation events
     - 100%
     - MUST
   * - Evidence chain events
     - 100%
     - MUST
   * - Waiver events
     - 100%
     - MUST
   * - Lifecycle transition events
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any required log event that is not emitted during a gate evaluation MUST cause
a ``FAIL`` result with ``criticality: high``. Log format violations MUST cause
a ``FAIL`` with ``criticality: medium``.
