# 🎯 Platform Control Plane Expansion — 雙語架構擴充

**Milestone**: `platform-control-plane-expansion`
**Status**: 進行中
**PR**: 待建立

---

## Sec.5 TypeScript 控制平面套件 (8 packages)

- [x] packages/mycodexvantaos-service-catalog/
- [x] packages/mycodexvantaos-resource-model/
- [x] packages/mycodexvantaos-policy-model/
- [x] packages/mycodexvantaos-audit-model/
- [x] packages/mycodexvantaos-knowledge-model/
- [x] packages/mycodexvantaos-memory-model/
- [x] packages/mycodexvantaos-runtime-model/
- [x] packages/mycodexvantaos-contracts-sdk/

## Sec.7 控制平面服務 (12 missing services)

- [x] services/mycodexvantaos-service-workspace/
- [x] services/mycodexvantaos-service-resource-registry/
- [x] services/mycodexvantaos-service-policy-engine/
- [x] services/mycodexvantaos-service-audit-log/
- [x] services/mycodexvantaos-service-usage-meter/
- [x] services/mycodexvantaos-service-knowledge-store/
- [x] services/mycodexvantaos-service-knowledge-search/
- [x] services/mycodexvantaos-service-knowledge-trace/
- [x] services/mycodexvantaos-service-agent-chat/
- [x] services/mycodexvantaos-service-model-byok/
- [x] services/mycodexvantaos-service-memory-store/
- [x] services/mycodexvantaos-service-memory-capture/

## Sec.9-10 Contracts: Service Definitions (5 missing)

- [x] contracts/service-definitions/resource-registry.yaml
- [x] contracts/service-definitions/policy-engine.yaml
- [x] contracts/service-definitions/knowledge-trace.yaml
- [x] contracts/service-definitions/memory-store.yaml
- [x] contracts/service-definitions/memory-capture.yaml

## Sec.11 Resource Kind Contracts (16 files)

- [x] contracts/resource-kinds/ (目錄 + 16 YAML files)

## Sec.12 Event Contracts (split into separate files)

- [x] contracts/events/audit-events.yaml
- [x] contracts/events/knowledge-events.yaml
- [x] contracts/events/memory-events.yaml
- [x] contracts/events/agent-events.yaml
- [x] contracts/events/usage-events.yaml
- [x] contracts/events/runtime-events.yaml

## Sec.13 Policy Contracts (5 files)

- [x] contracts/policies/ (目錄 + 5 YAML files)

## Sec.14 JSON Schemas (missing ones)

- [x] contracts/schemas/policy.schema.json
- [x] contracts/schemas/knowledge-model.schema.json
- [x] contracts/schemas/memory-model.schema.json
- [x] contracts/schemas/runtime-adapter.schema.json

## Sec.15 D1 Migrations (8 new migration files)

- [x] migrations/d1/0002-service-catalog.sql ~ 0009-memory-dream.sql

## Sec.16 Python Intelligence Plane (4 new packages + 2 new apps)

- [x] python/packages/mycodexvantaos-knowledge-pipeline/
- [x] python/packages/mycodexvantaos-agent-worker/
- [x] python/packages/mycodexvantaos-vector-tools/
- [x] python/packages/mycodexvantaos-evaluation/
- [x] python/apps/knowledge-worker/
- [x] python/apps/agent-worker/

## Sec.20 Runtimes (1 missing)

- [x] runtimes/local/

## Sec.21 Cloudflare Providers (5 missing)

- [x] providers/mycodexvantaos-provider-cloudflare-d1/
- [x] providers/mycodexvantaos-provider-cloudflare-kv/
- [x] providers/mycodexvantaos-provider-cloudflare-r2/
- [x] providers/mycodexvantaos-provider-cloudflare-workers-ai/
- [x] providers/mycodexvantaos-provider-cloudflare-vectorize/

## Sec.22 Apps (2 missing)

- [x] apps/api-node/
- [x] apps/admin-console/

## Sec.24 Documentation

- [x] docs/architecture/platform-overview.md
- [x] docs/architecture/dual-plane-architecture.md
- [x] docs/architecture/existing-service-repositioning.md
- [x] docs/service-catalog/service-catalog-overview.md
- [x] docs/resource-model/resource-model-overview.md
- [x] docs/policy-model/policy-model-overview.md
- [x] docs/audit-model/audit-model-overview.md
- [x] docs/knowledge-model/knowledge-model-overview.md
- [x] docs/memory-model/memory-model-overview.md
- [x] docs/memory-dream/auto-dream-flow.md
- [x] docs/runtime/*.md (4 files)
- [x] docs/self-hostable/self-hostable-overview.md
- [x] docs/migration/current-audit-baseline.md

## Sec.25 Tools (validators + dream tools)

- [x] tools/validators/ (6 validator scripts)
- [x] tools/dream/ (2 dream scripts)
- [x] tools/generators/, tools/seed/, tools/migrations/, tools/audit/

## Sec.26 CI/CD Workflows (9 new workflows)

- [x] .github/workflows/schema-check.yml
- [x] .github/workflows/contract-check.yml
- [x] .github/workflows/service-catalog-check.yml
- [x] .github/workflows/resource-model-check.yml
- [x] .github/workflows/policy-check.yml
- [x] .github/workflows/audit-check.yml
- [x] .github/workflows/memory-dream-check.yml
- [x] .github/workflows/cross-language-contract-check.yml

## Sec.29 驗證 & 合併

- [x] TypeScript 編譯通過 (377 tests still pass)
- [x] Python CI 通過 (6/6 tests)
- [x] 建立 feature branch + PR + 合併至 main
