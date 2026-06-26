.. path: unified-gates/gate/8-coverage/8-7-observability/gate-dashboard-coverage.rst
.. governanceCode: mycodexvantaos-00000

====================
Dashboard Coverage
====================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Dashboard coverage measures the percentage of defined observability dashboards
that are populated with real data and have been validated. A dashboard is
considered covered if all its panels display valid data and no panel shows
an error state during a test run.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Dashboard Type
     - Minimum Coverage
     - Enforcement
   * - Gate health dashboards
     - 100%
     - MUST
   * - Pipeline performance dashboards
     - 100%
     - MUST
   * - Evidence chain dashboards
     - 100%
     - MUST
   * - Cost attribution dashboards
     - 90%
     - SHOULD

Gate Failure Conditions
-----------------------

Any gate health or pipeline performance dashboard with empty or error panels
MUST cause a ``FAIL`` result with ``criticality: high``.
