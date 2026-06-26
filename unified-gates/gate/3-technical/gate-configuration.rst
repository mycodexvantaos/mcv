.. path: unified-gates/gate/3-technical/gate-configuration.rst
.. governanceCode: mycodexvantaos-00000

==================
Gate Configuration
==================

:Version: 1.0.0
:Status: normative

Configuration Sources
---------------------

Gate behavior can be configured at three levels, in descending priority:

1. **Pipeline-level override**: Passed as CLI arguments to ``scripts/evaluate-gate.py``.
2. **Repository-level configuration**: Defined in ``.gate-config.yaml`` at the repository root.
3. **Platform-level defaults**: Defined in ``policies/gate-governance-policy.yaml``.

Configuration Schema
--------------------

.. code-block:: yaml

   # .gate-config.yaml (repository root)
   apiVersion: mycodexvantaos.io/v1
   kind: GateConfiguration
   metadata:
     repository: <repository-name>
     namespace: mycodexvantaos | softwareos
   spec:
     strict: false
     reportDir: ./ci-reports/
     enabledLayers: [l00, l10, l20, l30, l40, l50, l60, l90]
     disabledGates: []
     waiverFile: ./.gate-waivers.yaml
     evidenceOutputDir: ./ci-reports/evidence/

Configuration Constraints
-------------------------

- ``disabledGates`` MUST NOT include any gate with ``criticality: critical``.
- ``enabledLayers`` MUST always include ``l00`` (meta-governance layer is mandatory).
- ``strict: true`` treats all ``WARN`` results as ``FAIL``.
