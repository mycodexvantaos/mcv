.. path: unified-gates/gate/3-technical/gate-sdk.rst
.. governanceCode: mycodexvantaos-00000

========
Gate SDK
========

:Version: 1.0.0
:Status: informative

SDK Overview
------------

The Gate SDK provides Python utilities for implementing custom gate checks,
evaluating gates programmatically, and integrating gate results into external
systems. The SDK is implemented in ``scripts/evaluate-gate.py`` and the
supporting validator scripts.

Core SDK Functions
------------------

.. code-block:: python

   from unified_gates import GateEvaluator, EvidenceEmitter, GateResult

   # Load and evaluate a gate
   evaluator = GateEvaluator(gate_path="ai-infra-gates/l00/gate-01-namespace-governance-validation.yaml")
   result: GateResult = evaluator.evaluate(artifact_path="./mycodexvantaos-auth-service")

   # Emit evidence
   emitter = EvidenceEmitter(result)
   evidence = emitter.emit(output_dir="./ci-reports/evidence/")

   # Check result
   if result.status == "FAIL" and result.blocking:
       sys.exit(1)

SDK Integration Points
----------------------

The SDK integrates with:

- **GitHub Actions**: Via ``scripts/evaluate-gate.py --github-actions`` output mode.
- **ArgoCD**: Via gate result annotations on Kubernetes resources.
- **Audit Log**: Via the platform event bus (``mycodexvantaos-event-bus``).
- **Compliance Reporter**: Via structured JSON output consumed by ``scripts/generate-gate-report.py``.
