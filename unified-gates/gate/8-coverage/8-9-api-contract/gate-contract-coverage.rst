.. path: unified-gates/gate/8-coverage/8-9-api-contract/gate-contract-coverage.rst
.. governanceCode: mycodexvantaos-00000

==================
Contract Coverage
==================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Contract coverage measures the percentage of defined API contracts (from
``contracts/``) that have been validated against their JSON Schema definitions.
A contract is considered covered if all required fields, value constraints, and
schema rules have been tested with both valid and invalid inputs.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Contract Type
     - Minimum Coverage
     - Enforcement
   * - Gate contracts
     - 100%
     - MUST
   * - Dataset contracts
     - 100%
     - MUST
   * - Model contracts
     - 100%
     - MUST
   * - Usage event contracts
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any contract that has not been validated against its schema MUST cause a
``FAIL`` result with ``criticality: critical``. Contract validation MUST
include both positive (valid input) and negative (invalid input) test cases.
