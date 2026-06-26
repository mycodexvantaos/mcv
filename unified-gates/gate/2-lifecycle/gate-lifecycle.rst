.. path: unified-gates/gate/2-lifecycle/gate-lifecycle.rst
.. governanceCode: mycodexvantaos-00200

==============
Gate Lifecycle
==============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Overview
--------

Every gate definition follows the same lifecycle as namespace identifiers in the
MyCodexVantaOS governance model. The lifecycle ensures that gates are introduced,
maintained, deprecated, and retired in a controlled, auditable manner.

Lifecycle Stages
----------------

.. code-block:: text

   proposed → active → deprecated → archived → destroyed

.. list-table::
   :header-rows: 1
   :widths: 15 15 70

   * - Stage
     - Duration
     - Description
   * - ``proposed``
     - Max 14 days
     - Gate definition is under review. CI MUST NOT enforce this gate.
   * - ``active``
     - Indefinite
     - Gate is enforced in CI. All artifacts MUST satisfy this gate.
   * - ``deprecated``
     - Max 90 days
     - Gate is scheduled for removal. CI emits warnings but does not block.
   * - ``archived``
     - Retention period
     - Gate is no longer enforced. Historical evidence records are read-only.
   * - ``destroyed``
     - Terminal
     - Gate ID is permanently retired. MUST NOT be reused.

Transition Rules
----------------

Valid transitions:

- ``proposed`` → ``active``: Requires approval from the gate owner and the governance authority for the gate's layer.
- ``active`` → ``deprecated``: Requires a migration notification to all affected teams and a 90-day notice period.
- ``deprecated`` → ``archived``: Requires confirmation that all dependent pipelines have been updated.
- ``archived`` → ``destroyed``: Requires a certificate of destruction signed by the platform governance root authority.

Forbidden transitions:

- ``destroyed`` → any stage (terminal state, ID MUST NOT be reused)
- Skipping stages (e.g., ``proposed`` → ``deprecated``) is forbidden without explicit governance council approval.

Lifecycle Governance
--------------------

Gate lifecycle transitions MUST be recorded in the namespace registry as audit events.
The transition record MUST include:

- Gate ID
- From stage and to stage
- Transition timestamp (ISO 8601 UTC)
- Approver identity (principal URN)
- Justification
- Migration plan reference (for ``active`` → ``deprecated`` transitions)
