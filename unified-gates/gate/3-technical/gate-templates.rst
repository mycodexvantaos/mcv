.. path: unified-gates/gate/3-technical/gate-templates.rst
.. governanceCode: mycodexvantaos-00000

===============
Gate Templates
===============

:Version: 1.0.0
:Status: informative

Template Purpose
----------------

Gate templates provide starting-point YAML definitions for common gate patterns.
Templates are not normative; they are reference implementations that MUST be
customized before use.

Minimal Gate Template
---------------------

.. code-block:: yaml

   apiVersion: mycodexvantaos.io/v1
   kind: AIInfraGate
   metadata:
     id: gate-NN-<name>
     version: 1.0.0
     layer: lNN
     plane: ai-infra
     blocking: true
     lifecycle: proposed
     criticality: high
     owner: platform@mycodexvantaos.com
     governanceCode: mycodexvantaos-00000
     createdAt: "YYYY-MM-DDTHH:MM:SSZ"
   spec:
     description: >
       Describe what this gate validates.
     validates:
       - dimension: canonical-readiness
         description: Verify canonical naming compliance.
         checks:
           - id: chk-naming-pattern
             description: ID matches canonical pattern.
             rule: regex:^gate-[0-9]{2}-[a-z0-9-]+$
             severity: critical
             evidenceRequired: true
     dependsOn: []

New Gate Checklist
------------------

Before submitting a new gate for review:

- [ ] Gate ID matches ``^gate-[0-9]{2}-[a-z0-9-]+$``
- [ ] Gate is registered in the appropriate layer catalog
- [ ] All checks have unique IDs and severity levels
- [ ] Owner is a registered principal
- [ ] Governance code is assigned
- [ ] Lifecycle is set to ``proposed``
- [ ] Schema validation passes: ``python scripts/validate-gate-schema.py --gate <path>``
