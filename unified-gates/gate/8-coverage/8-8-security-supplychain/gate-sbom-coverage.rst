.. path: unified-gates/gate/8-coverage/8-8-security-supplychain/gate-sbom-coverage.rst
.. governanceCode: mycodexvantaos-00000

=============
SBOM Coverage
=============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

SBOM coverage measures the percentage of software components (direct
dependencies, transitive dependencies, system libraries) that are included
in the Software Bill of Materials (SBOM). An SBOM is considered fully covered
if it includes all components with valid PURL identifiers, license information,
and vulnerability data.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Component Category
     - Minimum SBOM Coverage
     - Enforcement
   * - Direct dependencies
     - 100%
     - MUST
   * - Transitive dependencies
     - 100%
     - MUST
   * - System libraries
     - 95%
     - SHOULD
   * - Development dependencies
     - 80%
     - MAY

Gate Failure Conditions
-----------------------

Any direct or transitive dependency missing from the SBOM MUST cause a ``FAIL``
result with ``criticality: critical``. SBOM files MUST be generated in both
CycloneDX and SPDX formats.
