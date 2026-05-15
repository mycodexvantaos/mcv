# Service Catalog Overview

## Purpose

The Service Catalog is the central registry for all platform services. It provides:

- Service discovery and capability lookup
- Health monitoring and status tracking
- Dependency graph management
- Contract binding (linking services to their event/policy contracts)

## Architecture

The catalog is implemented as a TypeScript control plane service:

- **Package**: `@mycodexvantaos/service-catalog`
- **Contract**: `contracts/service-definitions/service-catalog.yaml`
- **Events**: `contracts/events/audit-events.yaml`
- **Schema**: `contracts/schemas/service-definition.schema.json`

## Service Registration

Services self-register at startup with:

1. Service name and version
2. Capability list (CRUD operations, events produced/consumed)
3. Health check endpoint
4. Contract references (event schemas, policy contracts)

## Integration Points

- **Policy Engine**: Checks catalog for service capabilities before policy evaluation
- **Audit Log**: Records all catalog mutations
- **Resource Registry**: Links resources to owning services
- **Knowledge Trace**: Tracks which services handle knowledge operations
