.. path: unified-gates/gate/1-core/gate-overview.rst
.. governanceCode: mycodexvantaos-00000

================
Gate Overview
================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Purpose
-------

A **gate** is a machine-verifiable, blocking checkpoint that an artifact, service,
or infrastructure component MUST satisfy before advancing to the next lifecycle stage.
Gates transform governance rules into executable CI enforcement boundaries.

The unified gate system for MyCodexVantaOS is derived from the Namespace Governance
Closure Specification (``mycodexvantaos-00000``) and extends it to cover all AI
infrastructure layers from compute provisioning through production closure.

Core Axiom
----------

.. code-block:: text

   A gate is not a suggestion.
   A gate is not a checklist.
   A gate is a machine-enforced contract between a software artifact
   and the platform governance authority.

Gate Anatomy
------------

Every gate definition MUST contain the following fields:

.. list-table::
   :header-rows: 1
   :widths: 20 15 65

   * - Field
     - Required
     - Description
   * - ``id``
     - MUST
     - Canonical kebab-case identifier matching ``^gate-[0-9]{2}-[a-z0-9-]+$``
   * - ``layer``
     - MUST
     - Layer code: ``l00``, ``l10``, ``l20``, ``l30``, ``l40``, ``l50``, ``l60``, ``l90``
   * - ``plane``
     - MUST
     - Gate plane: ``ai-infra``, ``quality``, ``production``
   * - ``blocking``
     - MUST
     - Boolean. If ``true``, CI pipeline MUST halt on gate failure.
   * - ``lifecycle``
     - MUST
     - One of: ``proposed``, ``active``, ``deprecated``, ``archived``, ``destroyed``
   * - ``owner``
     - MUST
     - Registered owner email or team URN
   * - ``validates``
     - MUST
     - List of validation dimensions with checks

Gate Planes
-----------

The unified gate system defines three gate planes:

``ai-infra``
    AI infrastructure gates. Executable YAML definitions in ``ai-infra-gates/``.
    These gates validate hardware readiness, data contracts, model lifecycle,
    workload execution, billing metering, and supply-chain integrity.

``quality``
    Quality gates. Cover code coverage, static analysis, security scanning,
    and architectural compliance. Defined in the ``gate/8-coverage/`` taxonomy.

``production``
    Production closure gates. Final blocking gates before any artifact may
    be promoted to a production environment.

Gate Layers
-----------

AI infrastructure gates are organized into eight layers:

.. list-table::
   :header-rows: 1
   :widths: 10 30 60

   * - Layer
     - Name
     - Responsibility
   * - ``l00``
     - Meta-governance
     - Namespace naming, governance codes, dependency graph, lifecycle, audit evidence
   * - ``l10``
     - AI Compute
     - GPU/accelerator hardware, cluster readiness, distributed training runtime
   * - ``l20``
     - Data & Vector
     - Dataset contracts, lineage, PII scanning, vector DB schema, data quality
   * - ``l30``
     - AI Framework & Model
     - Framework compatibility, model contracts, training pipelines, inference runtimes
   * - ``l40``
     - Workload Execution
     - Workload contracts, inference/training tasks, RAG pipelines, agent policies
   * - ``l50``
     - Billing & Metering
     - Usage event contracts, metering, cost attribution, billing policy
   * - ``l60``
     - Cloud Infrastructure
     - Cloud readiness, Kubernetes baseline, GitOps sync, managed service SLA
   * - ``l90``
     - Supply Chain & Production
     - SBOM, provenance, signatures, attestation, audit chain, production closure

Execution Order
---------------

Gates MUST be evaluated in layer order: ``l00 → l10 → l20 → l30 → l40 → l50 → l60 → l90``.

A gate in layer ``lN`` MUST NOT be evaluated if any gate in layer ``lM`` (where ``M < N``)
has failed and is marked ``blocking: true``.

Related Documents
-----------------

- ``gate/1-core/gate-policies.rst`` — Gate policy model
- ``gate/1-core/gate-validation.rst`` — Validation dimension model
- ``gate/1-core/gate-mapping.rst`` — Namespace-to-gate mapping
- ``gate/2-lifecycle/gate-lifecycle.rst`` — Gate lifecycle stages
