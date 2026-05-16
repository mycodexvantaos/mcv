# Release Promotion Gate Policy

This document defines the criteria and gates that a release candidate (RC) must satisfy before promotion to a stable release. The policy ensures that every stable release is auditable, reproducible, and validated against the platform's governance and supply-chain requirements.

---

## Scope

This policy applies to all release candidates in the MyCodeXvantaOS project. The current implementation covers the RC-to-stable promotion path for the v0.1.0 line. Future versions may extend this policy to cover patch, minor, and major release channels.

---

## Promotion Criteria

A release candidate may be promoted to stable only when **all** of the following criteria are met. No single criterion may be waived without a documented exception approved by a platform maintainer.

### 1. CI Green

All continuous integration checks on the `main` branch must pass with zero failures. This includes:

- TypeScript compilation and linting
- Python linting and tests
- Schema validation
- Contract validation
- CodeQL security scanning (v4)
- Release candidate verification workflow (`rc:verify`)

The main branch must be green at the time of promotion with no open failing CI runs.

### 2. Release Notes

A release notes document must exist at `docs/releases/<version>.md` covering:

- All changes since the previous release (added, changed, fixed, security)
- Known limitations and their classifications
- Upgrade path instructions
- Link to the CHANGELOG.md entry

### 3. CHANGELOG Entry

`CHANGELOG.md` must include a dated entry for the version being promoted under the appropriate section (Added, Changed, Fixed, Security).

### 4. Release Artifacts

The following release artifacts must be generated and published under `release/artifacts/<version>/`:

- `release-manifest.json` — Machine-readable manifest with version, commit, tag, and governance state
- `artifact-digests.json` — SHA3-512 primary and SHA-256 secondary digests for all key files
- `verification-summary.json` — Results of `rc:verify` with infrastructure skips documented

### 5. Supply Chain Baseline

- **SBOM**: A CycloneDX 1.5 JSON SBOM must exist at `release/artifacts/<version>/sbom.cyclonedx.json`, covering all workspace packages, root dependencies, and Python packages.
- **Provenance**: An in-toto Statement v1 with SLSA v1 predicate must exist at `release/artifacts/<version>/provenance.intoto.json`, establishing the build's materials and subjects.

### 6. Self-Hosted Validation

A self-hosted quickstart guide must exist for the version, and the RC smoke test script must pass against a running instance:

- Quickstart guide: `docs/self-hostable/quickstart-<version>.md`
- Smoke test: `scripts/smoke/self-hosted-rc-smoke.sh`
- All smoke test assertions must pass (infrastructure-not-configured skips are expected and acceptable for RC)

### 7. Governance Enforcement

All seven canonical enforcement flags must be present and operational in the runtime:

| Flag                                  | Description                        |
| ------------------------------------- | ---------------------------------- |
| `auditEnforcementEnabled`             | Audit event chain enforcement      |
| `knowledgeTraceEnforcementEnabled`    | Knowledge trace receipt validation |
| `dreamSafetyEnforcementEnabled`       | Dream lifecycle review gate        |
| `auditEnforcementMiddleware`          | Audit middleware active            |
| `knowledgeTraceEnforcementMiddleware` | Knowledge middleware active        |
| `dreamSafetyEnforcementMiddleware`    | Dream middleware active            |
| `policyRuntimeEnforcement`            | Policy runtime evaluation          |

The `rc:verify` governance check category must report all flags as present.

### 8. Reproducibility

Release artifacts must be reproducible. Running `pnpm release:artifacts` on the same commit must produce bit-identical digest outputs. The artifact digests file must be verifiable by any third party using standard hash tools.

### 9. No Regressions

No regressions in test coverage, API contracts, or enforcement behavior compared to the previous release. Any behavioral change must be documented in the release notes and CHANGELOG.

---

## RC-Specific Classifications

The following classifications are acceptable for release candidates but must be resolved or explicitly documented before stable promotion:

### Infrastructure-Not-Configured

Infrastructure checks that cannot run due to missing external services (Terraform Cloud, GCP, Cloudflare, Kubernetes) are classified as `infrastructure-not-configured`. For RC promotion, these skips must be:

- Documented in the verification summary
- Listed in the release notes known limitations
- Tracked for resolution in a future milestone

For stable promotion, infrastructure-not-configured items must either be resolved through proper secret configuration or formally accepted as out-of-scope with documented justification.

### Signing-Not-Configured

Release provenance that lacks cryptographic signing is classified as `signing-not-configured`. For RC, this is acceptable. For stable promotion:

- A signing key must be configured (Sigstore, GPG, or equivalent)
- All provenance statements must include valid signatures
- The promotion policy must reference the signing key identity

---

## Promotion Process

1. **Verify all criteria** above are met on the target RC tag
2. **Run `pnpm rc:verify`** and confirm all check categories pass (with documented infrastructure skips)
3. **Generate release artifacts**: `pnpm release:artifacts && pnpm release:sbom && pnpm release:provenance`
4. **Run the RC smoke test** against a self-hosted instance
5. **Create a promotion request** (GitHub issue or PR) referencing:
   - The RC tag
   - Green CI status on main
   - Verification summary
   - Artifact digests (for reproducibility confirmation)
   - SBOM and provenance files
6. **Obtain approval** from at least one platform maintainer
7. **Tag the stable release**: `git tag -a v<version> -m "Stable release v<version>"`
8. **Push the tag**: `git push origin v<version>`
9. **Publish the release** on GitHub with release notes and artifact links

---

## Exception Process

If a criterion cannot be met for a stable release, an exception may be granted:

1. File an exception request as a GitHub issue
2. Document which criterion cannot be met and why
3. Describe the risk and mitigation plan
4. Obtain approval from two platform maintainers
5. Reference the exception in the release notes

Exceptions are valid for a single release only and must be re-evaluated for subsequent releases.

---

## Policy Version

| Version | Date       | Description                                   |
| ------- | ---------- | --------------------------------------------- |
| 1.0.0   | 2025-05-16 | Initial promotion gate policy for v0.1.0-rc.1 |

---

## References

- [Release Notes: v0.1.0-rc.1](./v0.1.0-rc.1.md)
- [Self-Hosted Quickstart: v0.1.0-rc.1](../self-hostable/quickstart-v0.1.0-rc.1.md)
- [CHANGELOG.md](../../CHANGELOG.md)
- [RC Verification Tool](../../tools/rc-verify.ts)
- [Release Artifacts Tool](../../tools/release-artifacts.ts)
- [SBOM Generator](../../tools/generate-sbom.ts)
- [Provenance Generator](../../tools/generate-provenance.ts)
