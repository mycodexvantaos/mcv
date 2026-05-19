# Runbook: GitHub Support Request for v0.1.0 Release Identity Recovery

## Summary

The tags `v0.1.0` and `v0.1.0.0` are affected by GitHub internal Immutability Records. This prevents restoring the official stable release at the correct commit. This is a **Release Identity Recovery / Platform Support Blocker Event** — not an engineering or CI/CD issue.

## Current Status

```
v0.1.0 is technically release-ready but publication-blocked.
```

## Issue Details

| Field                  | Value                                       |
| ---------------------- | ------------------------------------------- |
| Repository             | `mycodexvantaos/mycodexvantaos`             |
| Blocked tag            | `v0.1.0` (HTTP 422 — GH013)                 |
| Invalid fallback tag   | `v0.1.0.0` (points to wrong commit)         |
| Correct release commit | `1371a8966c3047bbd95e87308a0bc81e6b72bb41`  |
| Root cause             | GitHub internal Release Immutability Record |

## Evidence

| Tag Name      | Result                      | Notes                              |
| ------------- | --------------------------- | ---------------------------------- |
| `v0.1.0-test` | ✅ Created successfully     | Same repo, same permissions        |
| `v0.1.0.0`    | ⚠️ Created but WRONG commit | Points to `e35af2a`, not `1371a89` |
| `v0.1.0`      | ❌ HTTP 422                 | Only this exact name is blocked    |
| `v0.1.0-rc.1` | ✅ Created and deleted      | Prerelease tag works fine          |

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
5. `v0.1.0.0` was created as a fallback test tag, but points to the wrong commit (`e35af2a`)
6. `v0.1.0.0` is now also immutable and cannot be deleted/recreated
7. Other tag names (`v0.1.0-test`, `v0.1.0-rc.1`) can be created without issue

## Action Required (Admin Only)

Contact GitHub Support at https://support.github.com with the following message:

---

**Subject**: Unable to recreate tags v0.1.0 and v0.1.0.0 due to stale GitHub Release Immutability Records

**Message**:

Hello GitHub Support,

We need assistance with stale GitHub Release Immutability Records in this repository:

```
mycodexvantaos/mycodexvantaos
```

Affected tag names:

```
v0.1.0
v0.1.0.0
```

Correct release source commit:

```
1371a8966c3047bbd95e87308a0bc81e6b72bb41
```

Problem summary:

We previously enabled GitHub Release Immutability and attempted release recovery for `v0.1.0`. After disabling Release Immutability and verifying that repository rulesets, organization rulesets, tag protection, workflow permissions, and token permissions are not blocking tag creation, the exact tag name `v0.1.0` still cannot be recreated.

Control tests:

```
v0.1.0-test → can be created successfully
v0.1.0.0    → was created successfully
v0.1.0      → fails with HTTP 422 / reference update failed
```

Additional issue:

The fallback tag `v0.1.0.0` currently points to the wrong commit:

```
current v0.1.0.0 target: e35af2a
expected release commit: 1371a8966c3047bbd95e87308a0bc81e6b72bb41
```

It may also be affected by release immutability and cannot safely be used as a recovery publication tag.

We verified:

```
- Repository rulesets do not block this tag
- Organization rulesets do not block this tag
- Tag protection rules do not block this tag
- Release Immutability is now disabled
- Other tag names can be created
- The failure only affects the exact tag name v0.1.0
```

Request:

Please clear or repair stale internal GitHub Release Immutability Records for:

```
v0.1.0
v0.1.0.0
```

so that we can restore a release tag and GitHub Release that correctly point to:

```
1371a8966c3047bbd95e87308a0bc81e6b72bb41
```

Business impact:

This blocks stable release recovery and supply-chain integrity restoration. Release artifacts, SBOM, provenance, documentation, and quickstart materials are aligned to the commit above, but the publication tag/release cannot currently be restored safely.

Thank you.

---

## Post-Clearance Steps

Once GitHub Support confirms the records are cleared:

### Step 1: Create v0.1.0 tag

```bash
git tag -a v0.1.0 1371a8966c3047bbd95e87308a0bc81e6b72bb41 -m "Release v0.1.0 - Stable release

Artifact commit: 1371a8966c3047bbd95e87308a0bc81e6b72bb41
This is the official v0.1.0 stable release of MyCodeXvantaOS.
All 15 CI checks passed. PR #85 merged."

git push origin v0.1.0
```

### Step 2: Create GitHub Release

```bash
gh release create v0.1.0 \
  --repo mycodexvantaos/mycodexvantaos \
  --target 1371a8966c3047bbd95e87308a0bc81e6b72bb41 \
  --title "MyCodeXvantaOS v0.1.0 Stable Release" \
  --notes-file docs/releases/0.1.0.md \
  --latest
```

### Step 3: Upload release artifacts

```bash
gh release upload v0.1.0 \
  release/artifacts/0.1.0/artifact-digests.json \
  release/artifacts/0.1.0/promotion-evaluation.json \
  release/artifacts/0.1.0/provenance.intoto.json \
  release/artifacts/0.1.0/sbom.cyclonedx.json \
  release/artifacts/0.1.0/soak-report.json \
  release/artifacts/0.1.0/supply-chain-summary.json \
  release/artifacts/0.1.0/verification-summary.json
```

### Step 4: Clean up test tags

```bash
git push origin --delete v0.1.0-test
```

### Step 5: Verify

```bash
git ls-remote --tags origin | grep v0.1.0
gh release view v0.1.0 --repo mycodexvantaos/mycodexvantaos
```

### Step 6: Close Issue #82

Only after verification passes.

## Fallback Plan

If GitHub Support cannot clear the records within 24–72 hours:

1. Accept ADR-006: `docs/architecture-decision-records/adr-006-v0.1.0-release-recovery.md`
2. Use `v0.1.0-stable` as the fallback publication tag at commit `1371a89`
3. Do NOT use `v0.1.0.0` (wrong commit, immutable)
4. Update all documentation references

## Reference

- Issue #82: https://github.com/mycodexvantaos/mycodexvantaos/issues/82
- ADR-0001: `docs/adr/adr-0001-v0.1.0-release-recovery-tag.md`
- ADR-006: `docs/architecture-decision-records/adr-006-v0.1.0-release-recovery.md`
- Target commit: `1371a8966c3047bbd95e87308a0bc81e6b72bb41`
