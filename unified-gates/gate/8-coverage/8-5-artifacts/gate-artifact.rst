.. path: unified-gates/gate/8-coverage/8-5-artifacts/gate-artifact.rst
.. governanceCode: mycodexvantaos-00000

=================
Artifact Coverage
=================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Artifact coverage measures the percentage of defined artifact types (container
images, SBOM files, provenance records, gate reports, evidence records) that
are produced and validated in the CI pipeline. An artifact type is considered
covered if at least one instance is produced and its integrity is verified.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Artifact Type
     - Minimum Coverage
     - Enforcement
   * - Gate evidence records
     - 100%
     - MUST
   * - Gate validation reports
     - 100%
     - MUST
   * - SBOM files
     - 100%
     - MUST
   * - Provenance records
     - 100%
     - MUST
   * - Container image signatures
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any required artifact that is not produced in the CI pipeline MUST cause a
``FAIL`` result with ``criticality: critical``. Artifact integrity verification
failures MUST also cause a ``FAIL`` with ``criticality: critical``.
