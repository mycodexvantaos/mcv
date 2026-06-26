.. path: unified-gates/gate/1-core/gate-mapping.rst
.. governanceCode: mycodexvantaos-00000

============
Gate Mapping
============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Namespace-to-Gate Mapping
--------------------------

Every registered namespace in the MyCodexVantaOS platform maps to one or more
mandatory gates. The mapping is derived from the namespace plane, governance era,
and domain classification defined in the Namespace Governance Closure Specification.

Control-Plane Namespace Mandatory Gates
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

All repositories in the ``mycodexvantaos`` control-plane namespace MUST pass
the following gates before any artifact may be promoted:

.. list-table::
   :header-rows: 1
   :widths: 40 20 40

   * - Gate ID
     - Layer
     - Rationale
   * - ``gate-01-namespace-governance-validation``
     - l00
     - All control-plane repos must have valid namespace governance codes.
   * - ``gate-02-repository-naming-validation``
     - l00
     - Repository names must match canonical pattern.
   * - ``gate-03-governance-code-validation``
     - l00
     - Governance codes must match ``^mycodexvantaos-[0-9]{5}$``.
   * - ``gate-05-dependency-graph-acyclic-validation``
     - l00
     - Hard dependency graph must remain a DAG.
   * - ``gate-06-lifecycle-state-validation``
     - l00
     - Lifecycle state must be valid and transition must be authorized.
   * - ``gate-08-audit-evidence-validation``
     - l00
     - All state mutations must emit audit evidence.
   * - ``gate-91-sbom-generation-validation``
     - l90
     - SBOM must be generated for all control-plane releases.
   * - ``gate-93-signature-validation``
     - l90
     - All artifacts must be cryptographically signed.
   * - ``gate-99-production-closure-validation``
     - l90
     - Production closure gate must pass before any production promotion.

Product-Plane Namespace Mandatory Gates
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

All repositories in the ``softwareos`` product-plane namespace MUST pass
the following gates in addition to the control-plane mandatory gates:

.. list-table::
   :header-rows: 1
   :widths: 40 20 40

   * - Gate ID
     - Layer
     - Rationale
   * - ``gate-04-directory-binding-mediator-validation``
     - l00
     - Product-plane services must use binding mediators for cross-domain relations.
   * - ``gate-47-workload-slo-validation``
     - l40
     - Product-plane workloads must define and meet SLO targets.
   * - ``gate-48-workload-runtime-sandbox-validation``
     - l40
     - Product-plane workloads must run in validated runtime sandboxes.
   * - ``gate-98-compliance-report-validation``
     - l90
     - Product-plane releases must include a compliance report.

Governance Era-to-Gate Mapping
-------------------------------

.. list-table::
   :header-rows: 1
   :widths: 20 20 60

   * - Era
     - Code Range
     - Applicable Gate Layers
   * - ``meta-governance``
     - 00000–09999
     - l00 (all gates mandatory)
   * - ``era-one``
     - 10000–29999
     - l00, l60
   * - ``era-two``
     - 30000–59999
     - l00, l20, l50, l60, l90
   * - ``era-three``
     - 60000–89999
     - l00, l30, l40, l50, l60, l90
   * - ``cross-era-governance``
     - 90000–99999
     - l00, l90 (all supply-chain gates mandatory)

Domain-to-Gate Mapping
-----------------------

.. list-table::
   :header-rows: 1
   :widths: 20 80

   * - Domain
     - Mandatory Additional Gates
   * - ``auth``
     - gate-28-data-access-policy-validation, gate-94-policy-attestation-validation
   * - ``policy``
     - gate-94-policy-attestation-validation, gate-98-compliance-report-validation
   * - ``autotask``
     - gate-45-agent-task-policy-validation, gate-38-algorithm-safety-policy-validation
   * - ``compliance``
     - gate-98-compliance-report-validation, gate-95-audit-evidence-chain-validation
   * - ``prediction``
     - gate-32-model-contract-validation, gate-33-training-pipeline-validation
   * - ``qa``
     - gate-44-rag-pipeline-validation, gate-25-vector-database-schema-validation
   * - ``rollback``
     - gate-97-rollback-readiness-validation
   * - ``scheduler``
     - gate-46-workload-resource-estimation, gate-47-workload-slo-validation
   * - ``alertd``
     - gate-47-workload-slo-validation, gate-08-audit-evidence-validation
