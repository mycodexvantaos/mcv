.. path: unified-gates/gate/8-coverage/8-7-observability/gate-trace-coverage.rst
.. governanceCode: mycodexvantaos-00000

===============
Trace Coverage
===============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Trace coverage measures the percentage of defined distributed trace spans that
are emitted and validated in the test environment. A trace span is considered
covered if it is emitted during a gate evaluation and its parent-child
relationships are correctly recorded.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Trace Category
     - Minimum Coverage
     - Enforcement
   * - Gate evaluation spans
     - 100%
     - MUST
   * - Evidence write spans
     - 100%
     - MUST
   * - Policy check spans
     - 100%
     - MUST
   * - External service call spans
     - 90%
     - SHOULD

Gate Failure Conditions
-----------------------

Any gate evaluation span that is not emitted MUST cause a ``FAIL`` result with
``criticality: high``. Broken trace parent-child relationships MUST cause a
``FAIL`` with ``criticality: medium``.
