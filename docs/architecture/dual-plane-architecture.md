# Dual-Plane Architecture

## Concept

The platform is divided into two planes that communicate exclusively through contracts:

### TypeScript Control Plane

The control plane handles:
- **API Gateway**: Request routing, authentication, rate limiting
- **Policy Engine**: Declarative policy evaluation and enforcement
- **Service Registry**: Catalog of all services and their capabilities
- **Resource Management**: CRUD operations on universal resources
- **Audit Logging**: Comprehensive event recording
- **Job Dispatch**: Enqueue work items for the intelligence plane

### Python Intelligence Plane

The intelligence plane handles:
- **Knowledge Pipeline**: Document parsing, embedding generation, semantic clustering
- **Agent Orchestration**: LLM-powered chat, tool use, reasoning chains
- **Vector Operations**: Similarity search, embedding management
- **Dream System**: Automated memory consolidation and insight extraction
- **Evaluation**: Quality metrics, regression testing, performance benchmarking

## Communication Boundary

Cross-plane communication uses these contract types:

| Contract Type | Format | Direction | Purpose |
|---|---|---|---|
| Service Definition | YAML | TS -> Both | Service capabilities and interfaces |
| Event Contract | YAML | Both -> Both | Asynchronous event schemas |
| Policy Contract | YAML | TS -> Python | Policy rules for intelligence operations |
| JSON Schema | JSON | Both -> Both | Data validation schemas |
| Job Table | SQL (D1) | TS -> Python | Work dispatch queue |
| Report | JSON | Python -> TS | Results and status updates |

## Communication Flow

```
[TS API] --request--> [Policy Engine] --evaluate--> [Job Table]
                                                    |
[TS Audit] <--report-- [Python Worker] <--poll-----+
                         |
                    [Process]
                         |
                    [Write Result]
                         |
                    [TS Audit Log] <--event-- [TS Event Bus]
```

## Deployment Topology

- **Cloudflare Workers**: Stateless TS services with D1/KV/R2 bindings
- **Docker**: Self-hosted TS services + Python workers
- **Kubernetes**: Production deployment with auto-scaling
- **Local**: Development runtime with all services on localhost
