.. path: unified-gates/gate/8-coverage/8-9-api-contract/gate-endpoint-coverage.rst
.. governanceCode: mycodexvantaos-00000

==================
Endpoint Coverage
==================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Endpoint coverage measures the percentage of defined API endpoints (REST, gRPC,
GraphQL) that have been exercised in the test suite. An endpoint is considered
covered if it has been called at least once with a valid request and its
response has been validated.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Endpoint Category
     - Minimum Coverage
     - Enforcement
   * - Public API endpoints
     - 100%
     - MUST
   * - Internal service endpoints
     - 90%
     - SHOULD
   * - Admin endpoints
     - 100%
     - MUST
   * - Health check endpoints
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any public API or admin endpoint that has not been exercised in the test suite
MUST cause a ``FAIL`` result with ``criticality: critical``. Health check
endpoints MUST be tested with both healthy and degraded system states.
