.. path: unified-gates/gate/8-coverage/8-10-change/gate-version-coverage.rst
.. governanceCode: mycodexvantaos-00000

================
Version Coverage
================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Version coverage measures the percentage of supported platform versions (API
versions, SDK versions, runtime versions) that are exercised in the test suite.
A version is considered covered if the test suite includes at least one test
case that validates behavior on that specific version.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Version Category
     - Minimum Coverage
     - Enforcement
   * - Current stable version
     - 100%
     - MUST
   * - Previous stable version (N-1)
     - 100%
     - MUST
   * - LTS versions
     - 100%
     - MUST
   * - Deprecated versions
     - 50%
     - SHOULD

Gate Failure Conditions
-----------------------

Failure to cover the current stable or N-1 version MUST cause a ``FAIL`` result
with ``criticality: critical``. Uncovered LTS versions MUST cause a ``FAIL``
with ``criticality: high``.
