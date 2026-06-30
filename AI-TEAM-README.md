# MyCodeXvantaOS

A comprehensive AI Team orchestration system with Persona Engine for intelligent, multi-perspective problem solving.

## Overview

MyCodeXvantaOS provides a robust framework for orchestrating AI teams with sophisticated persona-based interactions. It combines two powerful modules:

- **AI Team Orchestrator** - Manages multi-agent collaboration, task routing, workflow execution, and governance
- **Persona Engine** - Implements intelligent personas with semantic mask detection, root cause analysis, and solution generation

## Features

### AI Team Orchestrator

- Multi-agent coordination and communication
- Task decomposition and routing
- Workflow engine with parallel and sequential execution
- Team topology management
- Governance enforcement with tiered control
- Human-in-the-Loop (HITL) checkpoints

### Persona Engine

- 9 persona archetypes (Disrupter, Analyst, Critic, Architect, Mediator, Creative Thinker, Facilitator, Mentor, Synthesizer)
- Semantic mask detection (8 types)
- Multi-layer root cause analysis
- Solution generation across 5 categories
- Dynamic behavioral adjustment
- Intelligent caching and validation

## Installation

```bash
npm install mycodexvantaos
```

## Quick Start

```typescript
import { createMyCodeXvantaOSSystem } from "mycodexvantaos";

async function main() {
  // Initialize the complete system
  const { orchestrator, personaIntegration } = await createMyCodeXvantaOSSystem({
    orchestrator: {
      defaultGovernanceTier: 1,
      enableAuditLog: true,
    },
    persona: {
      defaultArchetype: "disrupter",
      enableCache: true,
      enableValidation: true,
    },
  });

  // Register an agent
  orchestrator.registerAgent({
    urn: "urn:mycodexvantaos:agent:analyst-01",
    name: "Primary Analyst",
    capabilities: ["data_analysis", "pattern_recognition"],
    archetype: "analyst",
  });

  // Process a task with persona integration
  const result = await personaIntegration.processTask({
    taskId: "task-001",
    type: "consultation",
    priority: "high",
    input: "I need help analyzing why our team velocity has decreased.",
    metadata: {
      sourceAgentUrn: "urn:mycodexvantaos:agent:coordinator",
      timestamp: new Date().toISOString(),
    },
  });

  console.log(result.content);
}

main();
```

## Architecture

```
mycodexvantaos/
├── modules/
│   ├── mycodexvantaos-ai-team-orchestrator/
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── agent-manager.ts
│   │   │   │   ├── message-bus.ts
│   │   │   │   ├── orchestrator.ts
│   │   │   │   ├── task-decomposer.ts
│   │   │   │   ├── team-manager.ts
│   │   │   │   ├── workflow-engine.ts
│   │   │   │   └── governance-enforcer.ts
│   │   │   ├── types/
│   │   │   └── tests/
│   │   ├── config/
│   │   │   ├── agents/
│   │   │   ├── teams/
│   │   │   └── workflows/
│   │   └── package.json
│   │
│   └── mycodexvantaos-persona-engine/
│       ├── src/
│       │   ├── core/
│       │   │   ├── semantic-mask-detector.ts
│       │   │   ├── root-cause-analyzer.ts
│       │   │   ├── solution-generator.ts
│       │   │   ├── persona-engine.ts
│       │   │   ├── persona-manager.ts
│       │   │   ├── orchestrator-adapter.ts
│       │   │   ├── persona-cache-manager.ts
│       │   │   ├── persona-validator.ts
│       │   │   └── behavioral-adjuster.ts
│       │   ├── integration/
│       │   ├── types/
│       │   └── tests/
│       ├── config/
│       │   ├── personas/
│       │   ├── teams/
│       │   └── workflows/
│       ├── docs/
│       └── package.json
│
├── schemas/
│   ├── ai-team/
│   │   ├── agent-profile.schema.json
│   │   ├── agent-message.schema.json
│   │   ├── agent-task.schema.json
│   │   └── team-topology.schema.json
│   └── persona/
│       ├── persona-profile.schema.json
│       └── semantic-mask.schema.json
│
├── services/
│   └── mycodexvantaos-ai-team-service/
│       ├── src/
│       │   ├── api/
│       │   ├── graphql/
│       │   ├── websocket/
│       │   └── server.ts
│       └── package.json
│
├── docs/
├── governance/
├── index.ts
├── package.json
└── tsconfig.json
```

