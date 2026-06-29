.. path: unified-gates/gate/7-evolution/gate-feedback.rst
.. governanceCode: mycodexvantaos-00000

=============
Gate Feedback
=============

:Version: 1.0.0
:Status: informative

Feedback Channels
-----------------

Gate feedback is collected through the following channels:

**GitHub Issues**: File an issue in the ``mycodexvantaos`` repository with the
label ``gate-feedback``. Include the gate ID, the observed behavior, and the
expected behavior.

**Monthly Gate Review**: The platform governance council reviews gate performance
metrics, failure patterns, and feedback items monthly.

**Post-Incident Reviews**: P1 gate failures trigger a post-incident review that
may result in gate improvements.

Feedback Categories
-------------------

- **False Positive**: Gate fails on a compliant artifact. Requires immediate investigation.
- **False Negative**: Gate passes on a non-compliant artifact. Treated as P1 security incident.
- **Performance**: Gate evaluation is too slow. Tracked as SLO violation.
- **Usability**: Gate error messages are unclear. Addressed in next minor release.
- **Coverage Gap**: A compliance requirement is not covered by any gate. Triggers new gate proposal.
