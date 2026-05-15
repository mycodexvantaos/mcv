# MyCodeXvantaOS Platform Architecture

> A cloudflare-first, multi-runtime, self-hostable AI-native service platform
> built on five constitutional models with a three-phase startup strategy.

See [PLATFORM_ARCHITECTURE.md](../PLATFORM_ARCHITECTURE.md) for the complete architecture document.

## Quick Reference

- **Five Constitutional Models:** Service Catalog, Resource Model, Policy Model, Audit Model, Knowledge Model
- **Three Phases:** Cloudflare-first (MVP) → Portable Core → Self-hostable
- **8 MVP Services:** identity, workspace, knowledge-store, knowledge-search, agent-chat, model-byok, audit-log, usage-meter
- **Architecture Pattern:** Port/Adapter (Hexagonal) — core/ has zero cloud dependencies
- **Audit Integrity:** SHA-256 chain with closed-loop pairing

## Key Files

| Category              | Path                                             |
| --------------------- | ------------------------------------------------ |
| Constitutional Models | `contracts/*.yaml`                               |
| Service Definitions   | `contracts/service-definitions/*.yaml`           |
| JSON Schemas          | `contracts/schemas/*.json`                       |
| Core Models           | `core/index.ts`                                  |
| Port Interfaces       | `ports/index.ts`                                 |
| Cloudflare Adapters   | `adapters/cloudflare/*.ts`                       |
| Application Services  | `application/*-service.ts`                       |
| Runtime Adapters      | `runtimes/*/adapter.ts`                          |
| D1 Migration          | `migrations/d1/001_initial_schema.sql`           |
| Wrangler Configs      | `infra/cloudflare/workers/wrangler.*.toml`       |
| Docker Compose        | `infra/docker-compose/docker-compose.yaml`       |
| Dockerfiles           | `infra/docker/Dockerfile.*`                      |
| Validation Tool       | `tools/validate-contracts.ts`                    |
| Generator Tool        | `tools/generate-service.ts`                      |
| Integrity Verifier    | `tools/verify-integrity.ts`                      |
| CI Pipeline           | `.github/workflows/platform-constitution-ci.yml` |
