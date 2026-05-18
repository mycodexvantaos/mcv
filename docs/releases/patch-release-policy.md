# Patch Release Policy

This document defines the criteria, process, and templates for patch releases (vX.Y.Z where Z > 0) in the MyCodeXvantaOS project.

---

## Scope

This policy applies to all patch releases following a stable release. Patch releases are intended for:

1. **Security patches** — Critical or high-severity CVE remediations
2. **Bug fixes** — Runtime defects with no API surface changes
3. **Documentation-only patches** — Corrections to documentation without runtime changes

Patch releases **must not** introduce new features, API changes, or breaking changes. Those belong in minor (vX.Y+1.0) or major (vX+1.0.0) releases.

---

## Release Type Classification

| Type | Criteria | Example |
|------|----------|---------|
| **Security patch** | CVE remediation, dependency security update, auth/authz fix | `undici` CVE fix |
| **Runtime bug fix** | Defect in production code path, data corruption, crash fix | API response error |
| **Doc-only patch** | Typo, outdated reference, missing documentation | README correction |
| **Dependency update** | Non-security dep update that fixes a bug | peer dep conflict fix |

---

## Patch Release Criteria

A patch release may be shipped when **all** of the following are met:

### Required Gates

| Gate | Description |
|------|-------------|
| **P001: CI Green** | All CI checks pass on the patch branch |
| **P002: Scope Validation** | Changes are strictly patch-scope (no new features, no API changes) |
| **P003: Security Review** | For security patches: CVE advisory linked, affected versions documented |
| **P004: Regression Test** | Existing tests pass; new tests added for the bug/CVE if applicable |
| **P005: Release Notes** | Patch release notes drafted per template below |
| **P006: Changelog Updated** | CHANGELOG.md updated with patch entry |

### Optional Gates (Recommended)

| Gate | Description |
|------|-------------|
| **P007: SBOM Updated** | Software Bill of Materials regenerated if deps changed |
| **P008: Provenance** | Build provenance re-generated for new artifacts |

---

## Patch Release Process

### Step 1: Branch Creation

```bash
# Branch from the stable tag
git checkout v0.1.0
git checkout -b fix/v0.1.1-<short-description>
```

### Step 2: Apply Fix

Apply the minimal change required. For dependency updates:

```bash
# Update the specific package
pnpm update <package>@<patched-version> --no-frozen-lockfile
```

### Step 3: Validation

```bash
# Run full CI locally
pnpm typecheck
pnpm lint
pnpm test
pnpm audit
```

### Step 4: PR and Review

- Create PR targeting `main`
- PR title format: `fix(<scope>): <description> (#<issue>)`
- Link to the issue and CVE advisory if applicable
- Require at least 1 reviewer approval

### Step 5: Tag and Release

After PR is merged to `main`:

```bash
# Create annotated tag
git tag -a v0.1.1 -m "v0.1.1: <brief description>"
git push origin v0.1.1

# Create GitHub Release
gh release create v0.1.1 \
  --title "v0.1.1: <brief description>" \
  --notes-file docs/releases/v0.1.1.md
```

### Step 6: Post-Release

- Close related issues
- Update milestone
- Announce in relevant channels

---

## Security Patch Path

For **critical or high-severity CVEs** that require immediate action:

1. **Triage** — Assess exploitability in production context (Cloudflare Pages deployment)
2. **Classify** — Determine if transitive dep (upstream fix needed) or direct dep (can fix now)
3. **Remediate** — Apply fix or document accepted risk with timeline for upstream fix
4. **Ship** — Follow standard patch process with expedited review (same-day if critical)

### Accepted Risk Documentation

When a CVE cannot be immediately fixed (e.g., in a deep transitive dependency), document:

```markdown
## Accepted Risk: <CVE-ID>

- **Package**: <package>@<version>
- **Severity**: <critical|high|moderate|low>
- **Exploitability in production**: <Not exploitable / Conditional / Exploitable>
- **Reason not fixed**: <upstream not patched / breaking change required>
- **Timeline**: <expected fix in vX.Y.Z / waiting for upstream>
- **Mitigation**: <runtime mitigation if any>
```

---

## Doc-Only Patch Process

Documentation-only patches follow a simplified process:

1. Branch from `main` (not from stable tag)
2. Apply documentation changes only
3. PR with label `doc-only`
4. Single reviewer approval sufficient
5. No new tag required — doc patches are released as part of the next patch release

---

## Patch Release Template

See `docs/releases/v0.1.1-template.md` for the patch release notes template.

---

## CI Requirements

Patch releases must pass the **same CI gates** as stable releases:

- TypeScript compilation (`pnpm typecheck`)
- Linting (`pnpm lint`)
- Unit tests (`pnpm test`)
- Contract validation (`pnpm contracts:validate`)
- Schema validation (`pnpm schemas:validate`)
- Security scan (CodeQL)
- `pnpm audit` — no new high/critical CVEs introduced by the patch

---

## References

- Stable release policy: `docs/releases/promotion-policy.md`
- Signing policy: `release/policies/signing-policy.json`
- v0.1.0 stable release: `docs/releases/v0.1.0.md`
