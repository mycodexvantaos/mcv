.. path: unified-gates/gate/3-technical/gate-spec.rst
.. governanceCode: mycodexvantaos-00000

=========
Gate Spec
=========

:Version: 1.0.0
:Status: normative

Gate Definition Format
----------------------

All gate definitions in ``ai-infra-gates/`` MUST conform to the following
canonical YAML format, validated against ``schemas/ai-infra-gate.schema.json``.

.. code-block:: yaml

   apiVersion: mycodexvantaos.io/v1
   kind: AIInfraGate
   metadata:
     id: gate-NN-<descriptive-name>
     version: 1.0.0
     layer: lNN
     plane: ai-infra
     blocking: true
     lifecycle: active
     criticality: critical | high | medium | low
     owner: <email or team URN>
     governanceCode: mycodexvantaos-NNNNN
     createdAt: "YYYY-MM-DDTHH:MM:SSZ"
     tags: []
     sloTarget: 30
     evidenceRetentionDays: 2555
   spec:
     description: >
       One-paragraph description of what this gate validates and why.
     validates:
       - dimension: <dimension-id>
         description: <dimension description>
         checks:
           - id: <check-id>
             description: <check description>
             rule: <rule reference or inline expression>
             severity: critical | high | medium | low
             evidenceRequired: true | false
     dependsOn: []
     waiverPolicy: ./policies/gate-waiver-policy.yaml
     escalationPolicy: ./policies/gate-risk-policy.yaml

Naming Constraints
------------------

Gate IDs MUST match: ``^gate-[0-9]{2}-[a-z0-9-]+$``

Check IDs MUST match: ``^chk-[a-z0-9-]+$``

Dimension IDs MUST be drawn from the standard dimension vocabulary defined in
``gate/1-core/gate-validation.rst``.
