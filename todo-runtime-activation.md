# 🚀 Platform Runtime Activation — 可運行閉環

**Milestone**: `platform-runtime-activation`
**Status**: 🔄 進行中
**Spectrum**: `spectrum-02-runtime-activation`

## 目標

將已完成的 control plane / contracts / Python intelligence plane 從靜態骨架升級為可執行、可驗證、可審計的最小 runtime 閉環。

---

## 核心閉環

### 閉環 1：Service Catalog Runtime
- [ ] contracts-sdk 載入 service-definitions
- [ ] service-catalog service 實作
- [ ] API: GET /v1/services
- [ ] API: GET /v1/services/:id

### 閉環 2：Resource Registry Runtime
- [ ] contracts-sdk 載入 resource-kinds
- [ ] resource-registry service 實作
- [ ] API: GET /v1/resource-kinds
- [ ] API: GET /v1/resource-kinds/:kind

### 閉環 3：Audit Event Runtime
- [ ] audit-log service 實作
- [ ] API: POST /v1/audit/events
- [ ] API: GET /v1/audit/events
- [ ] state-changing actions emit audit events

### 閉環 4：Knowledge Trace Runtime
- [ ] knowledge-search service 實作
- [ ] retrieval-receipt 建立
- [ ] answer-trace 建立
- [ ] API: POST /v1/knowledge/search
- [ ] API: GET /v1/knowledge/retrieval-receipts/:id
- [ ] API: GET /v1/knowledge/answer-traces/:id

### 閉環 5：Memory Dream Runtime
- [ ] Python dream-worker MVP
- [ ] CLI: dream run --mode dry-run
- [ ] TS integration: POST /v1/dream/run
- [ ] API: GET /v1/dream/runs/:id
- [ ] API: GET /v1/dream/runs/:id/actions

---

## PR 拆分

### PR 36: contracts-sdk runtime loader
- [ ] 實作 loadServiceDefinitions()
- [ ] 實作 loadResourceKinds()
- [ ] 實作 loadPolicyDefinitions()
- [ ] 實作 loadEventDefinitions()
- [ ] 實作 validateContract()
- [ ] 新增測試驗證所有 contracts 可載入

### PR 37: service-catalog runtime API
- [ ] service-catalog service 實作
- [ ] API: GET /v1/services
- [ ] API: GET /v1/services/:id
- [ ] 資料來源：contracts/service-definitions

### PR 38: resource-registry runtime API
- [ ] resource-registry service 實作
- [ ] API: GET /v1/resource-kinds
- [ ] API: GET /v1/resource-kinds/:kind
- [ ] 資料來源：contracts/resource-kinds

### PR 39: D1 / SQLite migration verifier
- [ ] tools/migrations/verify-d1-migrations.ts
- [ ] tools/migrations/verify-sqlite-migrations.ts
- [ ] 驗證關鍵 tables 存在
- [ ] 新增 package.json scripts

### PR 40: audit-log minimal runtime
- [ ] audit-log service 實作
- [ ] API: POST /v1/audit/events
- [ ] API: GET /v1/audit/events
- [ ] 使用 contracts/events/audit-events.yaml

### PR 41: memory-dream Python worker MVP
- [ ] python/packages/mycodexvantaos-memory-dream
- [ ] python/apps/dream-worker
- [ ] CLI: dream run --mode dry-run
- [ ] scan/group/detect conflicts/detect duplicates
- [ ] generate dream-actions & dream-report

### PR 42: memory-dream TS integration
- [ ] POST /v1/dream/run
- [ ] GET /v1/dream/runs/:id
- [ ] GET /v1/dream/runs/:id/actions
- [ ] TS creates dream-run & audit event
- [ ] Python generates report/actions

### PR 43: knowledge trace minimal runtime
- [ ] POST /v1/knowledge/search
- [ ] GET /v1/knowledge/retrieval-receipts/:id
- [ ] GET /v1/knowledge/answer-traces/:id
- [ ] 規則：無 retrieval receipt 不能標記 knowledge-assisted

---

## 新增 Scripts

- [ ] contracts:validate
- [ ] schemas:validate
- [ ] service-catalog:check
- [ ] resource-model:check
- [ ] policy:check
- [ ] events:check
- [ ] migration:verify:d1
- [ ] migration:verify:sqlite
- [ ] python:test
- [ ] python:lint
- [ ] python:typecheck
- [ ] dream:dry-run

---

## 新增範例資料

- [ ] examples/service-catalog/services.example.json
- [ ] examples/resource-kinds/resources.example.json
- [ ] examples/memory/memory-items.example.json
- [ ] examples/memory/dream-report.example.json
- [ ] examples/memory/dream-actions.example.json
- [ ] examples/knowledge/documents.example.json
- [ ] examples/knowledge/chunks.example.json
- [ ] examples/knowledge/retrieval-receipt.example.json
- [ ] examples/knowledge/answer-trace.example.json
- [ ] examples/audit/audit-events.example.json

---

## 驗收標準

- [ ] GET /v1/services works
- [ ] GET /v1/resource-kinds works
- [ ] POST /v1/audit/events works
- [ ] POST /v1/dream/run works in dry-run/proposal flow
- [ ] POST /v1/knowledge/search creates retrieval receipt
- [ ] 377 existing tests still pass
- [ ] Python tests pass
- [ ] contract validation passes
- [ ] migration verification passes

---

## Hard Rules

- TypeScript owns control, API, policy, audit
- Python owns memory dream and intelligence processing
- Contracts are the single source of truth
- No Cloudflare SDK imports inside core packages
- No destructive memory mutation in MVP
- Existing tests must remain passing
- Python tests must remain passing
- All new APIs must have basic tests
- All new runtime actions should emit audit-compatible events