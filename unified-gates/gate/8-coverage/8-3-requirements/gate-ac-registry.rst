.. path: unified-gates/gate/8-coverage/8-3-requirements/gate-ac-registry.rst
.. governanceCode: mycodexvantaos-00000

====================
AC Registry Coverage
====================

:Version: 1.0.0
:Status: normative

Definition
----------

The acceptance criteria registry is the authoritative list of all ACs for the
current release. AC registry coverage measures the percentage of registered ACs
that have corresponding automated test cases.

Registry Format
---------------

The AC registry is maintained in a structured YAML format and validated by
``scripts/validate-gate-catalog.py``. Every AC MUST have a unique ID, a
description, and a reference to the implementing test case.
