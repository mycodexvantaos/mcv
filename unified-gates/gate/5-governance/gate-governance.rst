.. path: unified-gates/gate/5-governance/gate-governance.rst
.. governanceCode: mycodexvantaos-00000

===============
Gate Governance
===============

:Version: 1.0.0
:Status: normative

Governance Model
----------------

Gate governance defines the authority structure, decision-making processes,
and accountability model for the unified gate system. It is derived from the
MyCodexVantaOS Namespace Governance Closure Specification (``mycodexvantaos-00000``).

Governance Authorities
----------------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Authority
     - Responsibility
   * - ``platform-governance-root``
     - Ultimate authority. Approves meta-governance (l00) gate changes and destruction of gate IDs.
   * - ``platform-governance-council``
     - Approves waiver overrides, escalations, and cross-layer gate changes.
   * - ``architecture-governance-owner``
     - Approves l10–l60 gate changes and dependency graph modifications.
   * - ``platform-security-owner``
     - Approves l90 supply-chain and security gate changes.
   * - ``gate-owner``
     - Responsible for individual gate maintenance, waiver review, and alert response.

Governance Principles
---------------------

All gate governance decisions MUST adhere to the core principles of
``mycodexvantaos-00000``: uniqueness, hierarchy, consistency, traceability,
closure, machine-readability, CI-verifiability, and binding-mediation.
