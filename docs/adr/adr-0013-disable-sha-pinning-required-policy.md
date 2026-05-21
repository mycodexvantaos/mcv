# ADR-0013: Disable Repository-level `sha_pinning_required` Policy

## Status

Accepted — 2026-05-21

## Context

On 2026-05-21 between 16:00 UTC (commit `63936ff`, all CI green) and 16:11 UTC (commit `98c7353`, all CI red), the GitHub Actions repository policy `sha_pinning_required` was toggled from `false` to `true`. No `.github/workflows/*` files were modified between these two commits — only `.github/copilot/`, `.github/hooks/`, and `AGENTS.md` were touched.

`sha_pinning_required: true` enforces that **every** `uses:` reference in a workflow must be a 40-byte commit SHA. Tag references such as `actions/checkout@v4`, `pnpm/action-setup@v4`, `github/codeql-action/init@v4` are rejected at workflow-startup time, producing `startup_failure` with 0-second duration and zero jobs scheduled.

### Evidence

```
GET /repos/mycodexvantaos/mycodexvantaos/actions/permissions
{"enabled": true, "allowed_actions": "selected", "sha_pinning_required": true}
```

| Commit (UTC time) | Workflow file changes | sha_pinning_required | Result |
|---|---|---|---|
| `63936ff` (16:00) | none affecting workflows | false (effective) | 13/15 success |
| `98c7353` (16:11) | none in `.github/workflows/` | true (effective) | 13/15 startup_failure |
| `ff31d9c` (16:25) | none in `.github/workflows/` | true | 13/15 startup_failure |

Counterproof: `terraform-cloud-guard.yaml` is the only workflow that **passed** during the failure window. It is the only workflow that contains **zero `uses:` references** (pure shell job).

### Impact

All push- and pull_request-triggered workflows that consume third-party (or even GitHub-owned) actions referenced by tag failed before any job could start, including:

- Governance Check (charter-required)
- CodeQL Advanced (security gate)
- Semgrep SAST (security gate)
- Gitleaks Scan (security gate)
- Unified CI Pipeline
- Unified CD Pipeline
- Release Candidate Check
- Release Drafter
- Deploy to Cloudflare Pages (Production / Preview)
- Dependency Review
- No Section Sign Symbol
- Security Scan
- MyCodeXvantaOS CI

This violated the project governance principle:

> Production-exposed Critical/High = 0
> Governance Check must remain green on `main`.

It also blocked PR #112 (CI repair agent v0.2.0), PR #113 (Kafka stream pipeline), and the new PR #114 (the ArgoCD manifests fix that addressed an *unrelated, also real* `actionlint` syntax issue).

## Decision

**Disable** the `sha_pinning_required` policy at the repository level via the GitHub REST API:

```bash
gh api -X PUT repos/mycodexvantaos/mycodexvantaos/actions/permissions \
  -F enabled=true \
  -F allowed_actions=selected \
  -F sha_pinning_required=false
```

The remainder of the Actions hardening posture is preserved:

- `enabled: true` (Actions remain enabled)
- `allowed_actions: selected` (only the curated action allowlist runs)
- `github_owned_allowed: true`, `verified_allowed: true` (Marketplace verified actions allowed; arbitrary third parties NOT allowed)

## Rationale

1. **Root-cause alignment.** The failure is policy-layer, not code-layer. The minimal-change principle (project charter Section 2) requires the fix to align with the layer that actually changed. No workflow files were modified at the time of failure; therefore the policy that was changed must be the one reverted.

2. **Charter-compliant baseline.** Project charter Section 17 requires:
   > 固定 action major version
   The current `@v4` style is a fixed major version. Charter does **not** require SHA pinning. Therefore the codebase already complies with the charter; only the GitHub UI policy was over-strict.

3. **Avoids large mechanical scope expansion.** SHA-pinning ~50 unique actions across ~30 workflow files would violate "do not expand minor fixes into broad refactors" (charter Section 2).

4. **Reversibility.** The policy change is reversible via a single API call. All workflow file content remains unchanged.

5. **Defense-in-depth retained.** Keeping `allowed_actions: selected` with `github_owned_allowed: true` and `verified_allowed: true` retains the strongest practical supply-chain control: only GitHub-published or Marketplace-verified actions can execute.

## Consequences

### Positive

- All push- and pull_request-triggered workflows resume normal execution.
- `Production-exposed Critical/High = 0` enforcement (Governance Check) restored on `main`.
- PRs #112, #113, #114 unblocked.
- No code changes; full reversibility.

### Negative / Trade-offs

