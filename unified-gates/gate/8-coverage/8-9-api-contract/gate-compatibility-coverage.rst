.. path: unified-gates/gate/8-coverage/8-9-api-contract/gate-compatibility-coverage.rst
.. governanceCode: mycodexvantaos-00000

=======================
Compatibility Coverage
=======================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Compatibility coverage measures the percentage of defined API compatibility
scenarios (backward compatibility, forward compatibility, version negotiation)
that have been validated in the test suite. A compatibility scenario is
considered covered if it has been tested with the specified combination of
client and server versions.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Compatibility Type
     - Minimum Coverage
     - Enforcement
   * - Backward compatibility (N-1)
     - 100%
     - MUST
   * - Forward compatibility
     - 80%
     - SHOULD
   * - Version negotiation
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any backward compatibility regression MUST cause a ``FAIL`` result with
``criticality: critical``. Breaking changes to public APIs MUST be detected
and blocked by this gate.
