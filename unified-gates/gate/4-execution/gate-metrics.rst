.. path: unified-gates/gate/4-execution/gate-metrics.rst
.. governanceCode: mycodexvantaos-00000

============
Gate Metrics
============

:Version: 1.0.0
:Status: normative

Gate Health Metrics
-------------------

The gate system MUST produce the following metrics for each gate and pipeline run:

.. list-table::
   :header-rows: 1
   :widths: 35 65

   * - Metric
     - Definition
   * - ``gate_pass_rate``
     - Percentage of gate evaluations that result in PASS over a rolling 7-day window.
   * - ``gate_fail_rate``
     - Percentage of gate evaluations that result in FAIL over a rolling 7-day window.
   * - ``gate_evaluation_latency_p50``
     - Median gate evaluation latency in milliseconds.
   * - ``gate_evaluation_latency_p99``
     - 99th percentile gate evaluation latency in milliseconds.
   * - ``gate_waiver_count``
     - Number of active waivers per gate.
   * - ``gate_evidence_chain_integrity``
     - Percentage of evidence records with valid hash chains. Target: 100%.
   * - ``pipeline_block_rate``
     - Percentage of pipeline runs blocked by gate failures.
   * - ``gate_slo_compliance``
     - Percentage of gate evaluations completing within ``sloTarget``. Target: >99%.

SLO Targets
-----------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Metric
     - Target
   * - ``gate_pass_rate``
     - >95% for ``active`` gates
   * - ``gate_evaluation_latency_p99``
     - <60 seconds per gate
   * - ``gate_evidence_chain_integrity``
     - 100%
   * - ``gate_slo_compliance``
     - >99%
