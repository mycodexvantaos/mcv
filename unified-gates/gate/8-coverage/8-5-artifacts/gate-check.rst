.. path: unified-gates/gate/8-coverage/8-5-artifacts/gate-check.rst
.. governanceCode: mycodexvantaos-00000

=============
Check Coverage
=============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Check coverage measures the percentage of defined gate checks (from
``spec.validates[].checks[]`` in gate YAML files) that have been executed
and have produced a validated result. A check is considered covered if it
has been executed at least once with both a passing and a failing input.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Check Severity
     - Minimum Coverage
     - Enforcement
   * - critical
     - 100% (pass + fail cases)
     - MUST
   * - high
     - 100% (pass + fail cases)
     - MUST
   * - medium
     - 90%
     - SHOULD
   * - low
     - 70%
     - MAY

Gate Failure Conditions
-----------------------

Any critical or high severity check that has not been tested with both passing
and failing inputs MUST cause a ``FAIL`` result with ``criticality: high``.
