.. path: unified-gates/gate/5-governance/gate-waiver.rst
.. governanceCode: mycodexvantaos-00000

===========
Gate Waiver
===========

:Version: 1.0.0
:Status: normative

Waiver Model
------------

A waiver is a time-limited, approved exception that allows an artifact to advance
past a failing gate. Waivers MUST NOT be used to permanently bypass gate requirements.

Waiver Schema
~~~~~~~~~~~~~

.. code-block:: yaml

   apiVersion: mycodexvantaos.io/v1
   kind: GateWaiver
   metadata:
     id: waiver-<UUID>
     gateId: <gate-id>
     artifactRef: <URN or repository name>
     requestedBy: <principal URN>
     approvedBy: <principal URN>
     approvedAt: <ISO 8601 UTC>
     expiresAt: <ISO 8601 UTC>
     maxDurationDays: 30
   spec:
     justification: >
       Detailed justification for the waiver request.
     remediationPlan: >
       Plan to remediate the gate failure before waiver expiry.
     riskAcknowledgement: true
     reviewedRisks:
       - <risk description>

Waiver Rules
------------

1. Waivers MUST be approved by the gate owner and the governance authority for the gate's layer.
2. Waivers for ``critical`` gates MUST be approved by the platform governance council.
3. Maximum waiver duration is 30 calendar days. No automatic renewal.
4. Expired waivers MUST NOT be treated as valid. The gate failure MUST be remediated or a new waiver requested.
5. Waivers MUST be recorded in ``outputs/gate-waiver-report.json``.
