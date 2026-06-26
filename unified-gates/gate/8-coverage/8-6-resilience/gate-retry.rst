.. path: unified-gates/gate/8-coverage/8-6-resilience/gate-retry.rst
.. governanceCode: mycodexvantaos-00000

==============
Retry Coverage
==============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Retry coverage measures the percentage of defined retry scenarios (transient
failures, timeout retries, backoff strategies) that have been exercised in the
test suite. A retry scenario is considered covered if the retry mechanism has
been triggered at least once and the eventual success or permanent failure
behavior has been validated.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Retry Scenario
     - Minimum Coverage
     - Enforcement
   * - Transient network failure retry
     - 100%
     - MUST
   * - Timeout retry with backoff
     - 100%
     - MUST
   * - Max retry exhaustion
     - 100%
     - MUST
   * - Circuit breaker open state
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any retry scenario that has not been validated MUST cause a ``FAIL`` result
with ``criticality: high``. Max retry exhaustion MUST be tested to verify
that the system fails gracefully and produces a valid evidence record.
