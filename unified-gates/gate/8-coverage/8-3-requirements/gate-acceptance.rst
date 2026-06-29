.. path: unified-gates/gate/8-coverage/8-3-requirements/gate-acceptance.rst
.. governanceCode: mycodexvantaos-00000

===================
Acceptance Coverage
===================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Acceptance coverage measures the percentage of defined acceptance criteria (AC)
that have corresponding automated acceptance tests. An acceptance criterion is
considered covered if at least one automated test case validates that the
criterion is satisfied in the target environment.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Requirement Priority
     - Minimum AC Coverage
     - Enforcement
   * - Must-have (P0)
     - 100%
     - MUST
   * - Should-have (P1)
     - 90%
     - SHOULD
   * - Nice-to-have (P2)
     - 70%
     - MAY

Gate Failure Conditions
-----------------------

Any must-have acceptance criterion without a corresponding automated test MUST
cause a ``FAIL`` result with ``criticality: critical``. Acceptance tests MUST
be authored before the feature is merged to the main branch.
