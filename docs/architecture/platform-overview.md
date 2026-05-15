# Platform Overview

## MyCodexVantaOS

MyCodexVantaOS is a self-hostable AI operating system built on a bilingual architecture:
a **TypeScript Control Plane** for API orchestration, policy enforcement, and audit logging,
paired with a **Python Intelligence Plane** for ML/NLP processing, knowledge pipelines,
and agent orchestration.

## Architecture Principles

1. **Bilingual by Design**: TypeScript for control, Python for intelligence
2. **Contract-First**: All cross-plane communication via JSON Schema, YAML contracts, and event streams
3. **No Direct Imports**: TS and Python never import each other; they communicate through contracts
4. **Incremental Adoption**: Existing services are repositioned, not rewritten
5. **Cloudflare as One Runtime**: Not the core platform, but one deployment target among many

## Core Models (The 5 Divine Models)

1. **Service Catalog** - Registry of all platform services
2. **Resource Model** - Universal resource abstraction with kind system
3. **Policy Model** - Declarative policy enforcement engine
4. **Audit Model** - Comprehensive audit trail for all operations
5. **Knowledge Model** - Document ingestion, embedding, and retrieval

## Package Naming Convention

All packages use the `@mycodexvantaos/` prefix with lowercase kebab-case:
- TS Packages: `@mycodexvantaos/service-catalog`
- Python Packages: `mycodexvantaos-knowledge-pipeline`
- Services: `@mycodexvantaos/service-workspace`
- Providers: `@mycodexvantaos/provider-cloudflare-d1`

## Quick Links

- [Dual-Plane Architecture](./dual-plane-architecture.md)
- [Existing Service Repositioning](./existing-service-repositioning.md)
