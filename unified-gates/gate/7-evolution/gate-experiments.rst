.. path: unified-gates/gate/7-evolution/gate-experiments.rst
.. governanceCode: mycodexvantaos-00000

=================
Gate Experiments
=================

:Version: 1.0.0
:Status: informative

Experiment Model
----------------

Gate experiments allow new gate checks to be evaluated in shadow mode before
they are promoted to ``active`` lifecycle. Shadow mode gates run alongside
production gates but do not block the pipeline.

Experiment Lifecycle
--------------------

.. code-block:: text

   experiment → shadow → proposed → active

An experiment gate MUST:

- Be clearly marked with ``lifecycle: proposed`` and ``blocking: false``.
- Run for a minimum of 14 days in shadow mode before promotion.
- Produce evidence records that can be reviewed before promotion.
- Have a designated experiment owner responsible for analysis.

Experiment Registry
-------------------

Active experiments are tracked in ``gate/7-evolution/gate-roadmap.rst``.
Experiment results are reviewed in the monthly gate governance meeting.
