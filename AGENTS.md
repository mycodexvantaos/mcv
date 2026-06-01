## AGENTS.md - Enterprise Autonomous Agent Configuration for MyCodeXvantaOS

This document defines the behavioral norms and operational protocols for autonomous agents (Autopilot mode) within the **MyCodeXvantaOS** ecosystem. It focuses on implementing enterprise-grade repair loops, governance enforcement, and supply chain security.

### 1. Autonomous Operation Standards

When operating in Autopilot mode, agents MUST adhere to the following standards:
- **Identity Integrity**: Always use **MyCodeXvantaOS** for branding and **mycodexvantaos** for machine identifiers.
- **SSOT Adherence**: All actions must be validated against the Single Source of Truth files (e.g., `service-catalog.yaml`, `provider-registry.yaml`).
- **Audit Logging**: Every autonomous action must record audit fields: `actor`, `action`, `resource`, `result`, `hash`, `version`, `requestId`, `correlationId`.

### 2. The Automated Repair & PR Loop

Agents are authorized to execute the following autonomous loop to maintain repository health:
1.  **Detect**: Continuously scan for naming violations, dependency drifts, or security vulnerabilities (using `naming-guard`, `trivy-scan`, etc.).
2.  **Classify**: Categorize detected issues based on governance policies.
3.  **Remediate**: Apply pre-approved fixers (e.g., `actions-hardening.sh`, `lint-fix`, `deps-refresh`).
4.  **Verify & PR**: Validate the fix via CI, generate a signed PR with a comprehensive audit report, and request human review for merging.

### 3. Tool Permissions & Security

#### Pre-approved (Autopilot Safe)
- `shell(git:*)`: Git operations on feature branches (excluding force push).
- `shell(npm run:*)`: All build, test, and governance check scripts.
- `shell(scripts/auto-fix/*)`: Pre-defined remediation scripts.
- `write/read`: File operations within the repository scope.

#### Require Confirmation
- `shell(git push origin main)`: Direct push to the default branch is strictly forbidden.
- `shell(npm install)`: Adding new third-party dependencies.
- `shell(scripts/freeze-deploy.sh)`: Triggering deployment freezes.

#### Strictly Denied
- `shell(rm -rf)`: Recursive deletion of directories.
- `shell(curl * | bash)`: Execution of unverified remote scripts.
- `shell(npm run deploy)`: Production deployments without explicit multi-party approval.

### 4. Supply Chain & Governance Enforcement

- **Pinned Actions**: All newly introduced GitHub Actions MUST use full commit SHAs (e.g., `uses: actions/checkout@sha256:...`).
- **Evidence Generation**: Every validation gate must produce structured evidence (JSON/YAML) with integrity hashes (sha256/sha3-512).
- **Naming Guard**: Strictly enforce lowercase/kebab-case for all machine resources. Forbidden legacy prefixes (e.g., `KUBO`, `ORCH`) must be blocked at the source.

### 5. Plan Mode & Conflict Resolution

- **Plan-First**: For any change spanning multiple files or modules, agents MUST generate a detailed plan in `plan.md` before execution.
- **Conflict Strategy**: Resolve naming or schema conflicts using semantic versioning (MAJOR.MINOR.PATCH) and directory branching where necessary.
- **Rollback**: Every major autonomous change must include a `rollback.sh` script or a clear path to revert to the last known healthy state.

By following these protocols, autonomous agents ensure that **MyCodeXvantaOS** remains a secure, governed, and self-healing operating system.
