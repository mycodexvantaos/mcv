.. path: unified-gates/gate/1-core/gate-validation.rst
.. governanceCode: mycodexvantaos-00000

================
Gate Validation
================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Validation Dimension Model
--------------------------

Each gate defines one or more **validation dimensions**. A dimension is a named
category of checks that the gate performs against the target artifact or infrastructure
component. All checks within a dimension MUST pass for the dimension to pass.
All dimensions MUST pass for the gate to pass.

Dimension Schema
~~~~~~~~~~~~~~~~

.. code-block:: yaml

   validates:
     - dimension: <dimension-id>
       description: <human-readable description>
       checks:
         - id: <check-id>
           description: <what this check verifies>
           rule: <machine-executable rule reference or inline expression>
           severity: critical | high | medium | low
           evidenceRequired: true | false

Standard Validation Dimensions
-------------------------------

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Dimension ID
     - Description
   * - ``canonical-readiness``
     - Verifies that all identifiers, names, and codes conform to canonical kebab-case and governance code patterns.
   * - ``namespace-compliance``
     - Verifies that namespace prefixes are registered and plane assignments are correct.
   * - ``lifecycle-validity``
     - Verifies that lifecycle stages and transitions are valid per the governance state machine.
   * - ``dependency-acyclicity``
     - Verifies that the hard dependency graph is a directed acyclic graph (DAG).
   * - ``evidence-completeness``
     - Verifies that all required evidence records exist and are cryptographically valid.
   * - ``contract-conformance``
     - Verifies that artifacts conform to their registered contract schemas.
   * - ``policy-attestation``
     - Verifies that policy attestation records exist and are signed by authorized principals.
   * - ``security-posture``
     - Verifies that security scan results meet the defined threshold.
   * - ``slo-compliance``
     - Verifies that SLO targets are defined, measurable, and currently met.
   * - ``cost-attribution``
     - Verifies that cost attribution metadata is present and accurate.

Check Severity
--------------

Within a dimension, each check carries a severity level:

- ``critical``: Check failure causes the dimension to fail immediately. No further checks in the dimension are evaluated.
- ``high``: Check failure causes the dimension to fail. All checks are still evaluated.
- ``medium``: Check failure produces a warning. Does not cause dimension failure unless ``--strict`` mode is active.
- ``low``: Check failure produces an informational note. Never causes dimension failure.

Validation Result Schema
------------------------

.. code-block:: yaml

   gateResult:
     gateId: <gate-id>
     evaluatedAt: <ISO 8601 UTC timestamp>
     artifactRef: <artifact URN or path>
     overallStatus: PASS | FAIL | WARN | SKIP
     dimensions:
       - dimension: <dimension-id>
         status: PASS | FAIL | WARN | SKIP
         checks:
           - id: <check-id>
             status: PASS | FAIL | WARN | SKIP
             message: <human-readable result>
             detail: <machine-readable diagnostic>
     evidence:
       sha256: <hex>
       sha3512: <hex>
       blake3: <hex>
       signedBy: <principal URN>
       waiverRef: <waiver ID if applicable>
