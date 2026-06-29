.. path: unified-gates/gate/8-coverage/8-3-requirements/gate-userstory.rst
.. governanceCode: mycodexvantaos-00000

====================
User Story Coverage
====================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

User story coverage measures the percentage of defined user stories in the
product backlog that have at least one automated test case validating the
story's acceptance criteria. A user story is considered covered if all of its
acceptance criteria have corresponding automated tests.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Story Priority
     - Minimum Coverage
     - Enforcement
   * - P0 (Critical path)
     - 100%
     - MUST
   * - P1 (Core feature)
     - 90%
     - SHOULD
   * - P2 (Enhancement)
     - 70%
     - MAY

Gate Failure Conditions
-----------------------

Any P0 user story without full acceptance criterion coverage MUST cause a
``FAIL`` result with ``criticality: critical``. User story coverage MUST be
verified before sprint completion.
