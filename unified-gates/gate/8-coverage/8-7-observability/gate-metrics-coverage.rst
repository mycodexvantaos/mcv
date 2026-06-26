.. path: unified-gates/gate/8-coverage/8-7-observability/gate-metrics-coverage.rst
.. governanceCode: mycodexvantaos-00000

================
Metrics Coverage
================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Metrics coverage measures the percentage of defined platform metrics (from
``gate/4-execution/gate-metrics.rst``) that are emitted and validated in tests.
A metric is considered covered if it is emitted at least once and its value
falls within the expected range during a test run.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Metric Category
     - Minimum Coverage
     - Enforcement
   * - Gate health metrics
     - 100%
     - MUST
   * - Evidence chain metrics
     - 100%
     - MUST
   * - Pipeline latency metrics
     - 100%
     - MUST
   * - Waiver expiry metrics
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any gate health metric that is not emitted during a pipeline run MUST cause
a ``FAIL`` result with ``criticality: critical``. Missing latency metrics
MUST cause a ``FAIL`` with ``criticality: high``.

Measurement
-----------

Metrics coverage is measured by the observability agent. Each metric emission
MUST be recorded in the gate evidence record with the metric name, value,
timestamp, and validation status.
