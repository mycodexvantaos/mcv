.. path: unified-gates/gate/8-coverage/8-6-resilience/gate-rollback.rst
.. governanceCode: mycodexvantaos-00000

=================
Rollback Coverage
=================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Rollback coverage measures the percentage of defined rollback scenarios that
have been tested and validated. A rollback scenario is considered covered if
the rollback procedure has been executed in a staging environment and the
system has been verified to return to its previous stable state.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Rollback Scenario
     - Minimum Coverage
     - Enforcement
   * - Service deployment rollback
     - 100%
     - MUST
   * - Database migration rollback
     - 100%
     - MUST
   * - Configuration rollback
     - 100%
     - MUST
   * - Partial rollback (canary)
     - 80%
     - SHOULD

Gate Failure Conditions
-----------------------

Any untested rollback scenario for a production deployment MUST cause a ``FAIL``
result with ``criticality: critical``. Rollback tests MUST be executed in
staging before every production release.
