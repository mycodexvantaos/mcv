.. path: unified-gates/gate/5-governance/gate-cost.rst
.. governanceCode: mycodexvantaos-00000

=========
Gate Cost
=========

:Version: 1.0.0
:Status: informative

Cost Model
----------

Gate evaluation incurs compute costs in the CI pipeline. Cost governance
ensures that gate evaluation overhead remains within acceptable bounds.

Cost Attribution
----------------

Gate evaluation costs are attributed to the repository and team that triggered
the pipeline run. Cost attribution metadata is included in every gate result
and aggregated in ``outputs/unified-gate-summary.json``.

Cost Optimization Targets
--------------------------

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Target
     - Description
   * - Gate evaluation cost per run < $0.10
     - Total compute cost for all gates in a single pipeline run.
   * - Parallel gate execution where possible
     - Gates without ``dependsOn`` relationships SHOULD be evaluated in parallel.
   * - Gate result caching
     - Unchanged artifacts MAY reuse cached gate results within a 24-hour window.

Cost Policy
-----------

Cost governance policies are defined in ``policies/gate-cost-policy.yaml``.
Cost reports are included in ``outputs/unified-gate-summary.json``.
