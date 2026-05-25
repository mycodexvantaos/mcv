# Infrastructure Secrets Configuration Guide

## Overview

MyCodeXvantaOS deployment integrates with multiple external infrastructure providers. When the
required secrets are not configured, infrastructure validations are classified as
`infrastructure-not-configured` and skipped per the promotion policy (G011: optional for stable
releases). This document defines the required secrets, their purpose, and configuration
instructions.

## Promotion Policy Context

Gate **G011 (Infrastructure Validation)** in `release/policies/rc-promotion-policy.json`:

| Release Type | G011 Status     |
| ------------ | --------------- |
| RC           | acceptable-skip |
| Stable       | optional        |

Missing infrastructure secrets result in `infrastructure-not-configured` classification, which is
documented in `release/artifacts/<version>/verification-summary.json` and does **not** block
release promotion.

---

## Required Secrets

### 1. Cloudflare Deployment (`CF_API_TOKEN`)

**Purpose:** Deploys the studio-platform application to Cloudflare Pages and manages Workers,
D1, KV, and R2 resources.

**Workflows that use this secret:**

- `.github/workflows/deploy-cloudflare.yaml`
- `.github/workflows/deploy-cloudflare-preview.yaml`

**Configuration:**

```bash
# 1. Log in to Cloudflare dashboard: https://dash.cloudflare.com/profile/api-tokens
# 2. Create a token with the following permissions:
#    - Account: Cloudflare Pages:Edit
#    - Account: Workers Scripts:Edit
#    - Account: D1:Edit
#    - Zone: Zone:Read (for custom domains)
# 3. Add to GitHub repository secrets:
gh secret set CF_API_TOKEN --body "<your-cloudflare-api-token>"
```

**Validation check:** The `deploy-cloudflare.yaml` workflow skips deployment when `CF_API_TOKEN`
is not set and reports `infrastructure-not-configured`.

---

### 2. Kubernetes Deployment (`KUBE_CONFIG_DEV`)

**Purpose:** Deploys services to the development Kubernetes cluster for integration testing and
staging validation.

**Workflows that use this secret:**

- `.github/workflows/cd-dev.yaml`
- `.github/workflows/drift-detection.yaml`

**Configuration:**

```bash
# 1. Obtain kubeconfig for your development cluster:
kubectl config view --minify --flatten > kubeconfig-dev.yaml
# 2. Base64-encode the kubeconfig:
KUBE_CONFIG_B64=$(base64 -w0 kubeconfig-dev.yaml)
# 3. Add to GitHub repository secrets:
gh secret set KUBE_CONFIG_DEV --body "$KUBE_CONFIG_B64"
```

**Validation check:** The `cd-dev.yaml` workflow skips deployment when `KUBE_CONFIG_DEV` is not
set and reports `infrastructure-not-configured`.

---

### 3. GCP / Terraform Cloud (`TF_API_TOKEN`)

**Purpose:** Manages GCP infrastructure provisioning via Terraform Cloud. The Terraform Cloud
GitHub App posts external status checks for this repository.

**Current Status:** No Terraform (`.tf`) files exist in this repository. The Terraform Cloud
GitHub App is connected but reports `Stack preparation failed` because there are no Terraform
configurations to plan. This is classified as `infrastructure-not-configured`.

**Resolution options:**

| Option       | Description                                                              |
| ------------ | ------------------------------------------------------------------------ |
| **Option A** | Disconnect the Terraform Cloud GitHub App if TFC is not used             |
| **Option B** | Add Terraform configurations and configure `TF_API_TOKEN`                |
| **Option C** | Keep as-is (classified as `infrastructure-not-configured`, non-blocking) |

**To disconnect the TFC GitHub App:**

1. Visit [Terraform Cloud Console](https://app.terraform.io/app/mycodexvantaos)
2. Navigate to the failing stack configuration
3. Remove or reconfigure the GitHub integration
4. Or disconnect the TFC GitHub App from the repository settings

**To configure TFC (if needed):**

```bash
# 1. Create a TFC API token: https://app.terraform.io/app/settings/tokens
# 2. Add to GitHub repository secrets:
gh secret set TF_API_TOKEN --body "<your-terraform-cloud-api-token>"
```

---

### 4. Container Registry (`GHCR_TOKEN` / `DOCKER_TOKEN`)

**Purpose:** Publishes Docker images to GitHub Container Registry (ghcr.io) or Docker Hub.

**Workflows that use this secret:**

- `.github/workflows/release-consolidated.yaml` (container job)

**Configuration:**

```bash
# For GitHub Container Registry (recommended):
# Uses GITHUB_TOKEN automatically — no additional secret needed
# Ensure packages:write permission is set in workflow

# For Docker Hub (alternative):
gh secret set DOCKER_USERNAME --body "<your-dockerhub-username>"
gh secret set DOCKER_TOKEN --body "<your-dockerhub-access-token>"
```

---

### 5. Release Signing (`COSIGN_PRIVATE_KEY` — Optional)

**Purpose:** Used for GPG/PGP key-based signing as an alternative to Sigstore keyless signing.
Not required when using the default Sigstore keyless method.

**Note:** The preferred signing method is Sigstore keyless via GitHub OIDC (no secrets required).
See `docs/security/release-signing.md` for details.

**Configuration (if using GPG fallback):**

```bash
# 1. Generate a GPG key:
gpg --full-generate-key
# 2. Export the private key:
gpg --armor --export-secret-keys <key-id> > signing-key.asc
# 3. Add to GitHub repository secrets:
gh secret set SIGNING_GPG_KEY < signing-key.asc
gh secret set SIGNING_GPG_PASSPHRASE --body "<your-passphrase>"
```

---

## Infrastructure Validation Status

The following table summarizes the current infrastructure validation status per release:

| Infrastructure        | Secret Required       | v0.1.0 Status                   | Notes                 |
| --------------------- | --------------------- | ------------------------------- | --------------------- |
| Cloudflare Pages      | `CF_API_TOKEN`        | `infrastructure-not-configured` | Optional for stable   |
| Kubernetes (dev)      | `KUBE_CONFIG_DEV`     | `infrastructure-not-configured` | Optional for stable   |
| GCP / Terraform Cloud | `TF_API_TOKEN`        | `infrastructure-not-configured` | No .tf files in repo  |
| Container Registry    | `GITHUB_TOKEN` (auto) | Available                       | Uses GITHUB_TOKEN     |
| Release Signing       | None (keyless)        | Configured via workflow         | See sign-release.yaml |

---

## Configuring Secrets via GitHub CLI

```bash
# Set all infrastructure secrets at once:
gh secret set CF_API_TOKEN --body "<cloudflare-api-token>"
gh secret set KUBE_CONFIG_DEV --body "$(base64 -w0 kubeconfig-dev.yaml)"
gh secret set TF_API_TOKEN --body "<terraform-cloud-token>"
```

---

## References

- `release/policies/rc-promotion-policy.json` — G011 gate definition
- `docs/security/release-signing.md` — Signing configuration guide
- `release/artifacts/v0.1.0-rc.1/verification-summary.json` — Current verification status
- `.github/workflows/terraform-cloud-guard.yaml` — TFC status classification workflow
- [GitHub Actions Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
