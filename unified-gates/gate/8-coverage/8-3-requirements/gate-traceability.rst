.. path: unified-gates/gate/8-coverage/8-3-requirements/gate-traceability.rst
.. governanceCode: mycodexvantaos-00000

=======================
Traceability Coverage
=======================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Traceability coverage measures the percentage of requirements that have a
complete bidirectional traceability chain: from business requirement to
acceptance criterion, from acceptance criterion to test case, and from test
case to test result. A requirement is considered fully traceable if all links
in its chain are present and valid.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 40 30 30

   * - Requirement Type
     - Minimum Traceability
     - Enforcement
   * - Normative requirements (MUST)
     - 100%
     - MUST
   * - Recommended requirements (SHOULD)
     - 90%
     - SHOULD
   * - Optional requirements (MAY)
     - 70%
     - MAY

Gate Failure Conditions
-----------------------

Any normative requirement without a complete traceability chain MUST cause a
``FAIL`` result with ``criticality: critical``. Traceability records MUST be
maintained in the requirement registry.
