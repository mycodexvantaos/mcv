.. path: unified-gates/gate/8-coverage/8-2-structure/gate-function.rst
.. governanceCode: mycodexvantaos-00000

=================
Function Coverage
=================

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Definition
----------

Function coverage (also known as subroutine coverage) measures the percentage
of defined functions, methods, and subroutines that are invoked at least once
during the test suite execution. A function is considered covered if it is
called at least once, regardless of which code paths within it are executed.

Threshold Policy
----------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Namespace
     - Minimum Function Coverage
   * - ``mycodexvantaos`` (control-plane)
     - 90%
   * - ``softwareos`` (product-plane)
     - 85%
   * - ``critical`` governance code range (00000–09999)
     - 100%

Gate Failure Conditions
-----------------------

Function coverage below the defined threshold MUST cause the quality gate to
fail with ``criticality: high`` and ``blocking: true``. Functions in the
``critical`` governance code range that are not covered MUST cause a ``FAIL``
with ``criticality: critical``.

Measurement
-----------

Function coverage is measured using language-specific coverage tools (e.g.,
``coverage.py`` for Python, ``istanbul`` for JavaScript, ``go test -cover``
for Go). Results MUST be reported in the gate evidence record.
