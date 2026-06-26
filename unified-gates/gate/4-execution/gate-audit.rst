.. path: unified-gates/gate/4-execution/gate-audit.rst
.. governanceCode: mycodexvantaos-00700

==========
Gate Audit
==========

:Version: 1.0.0
:Status: normative

Audit Requirements
------------------

Every gate evaluation MUST produce an immutable audit record. The audit record
is the cryptographic proof that a gate was evaluated, by whom, against which
artifact, and with what result.

Audit Record Schema
-------------------

.. code-block:: yaml

   auditRecord:
     recordId: <UUID v4>
     gateId: <gate-id>
     gateVersion: <semver>
     pipelineRunId: <UUID v4>
     artifactRef: <URN or path>
     artifactSha256: <hex>
     evaluatedAt: <ISO 8601 UTC>
     evaluatedBy: <principal URN>
     result: PASS | FAIL | WARN | SKIP | ERROR
     dimensions: [...]
     evidence:
       sha256: <hex>
       sha3512: <hex>
       blake3: <hex>
     waiverRef: <waiver ID or null>
     previousRecordHash: <SHA-256 of previous record for chain integrity>

Audit Chain Integrity
---------------------

Audit records are chained via ``previousRecordHash``. The chain integrity is
validated by ``gate-95-audit-evidence-chain-validation`` at the ``l90`` layer.
Any gap or hash mismatch in the chain MUST be treated as a ``FAIL`` with
``criticality: critical``.

Audit Retention
---------------

Audit records MUST be retained for the period defined by the gate's criticality
level (see evidence retention policy in ``gate-catalog.yaml``). Audit records
for ``critical`` gates MUST be retained for a minimum of 2555 days (7 years).
