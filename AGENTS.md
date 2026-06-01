## AGENTS.md - Autopilot Mode Configuration for MyCodeXvantaOS

This document defines the behavior and configuration for autonomous agents operating within the `mycodexvantaos/mycodexvantaos` repository, specifically for Autopilot mode. It integrates with the project's existing structure and guidelines to ensure efficient, consistent, and secure autonomous task completion.

### 1. Autopilot Mode Activation

To enable full autonomous operation, agents should be configured to run in Autopilot mode. This allows for proactive task execution and problem-solving based on the provided instructions and repository context. Agents should prioritize reading and adhering to the guidelines in this `AGENTS.md` file and `.github/copilot-instructions.md` upon activation.

### 2. Allowed Tool Permissions

Autonomous agents require specific tool permissions to function effectively within the MyCodeXvantaOS project. The following permissions are essential for agents to perform repository operations, code modifications, and system interactions, while adhering to the principle of least privilege:

-   `shell(git:*)`: Full access to Git commands for repository management (cloning, committing, pushing, branching), excluding force pushes.
-   `shell(npm run:*)`: Permission to execute `npm run` scripts for build, test, lint, and other project-specific tasks as defined in `.github/copilot-instructions.md`.
-   `shell(python:*)`: Access to the Python interpreter for executing scripts, especially for the Python Plane components (CI repair, agent worker, dream worker) located in the `python/` directory.
-   `write`: Ability to create, modify, and delete files within the repository, respecting existing file structures and naming conventions.
-   `read`: Ability to read any file within the repository for contextual understanding and information gathering.

Agents should always use the minimum necessary permissions for a given task. Any operation requiring elevated or sensitive permissions (e.g., `git push`, `npm install`, `rm`) should be explicitly confirmed or handled with caution, as detailed in the "Require Confirmation" section of the existing `AGENTS.md`.

### 3. Plan Mode Usage for Autonomous Tasks

For any non-trivial task, agents are instructed to utilize the plan mode. This ensures a structured approach to problem-solving, allows for human oversight and intervention when necessary, and aligns with the project's `Explore → Plan → Code → Validate → Commit` workflow.

-   **Task Decomposition**: Break down complex tasks into smaller, manageable steps, clearly outlining objectives and expected outcomes for each step.
-   **Plan Generation**: Generate a detailed implementation plan, including affected files, proposed changes, and verification steps. This plan should be reviewed for alignment with architectural invariants and project guidelines.
-   **Self-Correction**: If a plan encounters issues during execution (e.g., build failures, test failures, governance violations), the agent must revert to the planning phase to re-evaluate and adjust the strategy. Never suppress errors or bypass governance checks.
-   **Contextual Awareness**: Leverage the `.github/copilot-instructions.md`, this `AGENTS.md` file, and other modular instruction files (e.g., `.github/instructions/`) for comprehensive context during planning and execution.

### 4. Code Style and Workflow Adherence

Autonomous agents must strictly adhere to the established code style and workflow guidelines defined in the repository to maintain consistency, quality, and governance compliance.

-   **Code Style**: Follow the TypeScript strict mode, prefer functional components, ensure JSDoc comments for public APIs, and adhere to Prettier formatting as outlined in `.github/copilot-instructions.md`.
-   **Naming Conventions**: Respect the governance-enforced naming conventions for services, packages, modules, and schemas (e.g., `mycodexvantaos-<domain>-<capability>`).
-   **Workflow**: Integrate seamlessly with the existing development workflow, including running pre-commit checks (`npm run typecheck && npm run format:check`), following conventional commit messages, creating feature branches from `main`, and running governance checks (`npm run governance:check`) before finalizing changes.
-   **Testing**: Prioritize test-driven development. Generate failing tests first, then implement code to make them pass, and finally validate the implementation using commands like `npm run test:services` or `npm run python:test`.

### 5. Modular Instructions

Agents should actively be aware of and utilize modular instruction files located under `.github/instructions/` for specific domain knowledge or task-specific guidance. These files provide granular instructions for particular aspects of the project, allowing for flexible and scalable instruction sets that complement the general guidelines in `copilot-instructions.md` and `AGENTS.md`.

By following these guidelines, autonomous agents can contribute effectively and reliably to the MyCodeXvantaOS project, ensuring high-quality code and adherence to architectural principles.
