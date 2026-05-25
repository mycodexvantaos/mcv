# GitHub Support Runbook: v0.1.0 Immutability Record (GH013)

**Event Classification**: Release Identity Recovery / Platform Support Blocker Event
**Current Status**: Published via recovery tag v0.1.0-stable
**Date**: 2026-05-20

## Summary

The v0.1.0 release is technically complete and ready for publication, but the exact tag name `v0.1.0` is blocked by GitHub's internal Release Immutability Record (GH013). This is an internal database record that persists even after releases are deleted and the "Enable release immutability" setting is disabled.

**Fallback Path Activated**: The release has been successfully published using the recovery tag `v0.1.0-stable` at commit `1371a8966c3047bbd95e87308a0bc81e6b72bb41` with all 7 artifacts uploaded.

## Problem Statement

### What Happened

1. The v0.1.0 git tag and its associated GitHub Release were accidentally deleted during a cleanup operation.
2. Subsequent attempts to recreate `v0.1.0` fail with HTTP 422 due to GitHub's internal Immutability Record.
3. The fallback tag `v0.1.0.0` was created at the wrong commit (`e35af2a` instead of `1371a89`) and is also blocked by GH013 after deletion.
4. The tag `v0.1.0-stable` was successfully created and published as the recovery publication.

### Error Messages

```
error: Cannot create ref due to creations being restricted
```

This error occurs when attempting to create either `v0.1.0` or `v0.1.0.0` tags via `git push origin <tag>`.

### Supply Chain Integrity Chain

| Link                   | Status | Detail                                                                  |
| ---------------------- | ------ | ----------------------------------------------------------------------- |
| Source commit          | ✅     | `1371a8966c3047bbd95e87308a0bc81e6b72bb41` — all artifacts reference it |
| Git tag                | ✅     | `v0.1.0-stable` at correct commit (recovery tag)                        |
| Git tag                | ❌     | `v0.1.0` blocked by GH013                                               |
| Git tag                | ❌     | `v0.1.0.0` blocked by GH013 (wrong commit)                              |
| GitHub Release         | ✅     | Created at `v0.1.0-stable` with 7 artifacts                             |
| Release artifacts      | ✅     | 7 files in `release/artifacts/0.1.0/`                                   |
| Digest/SBOM/Provenance | ✅     | SHA3-512, CycloneDX 1.5, SLSA v1                                        |
| Promotion evaluation   | ✅     | 9/11 passed, 0 failed, 2 skipped                                        |
| Soak validation        | ✅     | 19/25 passed, 6 skipped                                                 |
| Documentation          | ✅     | Release notes, quickstart, promotion eval, soak report                  |

### Tag Status

| Tag Name        | Status                            | Target Commit                              | Valid             |
| --------------- | --------------------------------- | ------------------------------------------ | ----------------- |
| `v0.1.0`        | ❌ Blocked by Immutability Record | N/A                                        | —                 |
| `v0.1.0.0`      | ❌ Blocked by Immutability Record | N/A                                        | ❌ (wrong commit) |
| `v0.1.0-stable` | ✅ Exists                         | `1371a8966c3047bbd95e87308a0bc81e6b72bb41` | ✅                |

## Recovery Source Commit (Frozen)

```
1371a8966c3047bbd95e87308a0bc81e6b72bb41
```

All release recovery actions MUST target only this commit.

## Fallback Plan (ACTIVATED)

The fallback publication path has been activated per ADR-006:

1. **Product version**: 0.1.0 (unchanged)
2. **Publication tag**: `v0.1.0-stable` at commit `1371a89`
3. **GitHub Release**: Created with all 7 artifacts uploaded
4. **Documentation**: Updated to reference `v0.1.0-stable` as the publication tag

## GitHub Support Ticket Template

If GitHub Support can clear the Immutability Records, the following ticket template can be used:

```
Subject: Request to clear Release Immutability Records for v0.1.0 and v0.1.0.0

Repository: mycodexvantaos/mycodexvantaos

Issue: The v0.1.0 release tag and its associated GitHub Release were accidentally deleted
during a cleanup operation. Subsequent attempts to recreate the tag fail with:
"Cannot create ref due to creations being restricted"

We have disabled the "Enable release immutability" setting in repository settings, but the
internal Immutability Record (GH013) persists and blocks tag creation.

Request: Please clear the internal Immutability Records for the following tags:
- v0.1.0
- v0.1.0.0

Context:
- We have successfully published the release using a recovery tag (v0.1.0-stable)
- All release artifacts are available and verified
- Source commit: 1371a8966c3047bbd95e87308a0bc81e6b72bb41
- Release notes: https://github.com/mycodexvantaos/mycodexvantaos/releases/tag/v0.1.0-stable

Additional Notes:
- The v0.1.0.0 tag was created at the wrong commit (e35af2a) and has been deleted
- We need to clear both records to allow future tag recreation if needed
- This is blocking our ability to use the canonical tag name v0.1.0
```

## Resolution Paths

**Path A (Preferred):** GitHub Support clears records → create `v0.1.0` at `1371a89` → migrate artifacts
**Path B (Fallback - ACTIVATED):** Support cannot clear → use `v0.1.0-stable` at `1371a89` (per ADR-006)

## Constraints

- No automated retries of `v0.1.0` or `v0.1.0.0` tag creation
- Do not use `v0.1.0.0` in its current state (wrong commit, blocked by GH013)
- All documentation must distinguish between `product_version` (0.1.0) and `publication_tag` (v0.1.0-stable)

## References

- Issue #82: Critical: v0.1.0 release identity blocked by GitHub Immutability Record
- ADR-006: `docs/architecture-decision-records/adr-006-v0.1.0-release-recovery.md` (Accepted)
- ADR-0001: `docs/adr/adr-0001-v0.1.0-release-recovery-tag.md` (Superseded by ADR-006)
- Release notes: `docs/releases/0.1.0.md`
