# Infra Base — Architecture Document

## Purpose

`infra-base` provides the infrastructure foundation that all other CodexVanta OS services build upon. It abstracts resource provisioning behind Provider interfaces, enabling the same infrastructure definitions to target local development environments or cloud production deployments.

## Resource Model

```
┌──────────────────────────────┐
│       Resource Definition     │
│  (Declarative YAML/TS)       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Provisioner            │
│  ┌────────┐  ┌────────────┐ │
│  │ Native │  │ Cloud      │ │
│  │ Local  │  │ AWS/GCP/K8s│ │
│  └────────┘  └────────────┘ │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│    Provisioned Resource      │
│  (with health endpoint)      │
└──────────────────────────────┘
```

## Resource Types

| Type     | Native Implementation | Connected Implementation |
| -------- | --------------------- | ------------------------ |
| Compute  | Child processes       | Containers / VMs         |
| Storage  | Local filesystem      | S3 / GCS / Blob Storage  |
| Database | SQLite files          | PostgreSQL / MySQL       |
| Network  | Local ports           | Load balancers / Ingress |
| Queue    | In-memory             | Redis / Kafka / SQS      |
| Cache    | In-memory Map         | Redis / Memcached        |

## Environment Hierarchy

```
base.yaml          (shared defaults)
  ├── dev.yaml     (local development overrides)
  ├── staging.yaml (staging environment overrides)
  └── prod.yaml    (production environment overrides)
```

Each environment inherits from base and can override any resource definition.

## Health Monitoring

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Resource     │────▶│ Health       │────▶│ Alert        │
│ Health Check │     │ Aggregator   │     │ Router       │
│ (per-type)   │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
                           ┌────────────────────┼────────┐
                           ▼                    ▼        ▼
                     Notification         Dashboard   Auto-heal
                     Provider             Metric      Trigger
```

## Provisioning Lifecycle

1. **Define** — Declarative resource specification
2. **Plan** — Diff current state vs desired state
3. **Provision** — Create/update resources
4. **Verify** — Health check provisioned resources
5. **Register** — Add to resource inventory
6. **Monitor** — Continuous health monitoring
7. **Decommission** — Safe teardown with dependency check

## Design Principles

1. **Declarative Over Imperative** — Resources defined as desired state, not scripts
2. **Environment Parity** — Same definitions work across all environments
3. **Health-First** — Every resource has a health check from creation
4. **Safe Teardown** — Dependency-aware deprovisioning prevents orphaned resources
5. **Provider-Agnostic** — Infrastructure code doesn't know about specific cloud providers
