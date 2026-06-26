.. path: unified-gates/gate/3-technical/gate-composition.rst
.. governanceCode: mycodexvantaos-00000

================
Gate Composition
================

:Version: 1.0.0
:Status: normative

Composition Model
-----------------

Gate composition allows multiple gates to be grouped into a named **gate set**
for coordinated evaluation. A gate set is not a new gate type; it is a named
collection of gate references with a shared evaluation context.

Gate Set Schema
~~~~~~~~~~~~~~~

.. code-block:: yaml

   apiVersion: mycodexvantaos.io/v1
   kind: GateSet
   metadata:
     id: <gate-set-id>
     description: <description>
   spec:
     gates:
       - gateId: <gate-id>
         required: true | false
     evaluationMode: sequential | parallel
     aggregationPolicy: all-pass | any-pass | weighted

Composition Rules
-----------------

1. Gate sets MUST NOT create circular references between gate sets.
2. A gate set MAY include gates from multiple layers, but layer execution order MUST be preserved.
3. ``parallel`` evaluation mode is only permitted for gates with no ``dependsOn`` relationships.
4. Gate set results are aggregated per the ``aggregationPolicy``. The default is ``all-pass``.
5. Gate sets MUST be registered in the gate catalog before use.
