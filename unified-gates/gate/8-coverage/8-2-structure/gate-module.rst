.. path: unified-gates/gate/8-coverage/8-2-structure/gate-module.rst
.. governanceCode: mycodexvantaos-20100

===============
Module Coverage
===============

:Version: 1.0.0
:Status: normative

Definition
----------

Module coverage measures the percentage of modules (Python modules, TypeScript
modules, Go packages) that are imported and exercised by the test suite.

Threshold: 100% for ``mycodexvantaos`` control-plane modules. 90% for
``softwareos`` product-plane modules.

Uncovered modules MUST be documented with a justification or removed from the codebase.