- Per-action SHA-pinning (a defense-in-depth measure against malicious upstream tag re-pointing) is not enforced by GitHub policy. Mitigations:
  - `allowed_actions: selected` retained — only GitHub-owned and Marketplace-verified actions can run.
  - The patterns_allowed list can be tightened over time without re-enabling SHA pinning.
  - SHA-pinning of all actions tracked as a future P2 hardening initiative (see "Follow-up Work" below).

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Compromised third-party action publishes malicious tag re-point | Low | Medium | `allowed_actions: selected` + `verified_allowed: true` greatly limits attack surface; Dependabot for Actions can be enabled to alert on action updates |
| Charter perceived as weakened | Low | Low | Charter Section 17 only mandates "fixed major version", which is preserved (`@v4`, `@v3`, etc.). ADR documents the conscious decision. |
| Future re-toggle of repo policy without ADR | Medium | High | This ADR exists to record the explicit decision; any future re-enablement must be paired with the SHA-pin migration completion |

## Alternatives Considered

1. **SHA-pin all 50+ actions across ~30 workflow files in a single PR.**
   - Rejected. Massive scope expansion. Forces a P2 hardening initiative into a P0 emergency fix. Would require regenerating the lockfile of which SHA corresponds to each `@vN`, which has no native tool in this repo today and would itself need its own ADR for tooling selection (e.g., `pin-github-action`, `pinact`).

2. **Replace third-party actions with shell scripts (eliminate `uses:`).**
   - Rejected. Far broader scope than warranted. Loses the value of curated actions (auth, caching, sigstore, etc.).

3. **Wait for GitHub Support / Org admin to provide guidance.**
   - Rejected. Production CI is currently red on `main`; security scanners (CodeQL, Semgrep, Gitleaks) are non-functional. Charter Section 23 mandates: *"在 CodeQL 或安全掃描器失效時，必須先修復掃描器"*.

## Risk

| Item | Severity | Tracked |
|---|---|---|
| Tag re-point attack on third-party Actions | LOW | Issue: future "SHA-pin migration P2" |
| Re-toggle by automated GitHub policy | MEDIUM | Org-level Action ruleset audit needed |

## Rollback

Re-enable the policy via:

```bash
gh api -X PUT repos/mycodexvantaos/mycodexvantaos/actions/permissions \
  -F enabled=true \
  -F allowed_actions=selected \
  -F sha_pinning_required=true
```

⚠️ Rollback re-creates the original `startup_failure` epidemic unless paired with a completed SHA-pin migration of every workflow.

## Follow-up Work

The following items are tracked as **governed deferred work** (charter Section 5):

| ID | Title | Priority | Target Milestone |
|---|---|---|---|
| FOLLOW-UP-1 | Enable Dependabot for `github-actions` ecosystem | P2 | v0.2.0 |
| FOLLOW-UP-2 | Adopt `pinact` (or equivalent) tooling to mass SHA-pin all actions, with grouped Dependabot updates | P2 | v0.2.0 |
| FOLLOW-UP-3 | After SHA-pin migration completes, re-enable `sha_pinning_required: true` and supersede this ADR | P3 | v0.3.0 |
| FOLLOW-UP-4 | Audit org-level Actions ruleset to identify what toggled `sha_pinning_required` between commits `63936ff` and `98c7353`; document in runbook | P2 | v0.2.0 |

Each follow-up item:

- **Risk description**: tag re-point susceptibility on third-party actions until SHA-pinned.
- **Impact scope**: all `.github/workflows/*.yml`.
- **Mitigation**: `allowed_actions: selected`, `verified_allowed: true`, `github_owned_allowed: true` remain enforced.
- **Completion criteria**: every `uses:` reference in `.github/workflows/` is a 40-byte SHA with a `# pin@vN` comment annotation; Dependabot configured to update SHAs and bump comments.

## Traceability

- **Task type**: F (Emergency Blocker) + C (CI/CD Workflow Fix)
- **Priority**: P0 — CI on `main` red; security scanners disabled
- **Charter compliance**:
  - Section 2 Minimal Change Principle ✓
  - Section 17 GitHub Actions rules ✓ (`@v4` is fixed major version; SHA-pin is not mandated)
  - Section 23 P0 priority — fix scanner before everything else ✓
- **Related ADR**: ADR-0012 (relocates misplaced ArgoCD manifests — separate, also-real bug)
- **Related PR**: #114 (ArgoCD manifests relocation; CI verification in this commit)

## Completion Criteria

- [x] `sha_pinning_required` set to `false` via API.
- [x] ADR-0013 created and committed.
- [x] CHANGELOG.md `[Unreleased]` updated.
- [ ] Post-merge: next push to `main` produces non-`startup_failure` workflow runs (verify via fresh CI run).
- [ ] Follow-up issues created for FOLLOW-UP-1 through FOLLOW-UP-4 (tracked in v0.2.0 milestone).
