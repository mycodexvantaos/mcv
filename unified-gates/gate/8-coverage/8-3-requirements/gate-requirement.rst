.. path: unified-gates/gate/8-coverage/8-3-requirements/gate-requirement.rst
.. governanceCode: mycodexvantaos-00000

====================
Requirement Coverage
====================

:Version: 1.0.0
:Status: normative

Definition
----------

Requirement coverage measures the percentage of documented functional and
non-functional requirements that are verified by at least one test case.

Threshold: 100% for all requirements with ``priority: must``. 90% for
``priority: should`` requirements.

Traceability
------------

Every requirement MUST be traceable to at least one test case via the
requirement-to-test traceability matrix (``gate-traceability.rst``).
