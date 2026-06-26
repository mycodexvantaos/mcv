.. path: unified-gates/gate/8-coverage/8-1-code/gate-decision.rst
.. governanceCode: mycodexvantaos-10100

=================
Decision Coverage
=================

:Version: 1.0.0
:Status: normative

Definition
----------

Decision coverage (also called branch coverage at the decision level) requires
that every decision point in the program has been evaluated to both true and false.
It is equivalent to branch coverage for simple boolean expressions.

For compound conditions, decision coverage requires that the overall decision
outcome (not individual sub-expressions) is exercised in both directions.

Threshold: 75% minimum. Same as branch coverage threshold.
