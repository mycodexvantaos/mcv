.. path: unified-gates/gate/5-governance/gate-escalation.rst
.. governanceCode: mycodexvantaos-00000

================
Gate Escalation
================

:Version: 1.0.0
:Status: normative

Escalation Triggers
-------------------

Gate failures MUST be escalated when:

- A P1-Critical failure is not remediated within 1 hour.
- A P2-High failure is not remediated within 24 hours.
- A waiver request for a ``critical`` gate is pending for more than 4 hours.
- The audit evidence chain integrity drops below 100%.
- A gate owner is unresponsive to a P1 alert for more than 30 minutes.

Escalation Path
---------------

.. code-block:: text

   Gate Owner (immediate)
         │
         ▼ (unresolved after SLO window)
   Architecture Governance Owner
         │
         ▼ (unresolved after 2x SLO window)
   Platform Governance Council
         │
         ▼ (unresolved after 4x SLO window)
   Platform Governance Root Authority

Escalation Record
-----------------

All escalations MUST be recorded in the platform audit log with:
- Escalation trigger and timestamp
- Escalation path taken
- Resolution timestamp and action taken
- Post-incident review reference (for P1 escalations)
