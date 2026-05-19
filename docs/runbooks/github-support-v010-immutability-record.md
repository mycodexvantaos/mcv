# Runbook: GitHub Support Request for v0.1.0 Immutability Record

## Context
The tag `v0.1.0` and `v0.1.0.0` are currently blocked by GitHub's internal Immutability Record. This prevents the creation of the official stable release tag at the correct commit (`1371a89`).

## Issue Details
- **Repository**: `mycodexvantaos/mycodexvantaos`
- **Blocked Tag**: `v0.1.0`
- **Incorrect Tag**: `v0.1.0.0` (currently points to `e35af2a`, should be `1371a89`)
- **Root Cause**: GitHub Enterprise Immutability Record (GH013)

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

## Action Required (Admin Only)
Please contact GitHub Support (https://support.github.com) with the following message:

---
**Subject**: Request to clear Immutability Record for tags in mycodexvantaos/mycodexvantaos

**Message**:
Hello GitHub Support,

We are encountering a "Repository rule violations (GH013)" error when trying to create the `v0.1.0` tag in our repository `mycodexvantaos/mycodexvantaos`. 

Our diagnosis confirms that this is due to an internal Immutability Record locking the tag name, even though no such tag or release currently exists in the repository and all visible rulesets are empty.

Additionally, the tag `v0.1.0.0` was created pointing to an incorrect commit (`e35af2a`) and is also locked.

Could you please:
1. Clear the Immutability Record for the tag name `v0.1.0`.
2. Clear the Immutability Record for the tag name `v0.1.0.0`.

This will allow us to complete our official stable release at the correct commit (`1371a89`).

Thank you.
---

## Post-Clearance Steps
Once GitHub Support confirms the records are cleared:
1. Run the workflow `.github/workflows/create-v010-tag.yaml`.
2. Verify the tag `v0.1.0` points to `1371a89`.
