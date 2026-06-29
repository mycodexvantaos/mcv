.. path: unified-gates/gate/8-coverage/8-1-code/gate-condition.rst
.. governanceCode: mycodexvantaos-10100

===================
Condition Coverage
===================

:Version: 1.0.0
:Status: normative

Definition
----------

Condition coverage measures whether each individual boolean sub-expression in
a compound condition has been evaluated to both true and false. It is a finer-
grained metric than branch coverage.

Applicability
-------------

Condition coverage is REQUIRED for:

- Security-critical code paths (authentication, authorization, encryption)
- Governance code validation logic (``ci/namespace_check.py``)
- Gate evaluation logic

Condition coverage is RECOMMENDED for all other code paths.

Threshold: 70% minimum for applicable code paths.
