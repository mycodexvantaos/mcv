.. path: unified-gates/gate/4-execution/gate-monitoring.rst
.. governanceCode: mycodexvantaos-00000

===============
Gate Monitoring
===============

:Version: 1.0.0
:Status: normative

Monitoring Architecture
-----------------------

Gate monitoring is implemented through the platform observability stack.
Gate metrics are emitted as structured events to ``mycodexvantaos-event-bus``
and consumed by the platform monitoring service.

Monitoring Dimensions
---------------------

**Gate Health**: Pass/fail rates, evaluation latency, waiver count, evidence integrity.

**Pipeline Health**: Block rate, layer completion rates, run duration, artifact promotion rate.

**Governance Health**: Lifecycle compliance, owner registry completeness, catalog drift.

Monitoring Integration
----------------------

Gate monitoring integrates with:

- **Prometheus**: Metrics exported via ``/metrics`` endpoint on the gate evaluation service.
- **Grafana**: Pre-built dashboards for gate health, pipeline health, and governance health.
- **PagerDuty**: Alert routing for critical gate failures and evidence chain integrity violations.
- **Audit Log**: All monitoring events are written to the immutable audit log.
