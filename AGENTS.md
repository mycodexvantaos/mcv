## AGENTS.md - Autopilot Mode Configuration for MyCodeXvantaOS

This document defines the behavior and configuration for autonomous agents operating within the `mycodexvantaos/mycodexvantaos` repository, specifically for Autopilot mode.

### 1. Autopilot Mode Activation

Agents must be configured to run in Autopilot mode for proactive task execution. Upon activation, agents MUST:
1.  Read project conventions from `.github/copilot-instructions.md` and `AGENTS.md`.
2.  Adhere to the **MyCodeXvantaOS** (brand) and **mycodexvantaos** (machine) identity standards.
3.  Respect the **SSOT** (Single Source of Truth) principles.

### 2. Tool Permissions (Autopilot Safe)

The following tools are pre-approved for autonomous execution:
-   `shell(git:*)`: All Git commands (excluding force push).
-   `shell(npm run build|typecheck|lint|format:*|validate:*|governance:check|contracts:validate|test:*)`.
-   `shell(npm run python:*|genkit:*|rc:verify|api:start)`.
-   `write/read`: File operations within the repository.

**Require Confirmation**:
-   `shell(git push)` (review branch first).
-   `shell(npm install)` (new dependencies).
-   `shell(npm run migration:*)`.
-   `shell(rm)` (single files).

**Denied (NEVER execute autonomously)**:
-   `shell(git push --force)`.
-   `shell(rm -rf)`.
-   `shell(npm run deploy|upload)`.
-   `shell(curl * | sh|bash)`.

### 3. Autopilot Behavior Standards

When in Autopilot mode, the agent MUST:
-   **Always validate before committing**: Execute `npm run typecheck && npm run format:check`.
-   **Follow the Workflow**: Explore → Plan → Code → Validate → Commit.
-   **Create Feature Branches**: Never commit directly to `main`.
-   **Respect Layer Boundaries**: Avoid circular dependencies between layers (Builder, Runtime, Deployment, etc.).
-   **Use Plan Mode**: For any non-trivial changes spanning multiple files or modules.

### 4. Governance and Closure

-   **Naming Guard**: All identifiers must be lowercase/kebab-case. Forbidden legacy prefixes are strictly blocked.
-   **Binding Mediator**: Logical pairings between services must be mediated to prevent hard dependency cycles.
-   **Evidence Closure**: All gate validations must produce JSON/YAML evidence with appropriate hash policies (sha256 for runtime, sha3-512 for long-term integrity, blake3 for fast CI comparison).

### 5. Modular Instructions and Skills

Agents should utilize modular instruction files in `.github/instructions/` and platform skills in `.agents/skills/` (e.g., Genkit JS development) for specialized tasks.

By adhering to these standards, autonomous agents ensure the integrity and governance of the **MyCodeXvantaOS** platform.
