.. path: unified-gates/gate/8-coverage/8-1-code/gate-path.rst
.. governanceCode: mycodexvantaos-10100

=============
Path Coverage
=============

:Version: 1.0.0
:Status: normative

Definition
----------

Path coverage measures the percentage of unique execution paths through a
function or module that are exercised by the test suite. Full path coverage
is generally infeasible for complex functions due to combinatorial explosion.

Practical Application
---------------------

Path coverage is applied to bounded-complexity functions (cyclomatic complexity ≤ 10).
For higher-complexity functions, branch coverage is used as a proxy.

The gate system uses path coverage to validate:

- Gate evaluation decision trees
- Lifecycle transition state machine logic
- Dependency graph traversal algorithms
