.. path: unified-gates/gate/2-lifecycle/gate-metadata.rst
.. governanceCode: mycodexvantaos-00200

=============
Gate Metadata
=============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Metadata Schema
---------------

Every gate definition MUST include a complete metadata block. The metadata block
is used for discovery, governance, audit, and reporting purposes.

Required Metadata Fields
~~~~~~~~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Field
     - Description
   * - ``id``
     - Canonical gate ID. MUST match ``^gate-[0-9]{2}-[a-z0-9-]+$``.
   * - ``layer``
     - Layer code: ``l00``, ``l10``, ``l20``, ``l30``, ``l40``, ``l50``, ``l60``, ``l90``.
   * - ``plane``
     - Gate plane: ``ai-infra``, ``quality``, ``production``.
   * - ``blocking``
     - Boolean. Whether gate failure halts the pipeline.
   * - ``lifecycle``
     - Current lifecycle stage: ``proposed``, ``active``, ``deprecated``, ``archived``, ``destroyed``.
   * - ``owner``
     - Registered owner email or team URN (e.g., ``platform@mycodexvantaos.com``).
   * - ``governanceCode``
     - Associated governance code from the namespace governance catalog (e.g., ``mycodexvantaos-00000``).
   * - ``version``
     - Semantic version of the gate definition (e.g., ``1.0.0``).
   * - ``createdAt``
     - ISO 8601 UTC timestamp of gate creation.
   * - ``validates``
     - List of validation dimensions.

Optional Metadata Fields
~~~~~~~~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Field
     - Description
   * - ``criticality``
     - Criticality level: ``critical``, ``high``, ``medium``, ``low``. Defaults to ``critical``.
   * - ``tags``
     - List of classification tags for filtering and reporting.
   * - ``dependsOn``
     - List of gate IDs that MUST pass before this gate is evaluated.
   * - ``waiverPolicy``
     - Reference to the waiver policy applicable to this gate.
   * - ``sloTarget``
     - Target evaluation latency in seconds (e.g., ``30``).
   * - ``evidenceRetentionDays``
     - Override for evidence retention. Defaults to criticality-based policy.
   * - ``deprecatedAt``
     - ISO 8601 UTC timestamp when gate was deprecated.
   * - ``archivedAt``
     - ISO 8601 UTC timestamp when gate was archived.
   * - ``replacedBy``
     - Gate ID that replaces this gate (for deprecated gates).

Canonical Metadata Example
---------------------------

.. code-block:: yaml

   apiVersion: mycodexvantaos.io/v1
   kind: AIInfraGate
   metadata:
     id: gate-01-namespace-governance-validation
     version: 1.0.0
     layer: l00
     plane: ai-infra
     blocking: true
     lifecycle: active
     criticality: critical
     owner: platform@mycodexvantaos.com
     governanceCode: mycodexvantaos-00000
     createdAt: "2026-01-01T00:00:00Z"
     tags:
       - namespace
       - governance
       - meta
     sloTarget: 30
     evidenceRetentionDays: 2555
