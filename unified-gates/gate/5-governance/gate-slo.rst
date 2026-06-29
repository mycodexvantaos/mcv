.. path: unified-gates/gate/5-governance/gate-slo.rst
.. governanceCode: mycodexvantaos-00000

========
Gate SLO
========

:Version: 1.0.0
:Status: normative

Service Level Objectives
------------------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - SLO
     - Target
     - Measurement Window
   * - Gate evaluation latency (p99)
     - < 60 seconds
     - Rolling 7 days
   * - Gate pass rate (active gates)
     - > 95%
     - Rolling 7 days
   * - Evidence chain integrity
     - 100%
     - Continuous
   * - Waiver expiry alert lead time
     - ≥ 7 days
     - Per waiver
   * - P1 escalation response time
     - < 1 hour
     - Per incident
   * - Catalog completeness
     - 100%
     - Per pipeline run
   * - Owner registry completeness
     - 100%
     - Per pipeline run

SLO Breach Response
-------------------

SLO breaches MUST be recorded as governance events and reviewed in the weekly
governance council meeting. Repeated SLO breaches (3+ consecutive weeks) for
the same gate MUST trigger a gate review and potential redesign.
