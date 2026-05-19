# Runbook: GitHub Support — v0.1.0 Immutability Record

## Summary

The exact tag name `v0.1.0` cannot be recreated in repository `mycodexvantaos/mycodexvantaos` due to a stale GitHub internal Release Immutability Record. This runbook provides the steps for an organization administrator to file a GitHub Support ticket requesting cleanup.

## Affected Resource

| Field             | Value                                                    |
| ----------------- | -------------------------------------------------------- |
| Repository        | `mycodexvantaos/mycodexvantaos`                          |
| Affected tag name | `v0.1.0`                                                 |
| Target commit     | `1371a8966c3047bbd95e87308a0bc81e6b72bb41`               |
| Symptom           | HTTP 422 — "Reference update failed"                     |
| Root cause        | GitHub internal Release Immutability Record for `v0.1.0` |

## Evidence

The following tests confirm the issue is specific to the exact tag name `v0.1.0`:

| Tag Name      | Result                  | Notes                           |
| ------------- | ----------------------- | ------------------------------- |
| `v0.1.0-test` | ✅ Created successfully | Same repo, same permissions     |
| `v0.1.0.0`    | ✅ Created successfully | Similar name, no block          |
| `v0.1.0`      | ❌ HTTP 422             | Only this exact name is blocked |
| `v0.1.0-rc.1` | ✅ Created and deleted  | Prerelease tag works fine       |

## Rules and Settings Verified

The following have been checked and do NOT block the tag:

- Repository rulesets: No active ruleset blocks `refs/tags/v0.1.0`
- Organization rulesets: No active ruleset blocks `refs/tags/v0.1.0`
- Tag protection rules: No tag protection rule exists for `v0.1.0`
- Release Immutability setting: Currently **disabled**
- Branch protection: Not applicable to tag creation
- Workflow permissions: Token has `contents: write` scope
- PAT scope: Full repository access confirmed

## Timeline of Events

1. GitHub Release for `v0.1.0` was created while Release Immutability was **enabled**
2. The release and tag were deleted during a release recovery operation
3. Release Immutability was subsequently **disabled**
4. Attempts to recreate `v0.1.0` fail with HTTP 422
5. Other tag names (including `v0.1.0.0`, `v0.1.0-test`) can be created without issue

## GitHub Support Ticket Template

### Ticket Title

```
Unable to recreate tag v0.1.0 due to stale GitHub Release Immutability Record
```

### Ticket Body

Copy and paste the following into the GitHub Support form:

---

Hello GitHub Support,

We need assistance with a repository-level release/tag immutability issue.

**Repository:** `mycodexvantaos/mycodexvantaos`

**Affected tag:** `v0.1.0`

**Problem:**

We previously created a GitHub Release for `v0.1.0` while Release Immutability was enabled. The release/tag was later deleted during a release recovery operation. After disabling Release Immutability, we still cannot recreate the exact tag name `v0.1.0`.

**Observed behavior:**

| Tag Name      | Result                                          |
| ------------- | ----------------------------------------------- |
| `v0.1.0-test` | Can be created successfully                     |
| `v0.1.0.0`    | Can be created successfully                     |
| `v0.1.0`      | Fails with HTTP 422 / "reference update failed" |

**We have verified:**

- Repository rulesets do not block this tag
- Organization rulesets do not block this tag
- Tag protection rules do not block this tag
- Release Immutability is now disabled
- Other tag names can be created without issue
- The failure only affects the exact tag name `v0.1.0`

**Expected behavior:**

We need to recreate annotated tag `v0.1.0` at commit:

```
1371a8966c3047bbd95e87308a0bc81e6b72bb41
```

**Request:**

Please clear or repair the stale internal immutability record for tag/release name `v0.1.0` so that we can recreate the tag and GitHub Release.

**Business impact:**

This blocks stable release recovery and supply-chain integrity restoration. Our release artifacts, SBOM, provenance, and documentation all reference `v0.1.0`.

Thank you.

---

## Post-Resolution Steps

If GitHub Support successfully clears the immutability record:

1. Create the annotated tag:

```bash
git tag -a v0.1.0 1371a8966c3047bbd95e87308a0bc81e6b72bb41 -m "Release v0.1.0 - Stable release

Artifact commit: 1371a8966c3047bbd95e87308a0bc81e6b72bb41
This is the official v0.1.0 stable release of MyCodeXvantaOS.
All 15 CI checks passed. PR #85 merged."

git push origin v0.1.0
```

2. Create the GitHub Release:

```bash
gh release create v0.1.0 \
  --repo mycodexvantaos/mycodexvantaos \
  --target 1371a8966c3047bbd95e87308a0bc81e6b72bb41 \
  --title "MyCodeXvantaOS v0.1.0 Stable Release" \
  --notes-file docs/releases/0.1.0.md \
  --latest
```

3. Upload release artifacts:

```bash
gh release upload v0.1.0 \
  release/artifacts/0.1.0/release-manifest.json \
  release/artifacts/0.1.0/artifact-digests.json \
  release/artifacts/0.1.0/sbom.cyclonedx.json \
  release/artifacts/0.1.0/provenance.intoto.json \
  release/artifacts/0.1.0/verification-summary.json \
  release/artifacts/0.1.0/supply-chain-summary.json \
  release/artifacts/0.1.0/soak-report.json \
  release/artifacts/0.1.0/promotion-evaluation.json
```

4. Verify:

```bash
git ls-remote --tags origin | grep v0.1.0
gh release view v0.1.0 --repo mycodexvantaos/mycodexvantaos
```

5. Close Issue #82.

## Fallback Plan

If GitHub Support cannot clear the record within 24–72 hours, see ADR-0001: `docs/adr/adr-0001-v0.1.0-release-recovery-tag.md` for the fallback publication tag strategy (`v0.1.0.0`).

## Reference

- Issue #82: https://github.com/mycodexvantaos/mycodexvantaos/issues/82
- Target commit: `1371a8966c3047bbd95e87308a0bc81e6b72bb41`
- ADR-0001: `docs/adr/adr-0001-v0.1.0-release-recovery-tag.md`
