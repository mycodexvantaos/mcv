.. path: unified-gates/gate/3-technical/gate-dependencies.rst
.. governanceCode: mycodexvantaos-00000

=================
Gate Dependencies
=================

:Version: 1.0.0
:Status: normative

Dependency Model
----------------

A gate MAY declare dependencies on other gates via the ``dependsOn`` field.
A gate with dependencies MUST NOT be evaluated until all its dependencies
have produced a ``PASS`` result in the current pipeline run.

Dependency Rules
----------------

1. Gate dependencies MUST form a directed acyclic graph (DAG). Circular dependencies
   are forbidden and will cause the pipeline to fail with a ``DEPENDENCY-CYCLE`` error.
2. Cross-layer dependencies are permitted but MUST respect layer execution order.
   A gate in ``l30`` MUST NOT depend on a gate in ``l40``.
3. Dependencies on gates in ``deprecated`` or ``archived`` lifecycle are forbidden.
4. The dependency graph is validated by ``gate-05-dependency-graph-acyclic-validation``
   at the ``l00`` layer on every pipeline run.

Dependency Declaration
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: yaml

   spec:
     dependsOn:
       - gate-01-namespace-governance-validation
       - gate-03-governance-code-validation
