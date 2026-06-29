.. path: unified-gates/gate/3-technical/gate-catalog.rst
.. governanceCode: mycodexvantaos-00000

============
Gate Catalog
============

:Version: 1.0.0
:Status: normative

Catalog Purpose
---------------

The gate catalog is the authoritative registry of all gate definitions. It serves
as the single source of truth for gate discovery, CI orchestration, and governance
reporting. Every gate MUST be registered in the catalog before it can be enforced.

Catalog Files
-------------

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - File
     - Scope
   * - ``unified-gates/gate-catalog.yaml``
     - Master catalog. All planes.
   * - ``unified-gates/ai-infra-gate-catalog.yaml``
     - AI infrastructure gates only.
   * - ``unified-gates/gate/gate-catalog.yaml``
     - Gate documentation catalog.

Catalog Validation
------------------

The catalog MUST be validated by ``scripts/validate-gate-catalog.py`` on every
CI run. The validator checks:

- All gate IDs are unique across all planes.
- All gate IDs match the canonical naming pattern.
- All referenced gate definition files exist.
- All gate lifecycle stages are valid.
- All gate owners are registered in the owner registry.
- No gate in ``destroyed`` lifecycle is referenced as a dependency.
