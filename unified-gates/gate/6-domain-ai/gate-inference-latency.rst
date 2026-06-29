.. path: unified-gates/gate/6-domain-ai/gate-inference-latency.rst
.. governanceCode: mycodexvantaos-60700

========================
Gate Inference Latency
========================

:Version: 1.0.0
:Status: normative

Overview
--------

The inference latency gate validates that model inference meets the latency
SLO defined in the workload contract before production deployment.

Latency Dimensions
------------------

**Time to First Token (TTFT)**: For streaming inference, TTFT p99 MUST be
below the threshold defined in the workload SLO.

**Total Generation Latency**: End-to-end generation latency p99 MUST be
below the threshold defined in the workload SLO.

**Throughput**: Requests per second at the defined concurrency level MUST
meet the throughput target.

**Cold Start Latency**: For serverless inference, cold start latency MUST
be below the defined threshold.

Default SLO Targets
-------------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Metric
     - Default Target
     - Override Via
   * - TTFT p99
     - < 500ms
     - workload SLO contract
   * - Total latency p99
     - < 10s
     - workload SLO contract
   * - Throughput
     - > 10 req/s
     - workload SLO contract

Gate Reference
--------------

Implemented by: ``gate-47-workload-slo-validation`` (l40)
