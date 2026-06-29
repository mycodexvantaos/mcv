.. path: unified-gates/gate/6-domain-ai/gate-billing-accuracy.rst
.. governanceCode: mycodexvantaos-30400

=====================
Gate Billing Accuracy
=====================

:Version: 1.0.0
:Status: normative

Overview
--------

The billing accuracy gate validates that usage metering and cost attribution
are accurate, complete, and auditable before any billing event is emitted.

Accuracy Dimensions
-------------------

**Metering Completeness**: Every inference, training, embedding, and agent-run
event MUST produce a corresponding usage event conforming to
``contracts/usage-event-contract.yaml``. Missing events MUST cause gate failure.

**Token Count Accuracy**: Reported token counts MUST match the actual token
counts from the inference runtime within a 0.1% tolerance.

**Cost Attribution**: Every usage event MUST have a valid cost attribution
record linking it to a workspace, project, and billing account.

**Invoice Reconciliation**: The sum of usage events for a billing period MUST
reconcile with the generated invoice within a 0.01% tolerance.

Gate Reference
--------------

Implemented by: ``gate-56-cost-attribution-validation`` (l50) and
``gate-58-invoice-evidence-validation`` (l50)
