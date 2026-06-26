.. path: unified-gates/gate/8-coverage/8-5-artifacts/gate-rule.rst
.. governanceCode: mycodexvantaos-00000

=============
Rule Coverage
=============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Rule coverage measures the percentage of defined validation rules (regex
patterns, schema rules, policy rules, vocabulary rules) that have been
exercised in the test suite. A rule is considered covered if it has been
applied to at least one matching input and at least one non-matching input.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Rule Category
     - Minimum Coverage
     - Enforcement
   * - Regex validation rules
     - 100%
     - MUST
   * - Schema validation rules
     - 100%
     - MUST
   * - Policy enforcement rules
     - 100%
     - MUST
   * - Vocabulary rules
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any validation rule that has not been tested with both matching and
non-matching inputs MUST cause a ``FAIL`` result with ``criticality: high``.
