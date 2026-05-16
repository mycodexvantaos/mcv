# Platform Governance Hardening — Milestone Todo

## PR 44: Policy Enforcement Runtime
- [x] Create `packages/mycodexvantaos-policy-model/src/index.ts` with full type system
- [x] Create `services/mycodexvantaos-service-policy-engine/src/index.ts` with evaluation engine
- [x] Update both package.json files with correct dependencies
- [x] Add tsconfig.json to both packages (already existed)
- [x] Add tests for policy-model (32 tests pass)
- [x] Add tests for policy-engine service (28 tests pass)
- [x] Add POST /v1/policies/evaluate route to api-node
- [x] Verify all existing 107 tests still pass
- [x] Start server and test policy evaluation via curl

## PR 45: Audit Enforcement Middleware
- [x] Add `withAudit()` wrapper function in api-node
- [x] Wrap all state-changing routes (POST) with withAudit()
- [x] Add audit enforcement check in server (block un-audited POST routes)
- [x] Test: all POST routes produce withAudit audit events
- [x] Verify existing tests still pass

## PR 46: Knowledge Trace Enforcement
- [x] Strengthen POST /v1/knowledge/answer to reject knowledge_assisted=true without valid retrieval_receipt_id
- [x] Test enforcement via curl (returns 403)
- [x] Verify existing tests still pass

## PR 47: Memory Dream Safety Enforcement
- [x] Add POST /v1/dream/runs/:id/review endpoint
- [x] Add POST /v1/dream/runs/:id/apply endpoint
- [x] Add POST /v1/dream/runs/:id/rollback endpoint
- [x] Enforce: auto-apply disabled by default (must review before apply)
- [x] Enforce: delete forbidden in MVP
- [x] Enforce: architecture decisions require review
- [x] Add before_json/after_json on apply and rollback responses
- [x] Test all flows via curl
- [x] Verify existing tests still pass

## PR 48: Contract Enforcement CI
- [x] Add `pnpm governance:check` script
- [x] Create `.github/workflows/governance-check.yml`
- [x] Verify governance:check runs cleanly

## PR 49: Cloudflare-first Launch Skeleton
- [x] Create `apps/api-worker/` with Cloudflare Worker
- [x] Implement GET /v1/health
- [x] Implement GET /v1/services
- [x] Implement GET /v1/resource-kinds
- [x] Implement POST /v1/audit/events
- [x] Add wrangler.toml
- [x] Verify worker builds

## PR 50: Self-hostable Docker Runtime
- [x] Create `infra/docker-compose/docker-compose.yaml`
- [x] Create Dockerfile for api-node
- [x] Create Dockerfile for dream-worker
- [x] Create startup script
- [x] Test docker-compose up

## Final
- [x] Run all 107+ tests, verify zero failures
- [x] Commit and push all PRs
- [x] Update README with platform status
