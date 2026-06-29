.. path: unified-gates/gate/8-coverage/8-8-security-supplychain/gate-policy-coverage.rst
.. governanceCode: mycodexvantaos-00000

===============
Policy Coverage
===============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Policy coverage measures the percentage of defined governance and security
policies (from ``policies/``) that have been evaluated and validated in the
test environment. A policy is considered covered if it has been applied to at
least one test artifact and its enforcement behavior has been verified.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Policy Type
     - Minimum Coverage
     - Enforcement
   * - Gate waiver policy
     - 100%
     - MUST
   * - RBAC policy
     - 100%
     - MUST
   * - Risk escalation policy
     - 100%
     - MUST
   * - AI safety policy
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any governance policy that has not been validated in the test environment MUST
cause a ``FAIL`` result with ``criticality: high``. Policy enforcement failures
MUST cause a ``FAIL`` with ``criticality: critical``.
