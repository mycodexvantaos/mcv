.. path: unified-gates/gate/8-coverage/8-6-resilience/gate-error.rst
.. governanceCode: mycodexvantaos-00000

==============
Error Coverage
==============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Error coverage measures the percentage of defined error conditions and
exception types that have been exercised in the test suite. An error condition
is considered covered if it has been triggered at least once and the system's
error handling behavior has been validated.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Error Category
     - Minimum Coverage
     - Enforcement
   * - Gate evaluation errors
     - 100%
     - MUST
   * - Network / connectivity errors
     - 100%
     - MUST
   * - Schema validation errors
     - 100%
     - MUST
   * - Authentication / authorization errors
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any defined error condition that has not been exercised in the test suite MUST
cause a ``FAIL`` result with ``criticality: high``. Error handling MUST be
validated to ensure that evidence records are still produced even on failure.
