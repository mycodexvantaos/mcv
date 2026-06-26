.. path: unified-gates/gate/4-execution/gate-alerting.rst
.. governanceCode: mycodexvantaos-00000

==============
Gate Alerting
==============

:Version: 1.0.0
:Status: normative

Alert Conditions
----------------

The gate system MUST emit alerts for the following conditions:

.. list-table::
   :header-rows: 1
   :widths: 40 20 40

   * - Condition
     - Severity
     - Action
   * - Critical gate failure
     - P1
     - Immediate notification to gate owner and on-call engineer
   * - Evidence chain integrity violation
     - P1
     - Immediate notification to platform security team
   * - Gate evaluation latency exceeds 2x sloTarget
     - P2
     - Notification to gate owner
   * - Waiver expiry within 7 days
     - P2
     - Notification to waiver approver and gate owner
   * - Gate owner registry gap (gate without owner)
     - P2
     - Notification to platform governance council
   * - Catalog drift detected (gate in catalog but definition missing)
     - P3
     - Notification to gate owner

Alert Routing
-------------

All gate alerts are routed through ``mycodexvantaos-alertd-service`` using the
contract defined in ``contracts/gate-evidence.yaml``. Alert routing policies
are defined in ``policies/gate-governance-policy.yaml``.
