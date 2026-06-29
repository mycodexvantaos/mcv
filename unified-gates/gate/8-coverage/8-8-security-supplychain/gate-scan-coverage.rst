.. path: unified-gates/gate/8-coverage/8-8-security-supplychain/gate-scan-coverage.rst
.. governanceCode: mycodexvantaos-00000

=============
Scan Coverage
=============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Scan coverage measures the percentage of defined scan types (SAST, DAST,
dependency vulnerability scan, container image scan, secret scan, IaC scan)
that have been executed and have produced validated results. A scan type is
considered covered if it has been run against the target artifact and its
findings have been reviewed and triaged.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Scan Type
     - Minimum Coverage
     - Enforcement
   * - SAST (static analysis)
     - 100%
     - MUST
   * - Dependency vulnerability scan
     - 100%
     - MUST
   * - Container image scan
     - 100%
     - MUST
   * - Secret scan
     - 100%
     - MUST
   * - IaC scan
     - 100%
     - MUST
   * - DAST (dynamic analysis)
     - 80%
     - SHOULD

Gate Failure Conditions
-----------------------

Any required scan type that has not been executed MUST cause a ``FAIL`` result
with ``criticality: critical``. Critical or high severity findings that have
not been triaged MUST also cause a ``FAIL``.
