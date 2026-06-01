## AGENTS.md - Integrated CI/CD & Governance for MyCodexVantaOS

This document defines the behavioral norms for autonomous agents operating in a self-hosted, constitutionally governed environment.

### 1. Continuous Integration (CI) Integration

Agents MUST integrate with the following CI workflows to ensure code quality and governance compliance:
- **Naming Guard**: Run `npm run governance:check` before every commit.
- **Contract Validation**: Run `npm run contracts:validate` when modifying `contracts/`.
- **Security Scanning**: Ensure all new workflows pass `trivy-scan` and `gitleaks` checks.

### 2. Automated Remediation Protocols

In Autopilot mode, agents are authorized to trigger the following remediation scripts:
- `scripts/naming/remediate.sh`: To fix naming violations autonomously.
- `scripts/auto-fix/actions-hardening.sh`: To pin GitHub Action versions to SHAs.
- `scripts/auto-fix/lint_fix.go`: To resolve formatting and linting issues.

### 3. Self-Hosted Infrastructure Governance

- **Local-First Development**: Agents must prioritize local validation using `Docker Compose` before suggesting remote deployments.
- **Port/Adapter Compliance**: Strictly enforce hexagonal boundaries. No provider-specific SDKs (e.g., AWS, Cloudflare) are allowed in `packages/core/`.
- **Audit Traceability**: Every state-changing operation must be wrapped in `withAudit()` or equivalent logging, capturing the `correlationId` and `hash`.

### 4. Release & Supply Chain Compliance

Agents participating in the release process must verify:
1. **Artifact Integrity**: Validate SHA3-512 hashes for all generated bundles.
2. **SBOM Completeness**: Ensure CycloneDX 1.5 JSON SBOM is generated.
3. **Provenance Attestation**: Generate SLSA v1 provenance for the release candidate.

### 5. Behavior Standards

- **Explore → Plan → Code → Validate → Commit**.
- **No direct push to main**: All autonomous changes must go through a feature branch and a signed PR.
- **Evidence-Based Gates**: Attach validation reports (JSON/YAML) to all PRs as evidence for gate approval.

By following these protocols, agents act as guardians of the **MyCodexVantaOS** platform's integrity and security.
