.. path: unified-gates/gate/8-coverage/8-5-artifacts/gate-toolchain.rst
.. governanceCode: mycodexvantaos-00000

===================
Toolchain Coverage
===================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Toolchain coverage measures the percentage of defined toolchain components
(compilers, linters, formatters, security scanners, SBOM generators, signing
tools) that are invoked and produce validated output in the CI pipeline. A
toolchain component is considered covered if it is invoked at least once and
its output is verified.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Toolchain Category
     - Minimum Coverage
     - Enforcement
   * - Security scanners
     - 100%
     - MUST
   * - SBOM generators
     - 100%
     - MUST
   * - Signing tools
     - 100%
     - MUST
   * - Linters and formatters
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any required toolchain component that is not invoked in the CI pipeline MUST
cause a ``FAIL`` result with ``criticality: high``. Toolchain components that
produce errors or warnings above threshold MUST cause a ``FAIL``.
