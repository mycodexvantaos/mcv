.. path: unified-gates/gate/1-core/gate-policies.rst
.. governanceCode: mycodexvantaos-00000

==============
Gate Policies
==============

:Version: 1.0.0
:Status: normative
:Authority: unified-gate-governance

Overview
--------

Gate policies define the behavioral rules that govern how gates are evaluated,
how failures are handled, how waivers are granted, and how evidence is retained.
All gate policies MUST be registered in ``policies/gate-governance-policy.yaml``.

Blocking Policy
---------------

A gate marked ``blocking: true`` MUST cause the CI pipeline to halt immediately
upon failure. No subsequent gates in the same or later layers MAY be evaluated.

A gate marked ``blocking: false`` MUST emit a warning and record a ``WARN`` result,
but MUST NOT halt the pipeline.

Overriding a blocking gate requires a valid waiver record signed by the
``platform-governance-council`` authority. Waivers are time-limited to a maximum
of 30 calendar days and MUST be renewed before expiry.

Criticality Levels
------------------

.. list-table::
   :header-rows: 1
   :widths: 15 20 65

   * - Level
     - Blocking Default
     - Description
   * - ``critical``
     - MUST block
     - Failure indicates a fundamental platform safety or compliance violation.
   * - ``high``
     - MUST block
     - Failure indicates a significant architectural or operational risk.
   * - ``medium``
     - SHOULD block
     - Failure indicates a quality degradation that may be waived with justification.
   * - ``low``
     - MAY block
     - Failure indicates a best-practice deviation. Waiver not required.

Evidence Policy
---------------

Every gate evaluation MUST produce an evidence record containing:

- Gate ID and version
- Evaluation timestamp (ISO 8601 UTC)
- Result: ``PASS``, ``FAIL``, ``WARN``, or ``SKIP``
- SHA-256 hash of the evaluated artifact
- SHA3-512 hash for long-term integrity
- BLAKE3 hash for fast CI comparison
- Evaluator identity (CI runner URN or human approver URN)
- Waiver reference (if applicable)

Evidence records MUST be stored in an append-only, immutable store and MUST NOT
be modified after creation. Retention periods are defined in the gate catalog.

Failure Action Policy
---------------------

On gate failure, the CI pipeline MUST:

1. Record a ``FAIL`` evidence record with full diagnostic context.
2. Emit a ``gate-failure`` governance event to the platform event bus.
3. Halt pipeline execution if ``blocking: true``.
4. Notify the gate owner via the registered alert channel.
5. Block artifact promotion to the next lifecycle stage.

Exception Policy
----------------

A gate evaluation MAY be skipped only if:

- The gate lifecycle is ``deprecated`` or ``archived``.
- A valid, non-expired waiver record exists for the specific artifact and gate combination.
- The gate is explicitly excluded by a registered governance exception file.

Skipped gates MUST produce a ``SKIP`` evidence record with the skip reason and
waiver or exception reference.

Ownership Policy
----------------

Every gate MUST have a registered owner. The owner is responsible for:

- Maintaining the gate definition and checks.
- Reviewing and approving waiver requests.
- Responding to gate failure alerts within the SLO window.
- Updating the gate when the underlying standard changes.

Gates without a registered owner MUST be treated as ``blocking: true`` with
criticality ``critical`` until an owner is assigned.
