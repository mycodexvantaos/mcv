.. path: unified-gates/gate/5-governance/gate-risk.rst
.. governanceCode: mycodexvantaos-00800

=========
Gate Risk
=========

:Version: 1.0.0
:Status: normative

Risk Classification
-------------------

Gate failures are classified by risk level based on the gate's criticality and
the nature of the failure:

.. list-table::
   :header-rows: 1
   :widths: 15 85

   * - Risk Level
     - Definition
   * - ``P1-Critical``
     - Failure in a ``critical`` gate that indicates a platform safety, security, or compliance violation. Requires immediate remediation.
   * - ``P2-High``
     - Failure in a ``high`` gate that indicates a significant operational risk. Requires remediation within 24 hours.
   * - ``P3-Medium``
     - Failure in a ``medium`` gate. Requires remediation within 7 days or a valid waiver.
   * - ``P4-Low``
     - Failure in a ``low`` gate. Requires remediation within 30 days or documentation.

Risk Escalation
---------------

Unresolved P1 and P2 failures MUST be escalated to the platform governance council
within 4 hours. Escalation procedures are defined in ``gate/5-governance/gate-escalation.rst``.

Risk Register
-------------

All active gate failures with risk level P1 or P2 MUST be recorded in the platform
risk register. The risk register is reviewed weekly by the governance council.
