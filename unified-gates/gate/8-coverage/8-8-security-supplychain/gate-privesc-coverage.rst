.. path: unified-gates/gate/8-coverage/8-8-security-supplychain/gate-privesc-coverage.rst
.. governanceCode: mycodexvantaos-00000

==========================
Privilege Escalation Coverage
==========================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Privilege escalation coverage measures the percentage of defined privilege
escalation attack vectors that have been tested and mitigated. A vector is
considered covered if a security test case exists that attempts the escalation
and verifies that it is blocked by the platform's access controls.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Attack Vector Category
     - Minimum Coverage
     - Enforcement
   * - Horizontal privilege escalation
     - 100%
     - MUST
   * - Vertical privilege escalation
     - 100%
     - MUST
   * - Container escape
     - 100%
     - MUST
   * - Service account abuse
     - 100%
     - MUST

Gate Failure Conditions
-----------------------

Any privilege escalation vector that has not been tested MUST cause a ``FAIL``
result with ``criticality: critical``. Security tests MUST be run in an
isolated environment that mirrors production.
