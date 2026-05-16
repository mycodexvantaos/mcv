# Release Signing Plan

## Overview

This document defines the cryptographic signing requirements for MyCodeXvantaOS stable releases. The RC release (v0.1.0-rc.1) was published with unsigned provenance classified as `signing-not-configured`. For the v0.1.0 stable release and all subsequent stable releases, cryptographic signing of release provenance is required per gate G010 of the promotion policy.

## Current State

The v0.1.0-rc.1 release generated unsigned provenance using the SLSA v1 / in-toto Statement v1 format. The provenance file (`provenance.intoto.json`) contains complete builder, materials, and subject information but lacks a cryptographic signature. This is classified as `signing-not-configured` and is acceptable for RC releases per the promotion policy (G010: `rcStatus=acceptable-skip`).

## Signing Requirements for Stable Release

### Provenance Signing

All stable release provenance statements must include a valid cryptographic signature. The signature must cover the entire in-toto Statement ( `_type`, `predicateType`, `subject`, and `predicate` fields). The signing process must be reproducible and verifiable by consumers.

### Signature Format

Signatures follow the in-toto Envelope format. The provenance bundle must include a `signatures` array at the top level of the JSON document:

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "predicateType": "https://slsa.dev/provenance/v1",
  "subject": [...],
  "predicate": {...},
  "signatures": [
    {
      "keyid": "<signing-key-id>",
      "sig": "<base64-encoded-signature>"
    }
  ]
}
```

### Signing Methods

The following signing methods are supported, in order of preference:

#### 1. Sigstore Keyless Signing (Recommended)

Sigstore provides keyless signing using OpenID Connect (OIDC) federation. When running in GitHub Actions, the GitHub OIDC token is used as the identity provider.

- **Tool**: `cosign sign-blob` with `--b64` flag
- **Identity**: GitHub Actions OIDC token (`GITHUB_TOKEN` with `id-token: write` permission)
- **Verification**: `cosign verify-blob` with `--certificate-identity` and `--certificate-oidc-issuer`
- **Benefits**: No key management, transparent logging via Rekor, widely trusted
- **Requirements**: GitHub Actions environment with OIDC enabled

Implementation steps:

1. Add `id-token: write` permission to the release workflow
2. Install `cosign` in the CI environment
3. Sign the provenance statement after generation: `cosign sign-blob --blob-file provenance.intoto.json`
4. Include the signature in the provenance bundle
5. Upload the signing certificate and bundle to the GitHub Release

#### 2. GitHub OIDC with Cosign Keyless (Alternative)

Similar to Sigstore keyless but using GitHub's native OIDC integration directly.

- **Tool**: `cosign` with `GITHUB_TOKEN`
- **Identity**: GitHub repository and workflow identity
- **Benefits**: Native GitHub integration, no external service dependency
- **Requirements**: GitHub Actions with OIDC

#### 3. GPG/PGP Key Signing (Fallback)

Traditional GPG key-based signing using a stored private key.

- **Tool**: `gpg --sign` or `cosign sign --key gpg://`
- **Identity**: GPG key ID stored as a GitHub Secret
- **Key Management**: Private key stored in GitHub Secrets (`SIGNING_GPG_KEY`), passphrase in `SIGNING_GPG_PASSPHRASE`
- **Verification**: `gpg --verify` or `cosign verify-blob --key gpg://`
- **Benefits**: Well-understood, no external service dependency
- **Drawbacks**: Key management overhead, no transparency log

#### 4. Vault/HSM-Based Signing (Enterprise)

HashiCorp Vault or Hardware Security Module-based signing for high-security environments.

- **Tool**: Vault Transit engine or HSM PKCS#11 interface
- **Identity**: Vault AppRole or Kubernetes auth method
- **Key Management**: Keys never leave the HSM/Vault
- **Benefits**: Highest security, key rotation, audit logging
- **Drawbacks**: Infrastructure requirements, complexity
- **Status**: Not required for v0.1.0 stable; planned for future enterprise releases

