# ADR-0012: Relocate ArgoCD Manifests Out of `.github/workflows/`

## Status

Accepted — 2026-05-21

## Context

GitHub Actions auto-discovers and parses every YAML file under `.github/workflows/` (recursively, in some runner configurations and via security actions that pre-scan workflow files) as a GitHub Actions workflow definition.

The repository contained Kubernetes / ArgoCD manifests under `.github/workflows/argocd/`:

```
.github/workflows/argocd/deployment.yaml          # Kubernetes Deployment
.github/workflows/argocd/kustomization.yaml       # Kustomize Kustomization
.github/workflows/argocd/base/naming-spec-v1.md
```

These files use Kubernetes top-level keys (`apiVersion`, `kind`, `metadata`, `spec`, `resources`) which are not valid GitHub Actions workflow keys. As a result:

- `actionlint` reported `syntax-check` errors for both YAML files (missing `on`, missing `jobs`, unexpected keys).
- After commit `ff31d9c`, all push-triggered workflows on `main` returned `startup_failure` (10 of 10 most recent runs as of 2026-05-21T16:25Z), including:
  - Unified CI Pipeline
  - CodeQL Advanced
  - Deploy to Cloudflare Pages (Production)
  - Gitleaks Scan
  - Governance Check
  - Semgrep SAST
  - Release Drafter / Release Candidate Check
  - Unified CD Pipeline
  - No Section Sign Symbol

This violates the project governance principle:

> Production-exposed Critical/High = 0
> Governance Check must remain green on `main`.

## Decision

Move the misplaced manifests out of `.github/workflows/` into the canonical top-level `argocd/` directory (which already exists and contains `Applications.yaml`, `Project.yaml`):

```
.github/workflows/argocd/deployment.yaml          → argocd/deployment.yaml
.github/workflows/argocd/kustomization.yaml       → argocd/kustomization.yaml
.github/workflows/argocd/base/naming-spec-v1.md   → argocd/base/naming-spec-v1.md
```

Remove the empty `.github/workflows/argocd/` directory tree.

No other changes. No workflow content modified. No dependencies touched. No CI/CD architecture change.

## Rationale

- **Root-cause fix.** The `startup_failure` is caused exclusively by the GitHub Actions workflow parser rejecting non-workflow YAML under `.github/workflows/`. Removing the misplaced files removes the root cause.
- **Minimal reversible change.** Only file relocation; no content edits. Fully reversible by `git revert`.
- **Naming convention compliance.** The destination `argocd/` already exists and follows the kebab-case top-level directory convention used elsewhere in the repo.
- **No scope expansion.** Does not modify Dockerfile, Node.js / pnpm versions, package manager, runtime architecture, release identity, or unrelated dependencies.
- **CodeQL governance preserved.** No language matrix change; `javascript-typescript` and `python` only.

## Consequences

### Positive

- All push-triggered workflows resume normal execution on `main`.
- `actionlint` `syntax-check` count drops from 11 to 0.
- Governance Check workflow can run again, restoring `Production-exposed Critical/High = 0` enforcement.
- ArgoCD manifests are now collocated with existing `argocd/Applications.yaml` and `argocd/Project.yaml`, improving discoverability for GitOps operators.

### Negative / Trade-offs

- Any external automation referencing the old paths under `.github/workflows/argocd/` must update its paths. Repository search confirmed no internal references exist (verified via `grep -r "\.github/workflows/argocd"`).
- Pre-existing unrelated `actionlint` warning remains: `softprops/action-gh-release@v1` in `.github/workflows/release.yml` (deferred — not part of this fix's root cause; tracked separately).

## Alternatives Considered

1. **Add `paths-ignore` to all 50+ workflows** — Rejected. Does not work for `startup_failure`; the parser fails before workflow filters are evaluated. Also massively expands scope.
2. **Rename files with a non-`.yaml` extension** — Rejected. ArgoCD/Kustomize toolchains require `.yaml`.
3. **Convert manifests into a workflow that applies them** — Rejected. Out of scope; introduces new runtime behavior.
4. **Delete the manifests** — Rejected. They are referenced from the broader GitOps plan and must be preserved.

## Risk

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hidden external reference to old path | Low | Low | Verified absent via repo-wide grep; rollback is `git revert` |
| ArgoCD ApplicationSet pointing to old path | Low | Medium | Inspected `argocd/Applications.yaml`; uses repo-relative paths under `argocd/`, not `.github/workflows/argocd/` |
| Breaks existing kustomize build | Low | Medium | `kustomization.yaml` uses relative paths to sibling directories; relative resolution unchanged after move |

## Rollback

```bash
git revert <commit-sha>
```

Or manually:

```bash
git mv argocd/deployment.yaml .github/workflows/argocd/deployment.yaml
git mv argocd/kustomization.yaml .github/workflows/argocd/kustomization.yaml
git mv argocd/base/naming-spec-v1.md .github/workflows/argocd/base/naming-spec-v1.md
```

Note: rollback re-introduces the `startup_failure`; not recommended.

## Traceability

- **Root-cause evidence:** `actionlint` output before fix — 11 `syntax-check` errors on `.github/workflows/argocd/*.yaml`.
- **Validation evidence:** `actionlint` output after fix — 0 `syntax-check` errors.
- **Failing runs (pre-fix):** GitHub Actions runs `26238875257`, `26238874646`, `26238873730`, `26238872976`, `26238872158`, `26238871622`, `26238870864`, `26238869976`, `26238869236`, `26238868664` (all `startup_failure`).
- **Task type:** F (Emergency Blocker) + C (CI/CD Workflow Fix)
- **Priority:** P0 (CI on `main` red; security scanners disabled)
- **Charter compliance:** Minimal Change Principle ✓, No Scope Expansion ✓, CodeQL Governance Preserved ✓, Release Identity Untouched ✓.

## Completion Criteria

- [x] `.github/workflows/argocd/` no longer exists.
- [x] `argocd/deployment.yaml`, `argocd/kustomization.yaml`, `argocd/base/naming-spec-v1.md` exist.
- [x] `actionlint -no-color -oneline -shellcheck= -pyflakes=` reports 0 `syntax-check` errors.
- [ ] Post-merge: next push to `main` produces non-`startup_failure` workflow runs.
- [ ] Post-merge: Governance Check workflow status returns to `success` or actionable `failure` (not `startup_failure`).
