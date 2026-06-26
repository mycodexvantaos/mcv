.. path: unified-gates/gate/8-coverage/8-8-security-supplychain/gate-signing-coverage.rst
.. governanceCode: mycodexvantaos-00000

================
Signing Coverage
================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Signing coverage measures the percentage of defined artifact types (container
images, SBOM files, provenance records, gate evidence records) that have been
cryptographically signed and whose signatures have been verified. An artifact
is considered covered if it has a valid signature from an authorized signing key.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Artifact Type
     - Minimum Signing Coverage
     - Enforcement
   * - Container images
     - 100%
     - MUST
   * - SBOM files
     - 100%
     - MUST
   * - Provenance records
     - 100%
     - MUST
   * - Gate evidence records
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any unsigned artifact of a required type MUST cause a ``FAIL`` result with
``criticality: critical``. Signature verification failures MUST also cause a
``FAIL`` with ``criticality: critical``.
