## CI/CD and Automated Repair Loop Instructions

This document provides modular instructions for managing the automated repair loop and CI/CD security within **MyCodexVantaOS**.

### 1. The Repair Loop (Detect-Classify-Fix-PR)

Agents should autonomously monitor the following triggers:

- **Naming Violations**: Triggered by `naming-guard.yml` or `conftest-naming.yaml`.
- **Security Vulnerabilities**: Triggered by `trivy-scan.yml` or `gitleaks.yml`.
- **Dependency Drift**: Triggered by `drift-detection.yml`.

**Remediation Steps**:

1. Identify the violation type and locate the corresponding fixer in `scripts/auto-fix/`.
2. Apply the fix and verify locally using `npm run validate`.
3. Create a feature branch and open a PR with the `auto-fix` label.

### 2. CI/CD Security Hardening

- **SHA Pinning**: All GitHub Actions must be pinned to a 40-character commit SHA.
- **Least Privilege**: Use `permissions: contents: read` unless specific write access is required.
- **Secrets Management**: Never log secrets. Use masked variables and `MYCODEXVANTAOS_` prefixed environment variables.

### 3. Observability and SLA

- **Audit Logs**: Ensure all CI jobs output structured JSON logs for audit ingestion.
- **Metrics**: Export合規率 (Compliance Rate) and 自動修復成功率 (Auto-fix Success Rate) to the governance dashboard.
- **SLA Tracking**: Monitor P95 build times and gate validation latency.

### 4. Supply Chain Integrity

- **SBOM**: Use `pnpm release:sbom` to generate CycloneDX 1.5 artifacts.
- **Provenance**: Use `pnpm release:provenance` for SLSA v1 attestation.
- **Signing**: Verify signatures using `cosign` before pulling third-party images or actions.

Agents must refer to these instructions when modifying or creating new CI/CD workflows.
