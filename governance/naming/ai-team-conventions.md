# AI Team Naming Conventions

## Overview

This document establishes the naming standards for all AI Team components within MyCodeXvantaOS. Adherence to these conventions ensures consistency, discoverability, and governance compliance.

## URN (Uniform Resource Name) Structure

All entities must follow the URN pattern:

```
urn:mycodexvantaos:<entity-type>:<identifier>
```

### Entity Types and Patterns

| Entity Type | Pattern                                | Example                                         |
| ----------- | -------------------------------------- | ----------------------------------------------- |
| Agent       | `urn:mycodexvantaos:agent:<name>`      | `urn:mycodexvantaos:agent:architect-primary`    |
| Team        | `urn:mycodexvantaos:team:<name>`       | `urn:mycodexvantaos:team:devops-pipeline`       |
| Task        | `urn:mycodexvantaos:task:<id>`         | `urn:mycodexvantaos:task:deploy-service-001`    |
| Message     | `urn:mycodexvantaos:message:<id>`      | `urn:mycodexvantaos:message:msg-20240101-001`   |
| Tool        | `urn:mycodexvantaos:tool:<name>`       | `urn:mycodexvantaos:tool:code-analyzer`         |
| Capability  | `urn:mycodexvantaos:capability:<name>` | `urn:mycodexvantaos:capability:code-generation` |
| Service     | `urn:mycodexvantaos:service:<name>`    | `urn:mycodexvantaos:service:ai-engine`          |
| Module      | `urn:mycodexvantaos:module:<name>`     | `urn:mycodexvantaos:module:orchestrator`        |
| Schema      | `urn:mycodexvantaos:schema:<name>`     | `urn:mycodexvantaos:schema:agent-profile`       |

## Identifier Naming Rules

### General Rules

1. Use lowercase letters only
2. Use hyphens (`-`) to separate words
3. No underscores, spaces, or special characters
4. Must start with a letter
5. Must end with a letter or number
6. Maximum length: 64 characters

### Agent Naming Convention

Agent identifiers should follow the pattern:

```
<role>-<specialization>-<instance>
```

Examples:

- `architect-primary`
- `engineer-backend-01`
- `tester-security-02`
- `ethicist-compliance-primary`
- `blockchain-expert-defi-primary`

### Team Naming Convention

Team identifiers should follow the pattern:

```
<domain>-<purpose>-<instance>
```

Examples:

- `devops-pipeline-primary`
- `security-audit-team-01`
- `development-fullstack-primary`

### Task Naming Convention

Task identifiers should follow the pattern:

```
<action>-<target>-<sequence>
```

Examples:

- `deploy-service-001`
- `review-code-042`
- `analyze-security-007`

## Prompt Template Variables

All agent prompt templates must use the following standardized variables:

| Variable              | Description                     | Usage                          |
| --------------------- | ------------------------------- | ------------------------------ |
| `{{CONTEXT}}`         | Current execution context       | Required for all prompts       |
| `{{OBJECTIVE}}`       | The goal to accomplish          | Required for task prompts      |
| `{{CONSTRAINTS}}`     | Limitations and rules           | Optional                       |
| `{{BACKSTORY}}`       | Agent's background              | Required for system prompts    |
| `{{TOOLS_AVAILABLE}}` | List of available tools         | Optional                       |
| `{{OUTPUT_FORMAT}}`   | Expected output schema          | Required                       |
| `{{LANGUAGE}}`        | Programming or natural language | Optional, default: auto-detect |
| `{{MAX_ITERATIONS}}`  | Self-correction limit           | Optional, default: 5           |

### Example Prompt Template

```markdown
# System Prompt for {{AGENT_NAME}}

## Identity

{{BACKSTORY}}

## Current Context

{{CONTEXT}}

## Objective

{{OBJECTIVE}}

## Constraints

{{CONSTRAINTS}}

## Available Tools

{{TOOLS_AVAILABLE}}

## Output Requirements

Please respond in the following format:
{{OUTPUT_FORMAT}}
```

## File Naming Conventions

### Configuration Files

- Agent profiles: `agents/<agent-name>.yaml`
- Team topologies: `teams/<team-name>.yaml`
- Schemas: `schemas/<schema-name>.schema.json`

### Source Code Files

- Classes: PascalCase (e.g., `AgentManager.py`)
- Modules: kebab-case (e.g., `agent-manager.ts`)
- Tests: `<module-name>.test.ts` or `test_<module_name>.py`

## Module Naming Convention

NPM package names follow the pattern:

```
@mycodexvantaos/<module-name>
```

Examples:

- `@mycodexvantaos/ai-team-orchestrator`
- `@mycodexvantaos/agent-toolkit`
- `@mycodexvantaos/ai-team-service`

## Governance Tier Classification

| Tier | Level        | Description                     | Example Agents           |
| ---- | ------------ | ------------------------------- | ------------------------ |
| -1   | Experimental | Sandbox only, requires approval | `disruptor-l1`           |
| 0    | Standard     | Normal operations               | `engineer-backend-01`    |
| 1    | Elevated     | Cross-module access             | `architect-primary`      |
| 2    | High         | Sensitive operations            | `security-specialist-01` |
| 3    | Critical     | Core system operations          | `governance-enforcer-01` |

## Validation Rules

1. All URNs must pass regex validation against their entity type pattern
2. Agent IDs must reference existing agent profiles
3. Tool references must be resolvable to registered tools
4. Capability declarations must match the capability registry
5. Governance tier must be appropriate for the agent's permitted actions

## Change Management

Any modifications to naming conventions must:

1. Be proposed via governance pull request
2. Include impact analysis of existing entities
3. Provide migration plan if breaking changes are introduced
4. Be approved by at least two architecture reviewers

---

**Document Version**: 1.0.0  
**Last Updated**: 2024-01-01  
**Governance Status**: Active
