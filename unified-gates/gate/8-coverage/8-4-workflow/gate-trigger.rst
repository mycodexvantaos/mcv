.. path: unified-gates/gate/8-coverage/8-4-workflow/gate-trigger.rst
.. governanceCode: mycodexvantaos-00000

================
Trigger Coverage
================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Trigger coverage measures the percentage of defined workflow trigger conditions
(push events, pull request events, schedule events, manual triggers) that are
exercised in the test environment. A trigger is considered covered if it
successfully initiates the workflow at least once during a test cycle.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Trigger Type
     - Minimum Coverage
     - Enforcement
   * - Push to main/develop
     - 100%
     - MUST
   * - Pull request to main
     - 100%
     - MUST
   * - Manual trigger
     - 100%
     - MUST
   * - Scheduled trigger
     - 100%
     - SHOULD

Gate Failure Conditions
-----------------------

Any defined trigger that has never been exercised in the current release cycle
MUST cause a ``WARN`` result. Untested push and pull-request triggers MUST
cause a ``FAIL`` result with ``criticality: high``.

Measurement
-----------

Trigger coverage is tracked by the CI orchestration layer. Each trigger event
MUST be logged with a timestamp, trigger type, and resulting workflow run ID.
