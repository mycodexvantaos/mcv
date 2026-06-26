.. path: unified-gates/gate/8-coverage/8-7-observability/gate-alert-coverage.rst
.. governanceCode: mycodexvantaos-00000

===============
Alert Coverage
===============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Alert coverage measures the percentage of defined alert rules (from
``gate/4-execution/gate-alerting.rst``) that have been triggered and validated
in the test environment. An alert rule is considered covered if it has been
triggered at least once and the notification delivery has been verified.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Alert Severity
     - Minimum Coverage
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

Any P1 or P2 alert rule that has not been validated in the test environment
MUST cause a ``FAIL`` result with ``criticality: high``. Alert notification
delivery MUST be verified end-to-end.