## Modules

### AI Team Orchestrator

The orchestrator manages the lifecycle of AI agents and their interactions:

```typescript
import { Orchestrator, AgentManager, WorkflowEngine } from "mycodexvantaos/orchestrator";

const orchestrator = new Orchestrator({
  urn: "urn:mycodexvantaos:orchestrator:main",
  governanceTier: 1,
});

// Start a workflow
const workflow = await orchestrator.executeWorkflow("security-audit", {
  target: "codebase",
  depth: "comprehensive",
});
```

### Persona Engine

The persona engine provides intelligent analysis capabilities:

```typescript
import {
  PersonaManager,
  SemanticMaskDetector,
  RootCauseAnalyzer,
  SolutionGenerator,
} from "mycodexvantaos/persona";

// Detect semantic masks
const detector = new SemanticMaskDetector();
const masks = detector.detect("Everything happens for a reason...");

// Analyze root causes
const analyzer = new RootCauseAnalyzer();
const diagnosis = analyzer.quickAnalyze("I keep procrastinating on important tasks.");

// Generate solutions
const generator = new SolutionGenerator();
const solutions = generator.generate({ diagnosis });
```

## Persona Archetypes

| Archetype            | Role                   | Key Traits                               |
| -------------------- | ---------------------- | ---------------------------------------- |
| **Disrupter**        | Challenges assumptions | High directness, low empathy, critical   |
| **Analyst**          | Data-driven analysis   | High questioning, evidence-based         |
| **Critic**           | Quality assurance      | High critical tolerance, direct          |
| **Architect**        | Solution design        | High solution focus, systematic          |
| **Mediator**         | Conflict resolution    | High empathy, balanced                   |
| **Creative Thinker** | Innovation             | High abstraction, moderate contradiction |
| **Facilitator**      | Process guidance       | High inclusivity, neutral                |
| **Mentor**           | Support and guidance   | High empathy, patient                    |
| **Synthesizer**      | Integration            | High pattern recognition, bridging       |

## Governance Tiers

| Tier | Level        | Features                    |
| ---- | ------------ | --------------------------- |
| -1   | Unrestricted | No constraints              |
| 0    | Basic        | Logging, input validation   |
| 1    | Standard     | Full logging, I/O filtering |
| 2    | Elevated     | + Human review required     |
| 3    | Maximum      | + Full audit trail          |

## Workflows

MyCodeXvantaOS includes pre-built workflow patterns:

- **CI/CD Pipeline** - Automated development workflow
- **Security Audit** - Comprehensive security review
- **Sequential Review** - Step-by-step code review
- **Parallel Processing** - Concurrent task execution
- **Multi-Persona Debate** - Structured multi-perspective analysis
- **Iterative Refinement** - Cyclic quality improvement
- **Persona Consultation** - Persona-based problem solving

## Configuration

### Agent Configuration (YAML)

```yaml
urn: "urn:mycodexvantaos:agent:analyst-01"
name: "Primary Analyst"
archetype: "analyst"
capabilities:
  - data_analysis
  - pattern_recognition
  - statistical_modeling
governance:
  tier: 1
  constraints:
    - data_privacy
    - audit_trail
```

### Persona Configuration (YAML)

```yaml
metadata:
  urn: "urn:mycodexvantaos:persona:disrupter-primary"
  name: "Disrupter Primary"
  archetype: "disrupter"

behavioral_parameters:
  critical_tolerance: 0.7
  empathy_level: 0.3
  directness: 0.9
  solution_focus: 0.6
  abstraction_preference: 0.4
  questioning_depth: 0.8
  contradiction_frequency: 0.7
```

## API Reference

Full API documentation is available in the `docs/` directory of each module.

## Development

```bash
# Clone the repository
git clone https://github.com/mycodexvantaos/mycodexvantaos.git

# Install dependencies
npm install

# Build all modules
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific module tests
npm run test:orchestrator
npm run test:persona
```

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting PRs.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [https://docs.mycodexvantaos.ai](https://docs.mycodexvantaos.ai)
- **Issues**: [GitHub Issues](https://github.com/mycodexvantaos/mycodexvantaos/issues)
- **Community**: [Discord](https://discord.gg/mycodexvantaos)

---

**MyCodeXvantaOS** - Empowering AI Teams with Intelligent Personas
