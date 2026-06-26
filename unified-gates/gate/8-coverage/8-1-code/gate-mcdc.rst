.. path: unified-gates/gate/8-coverage/8-1-code/gate-mcdc.rst
.. governanceCode: mycodexvantaos-10100

=============
MC/DC Coverage
=============

:Version: 1.0.0
:Status: normative

Definition
----------

Modified Condition/Decision Coverage (MC/DC) requires that each condition in
a decision independently affects the decision outcome. It is the most rigorous
structural coverage criterion and is required for safety-critical software.

Applicability
-------------

MC/DC coverage is REQUIRED for:

- AI safety policy enforcement code (``policies/ai-safety-policy.yaml`` evaluators)
- Billing accuracy validation logic
- Audit evidence chain integrity verification

MC/DC is RECOMMENDED for all governance enforcement code.

Threshold: 60% minimum for applicable code paths.
