.. path: unified-gates/gate/6-domain-ai/gate-model-safety.rst
.. governanceCode: mycodexvantaos-60600

==================
Gate Model Safety
==================

:Version: 1.0.0
:Status: normative

Overview
--------

The model safety gate validates that AI models comply with the platform's
algorithm safety policy before deployment. Safety validation is mandatory
for all models that interact with users or make autonomous decisions.

Safety Dimensions
-----------------

**Harmful Output Prevention**: Models MUST be evaluated against a curated
harmful output test suite. Harmful output rate MUST be below 0.1%.

**Prompt Injection Resistance**: Models deployed in agentic contexts MUST
demonstrate resistance to prompt injection attacks.

**Data Leakage Prevention**: Models MUST not reproduce verbatim training data
containing PII or sensitive information.

**Alignment Verification**: Models MUST pass the platform's alignment verification
suite, which tests for instruction-following, refusal of harmful requests, and
consistency with the platform's value alignment policy.

Gate Reference
--------------

Implemented by: ``gate-38-algorithm-safety-policy-validation`` (l30)

Safety policy: ``policies/ai-safety-policy.yaml``
