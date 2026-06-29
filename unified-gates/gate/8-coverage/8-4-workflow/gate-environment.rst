.. path: unified-gates/gate/8-coverage/8-4-workflow/gate-environment.rst
.. governanceCode: mycodexvantaos-00000

======================
Environment Coverage
======================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Environment coverage measures the percentage of defined deployment environments
(development, staging, production) in which the gate evaluation workflow has
been executed and validated. An environment is considered covered if the full
gate evaluation workflow has been run at least once and all gates have produced
valid evidence records.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Environment
     - Minimum Coverage
     - Enforcement
   * - staging
     - 100%
     - MUST
   * - production
     - 100%
     - MUST
   * - development
     - 80%
     - SHOULD

Gate Failure Conditions
-----------------------

Any required environment in which the gate evaluation workflow has not been
validated MUST cause a ``FAIL`` result with ``criticality: critical`` before
production promotion.
