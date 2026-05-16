# Governance Hardening — Verification Checklist

## PR 44: Policy Enforcement Runtime
- [x] policy-model types correct and complete
- [x] policy-engine loads from contracts correctly
- [x] POST /v1/policies/evaluate returns correct decisions
- [x] Architecture decision memory merge → require-review
- [x] All 5 effects work: allow/deny/require-review/dry-run-only/audit-required
- [x] 60 tests pass (32 policy-model + 28 policy-engine)

## PR 45: Audit Enforcement Middleware
- [x] withAudit() wrapper works correctly
- [x] All POST routes wrapped with withAudit()
- [x] Audit enforcement blocks un-audited POST routes
- [x] No infinite audit recursion on POST /v1/audit/events
- [x] Audit events recorded with correct metadata

## PR 46: Knowledge Trace Enforcement
- [x] knowledge_assisted=true without receipt → rejected
- [x] knowledge_assisted=true with valid receipt → accepted
- [x] Proper error response with governance violation details

## PR 47: Memory Dream Safety Enforcement
- [x] Auto-apply disabled by default
- [x] Delete actions forbidden in MVP
- [x] Architecture decisions require review
- [x] before_json/after_json on apply/rollback
- [x] Review → Apply → Rollback flow works
- [x] Cannot apply without review approval
- [x] Cannot rollback without prior application

## PR 48: Contract Enforcement CI
- [x] pnpm governance:check runs cleanly
- [x] GitHub Actions workflow is correct
- [x] Validates contracts, policies, services, resource kinds

## PR 49: Cloudflare-first Launch Skeleton
- [x] Worker code uses actual workspace services
- [x] All required endpoints implemented
- [x] Worker bundles successfully
- [x] No Cloudflare SDK in core packages

## PR 50: Self-hostable Docker Runtime
- [x] docker-compose.yaml valid
- [x] Dockerfiles correct
- [x] Startup script works

## Cross-cutting
- [x] All 161 TS tests pass (8 test suites)
- [x] 6 Python tests pass
- [x] governance:check passes all 6 checks
- [x] Server starts and all endpoints respond
- [x] No import of Cloudflare in core packages
- [x] Live endpoint testing confirmed (policy eval, dream safety, knowledge trace, audit)
- [x] docs/self-hostable/docker-quickstart.md created
- [x] scripts/smoke/self-hosted-smoke.sh created and fixed

## Merge
- [x] Commit all new/modified files
- [x] Push branch to origin
- [x] Create PR via gh cli → PR #36
- [x] Merge to main → Merged (fast-forward) at 9596eb5
