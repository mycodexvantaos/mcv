.. path: unified-gates/gate/8-coverage/8-2-structure/gate-method.rst
.. governanceCode: mycodexvantaos-00000

===============
Method Coverage
===============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Method coverage measures the percentage of class methods and object methods
that are invoked at least once during the test suite execution. Method coverage
is a specialization of function coverage applied to object-oriented code
structures. A method is considered covered if it is called at least once during
a test run.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Namespace
     - Minimum Method Coverage
   * - ``mycodexvantaos`` (control-plane)
     - 90%
   * - ``softwareos`` (product-plane)
     - 85%
   * - Public API methods
     - 100%

Gate Failure Conditions
-----------------------

Method coverage below the defined threshold MUST cause the quality gate to fail
with ``criticality: high`` and ``blocking: true``. Public API methods that are
not covered MUST cause a ``FAIL`` with ``criticality: critical``.
