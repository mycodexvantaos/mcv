.. path: unified-gates/gate/8-coverage/8-1-code/gate-branch.rst
.. governanceCode: mycodexvantaos-10100

================
Branch Coverage
================

:Version: 1.0.0
:Status: normative

Definition
----------

Branch coverage measures the percentage of decision branches (if/else, switch/case,
ternary operators) that are executed by the test suite. Both the true and false
branches of every decision point must be covered.

Threshold Policy
----------------

Minimum branch coverage: 75% for all namespaces. 90% for ``critical`` governance
code ranges (00000–09999).

Relationship to Line Coverage
------------------------------

Branch coverage is a stricter metric than line coverage. A codebase may achieve
100% line coverage while having low branch coverage if conditional branches are
not exercised. Both metrics MUST be reported and both thresholds MUST be met.
