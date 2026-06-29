.. path: unified-gates/gate/6-domain-ai/gate-multi-tenant-isolation.rst
.. governanceCode: mycodexvantaos-50200

============================
Gate Multi-Tenant Isolation
============================

:Version: 1.0.0
:Status: normative

Overview
--------

The multi-tenant isolation gate validates that AI workloads are properly
isolated between tenants (workspaces, projects, or billing accounts) to
prevent data leakage, resource contention, and unauthorized access.

Isolation Dimensions
--------------------

**Data Isolation**: Model inputs, outputs, and intermediate states MUST NOT
be accessible across tenant boundaries. Validated via sandbox isolation checks.

**Resource Isolation**: CPU, GPU, memory, and storage quotas MUST be enforced
per tenant. Resource quota validation is performed by ``gate-17``.

**Network Isolation**: Tenant workloads MUST be isolated at the network layer.
Cross-tenant network access MUST be blocked by default.

**Credential Isolation**: API keys, secrets, and model weights MUST be scoped
to the tenant and MUST NOT be accessible by other tenants.

**Audit Isolation**: Audit logs for each tenant MUST be isolated and accessible
only to the tenant and authorized platform operators.

Gate Reference
--------------

Implemented by: ``gate-48-workload-runtime-sandbox-validation`` (l40) and
``gate-28-data-access-policy-validation`` (l20)
