.. path: unified-gates/gate/5-governance/gate-rbac.rst
.. governanceCode: mycodexvantaos-00600

=========
Gate RBAC
=========

:Version: 1.0.0
:Status: normative

Role Definitions
----------------

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Role
     - Permissions
   * - ``gate-reader``
     - Read gate definitions, results, and reports. No write access.
   * - ``gate-evaluator``
     - Execute gate evaluations via CI. Cannot modify gate definitions.
   * - ``gate-owner``
     - Create and update gate definitions in owned layer. Approve waivers for owned gates.
   * - ``gate-approver``
     - Approve waiver requests and lifecycle transitions for assigned gates.
   * - ``gate-admin``
     - Full access to all gates. Can destroy gate IDs with root authority approval.
   * - ``governance-council``
     - Approve cross-layer changes, escalations, and waiver overrides.

RBAC Policy
-----------

RBAC policies are defined in ``policies/gate-rbac-policy.yaml`` and enforced
by ``mycodexvantaos-policy-engine``. All role assignments MUST be audited.
Role assignments for ``gate-admin`` and ``governance-council`` MUST be reviewed
quarterly by the platform governance root authority.