### Signing Policy for v0.1.0 Stable

For the v0.1.0 stable release, the minimum signing requirement is:

1. **Method**: Sigstore keyless signing via `cosign` in GitHub Actions
2. **Identity**: GitHub OIDC token from the `mycodexvantaos/mycodexvantaos` repository
3. **Scope**: All provenance statements for release artifacts
4. **Verification**: Automated verification in CI and manual verification instructions in release notes

If Sigstore keyless signing cannot be configured before the v0.1.0 stable release, GPG key signing may be used as a fallback, provided the GPG public key is published to a keyserver and the key fingerprint is documented in the release notes.

### Signing Policy for Future Releases

| Release Type     | Signing Method               | Minimum Requirement                                          |
| ---------------- | ---------------------------- | ------------------------------------------------------------ |
| RC               | Unsigned acceptable          | `signing-not-configured` classification with documented plan |
| Stable (v0.1.0)  | Sigstore keyless or GPG      | Provenance must be signed                                    |
| Stable (v0.2.0+) | Sigstore keyless (preferred) | Provenance signed with transparency log entry                |
| Enterprise       | Vault/HSM                    | Keys managed in HSM with audit trail                         |

## Implementation Plan

### Phase 1: v0.1.0 Stable (Current Milestone)

1. Add `cosign` installation step to the release workflow
2. Add `id-token: write` permission to the release workflow
3. Sign provenance after generation using `cosign sign-blob`
4. Include signature in the provenance bundle
5. Add signature verification step to the release workflow
6. Update `generate-provenance.ts` to include signatures when available
7. Document verification instructions in release notes

### Phase 2: Automated Signing (v0.2.0+)

1. Create a dedicated signing workflow triggered by tag push
2. Automate keyless signing via GitHub OIDC
3. Add SLSA provenance generation using `slsa-github-generator`
4. Publish signatures to Rekor transparency log
5. Add automated signature verification in CI

### Phase 3: Enterprise Signing (Future)

1. Integrate with HashiCorp Vault Transit engine
2. Configure HSM-backed signing keys
3. Add audit logging for all signing operations
4. Implement key rotation procedures

## Verification

Consumers can verify signed provenance using:

### Sigstore Keyless Verification

```bash
cosign verify-blob \
  --blob-file provenance.intoto.json \
  --signature provenance.intoto.json.sig \
  --certificate provenance.intoto.json.cert \
  --certificate-identity https://github.com/mycodexvantaos/mycodexvantaos/.github/workflows/release.yml@refs/tags/v0.1.0 \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

### GPG Verification

```bash
gpg --verify provenance.intoto.json.sig provenance.intoto.json
```

## Classification Reference

| Classification           | Description                                 | RC Policy           | Stable Policy    |
| ------------------------ | ------------------------------------------- | ------------------- | ---------------- |
| `signing-not-configured` | Provenance is generated but unsigned        | Acceptable          | Must be resolved |
| `signing-configured`     | Provenance is signed with a valid signature | Required for stable | Required         |
| `signing-verified`       | Provenance signature has been verified      | Best effort         | Recommended      |

## Security Considerations

- Signing keys must never be committed to the repository
- GitHub Secrets must be used for key material (GPG) or OIDC tokens (Sigstore)
- The signing workflow must use pinned action versions with SHA-256 hashes
- Transparency log entries provide non-repudiation for Sigstore-signed artifacts
- Key rotation procedures must be documented before v0.2.0

## References

- [SLSA Specification v1.0](https://slsa.dev/spec/v1.0/)
- [in-toto Attestation Framework](https://github.com/in-toto/attestation)
- [Sigstore: Keyless Signing](https://sigstore.dev/)
- [Cosign Documentation](https://github.com/sigstore/cosign)
- [GitHub OIDC for Actions](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
