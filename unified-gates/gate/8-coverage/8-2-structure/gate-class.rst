.. path: unified-gates/gate/8-coverage/8-2-structure/gate-class.rst
.. governanceCode: mycodexvantaos-00000

=============
Class Coverage
=============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Class coverage measures the percentage of defined classes and data structures
that are instantiated at least once during the test suite execution. A class
is considered covered if at least one instance is created and its behavior
is validated.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Namespace
     - Minimum Class Coverage
   * - ``mycodexvantaos`` (control-plane)
     - 95%
   * - ``softwareos`` (product-plane)
     - 90%
   * - Public API classes
     - 100%

Gate Failure Conditions
-----------------------

Any public API class that is not instantiated in the test suite MUST cause a
``FAIL`` result with ``criticality: critical``. Classes in the critical
governance code range that are not covered MUST cause a ``FAIL`` with
``criticality: high``.
