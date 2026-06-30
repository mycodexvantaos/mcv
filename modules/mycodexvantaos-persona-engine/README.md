# MyCodeXvantaOS Persona Engine

A sophisticated persona engine for the MyCodeXvantaOS AI Team system, providing intelligent persona management with semantic mask detection, root cause analysis, and solution generation.

## Overview

The Persona Engine implements a unique "Disrupter" persona system that challenges surface-level thinking and helps users uncover deeper truths. It features:

- **Semantic Mask Detection**: Identifies 8 types of comforting but misleading language patterns
- **Root Cause Analysis**: Multi-layer analysis from surface symptoms to core beliefs
- **Solution Generation**: Creates actionable solutions across 5 categories
- **Dynamic Behavioral Adjustment**: Adapts persona behavior based on context
- **Orchestrator Integration**: Seamless integration with AI Team Orchestrator

## Installation

```bash
npm install @mycodexvantaos/persona-engine
```

## Quick Start

```typescript
import { PersonaManager, PersonaEngine, OrchestratorAdapter } from '@mycodexvantaos/persona-engine';

// Create a persona manager
const manager = new PersonaManager({
  urn: 'urn:mycodexvantaos:persona-manager:main',
  configPath: './config/personas',
  autoLoad: true,
});

// Get a persona engine for a specific archetype
const engine = manager.getEngine('disrupter');

// Process input through the persona
const session = engine.createSession();
const result = await engine.process(
  'I feel like everything is fine, I just need to think positive.',
  session
);

console.log(result.response.content);
// Output includes critical track, constructive track, and detected masks
```

## Architecture

### Core Components

```
src/
├── core/
│   ├── semantic-mask-detector.ts    # Detects semantic masks
│   ├── root-cause-analyzer.ts       # Multi-layer root cause analysis
│   ├── solution-generator.ts        # Generates solution proposals
│   ├── persona-engine.ts            # Main processing engine
│   ├── persona-manager.ts           # Manages multiple personas
│   ├── orchestrator-adapter.ts      # AI Team Orchestrator integration
│   ├── persona-cache-manager.ts     # Intelligent caching
│   ├── persona-validator.ts         # Configuration validation
│   └── behavioral-adjuster.ts       # Dynamic parameter adjustment
├── types/
│   └── index.ts                     # TypeScript type definitions
└── tests/                           # Unit tests
```

### Persona Archetypes

The engine supports multiple persona archetypes:

| Archetype            | Description                                 | Key Traits                                           |
| -------------------- | ------------------------------------------- | ---------------------------------------------------- |
| **Disrupter**        | Challenges assumptions and surface thinking | High directness, low empathy, high questioning depth |
| **Analyst**          | Data-driven analytical approach             | High questioning depth, moderate empathy             |
| **Critic**           | Quality assurance and critical review       | High critical tolerance, high directness             |
| **Architect**        | System design and solutions                 | High solution focus, high abstraction                |
| **Mediator**         | Conflict resolution and balance             | High empathy, low contradiction                      |
| **Creative Thinker** | Innovation and ideation                     | High abstraction, moderate contradiction             |
| **Facilitator**      | Process and group dynamics                  | High inclusivity, high neutrality                    |
| **Mentor**           | Guidance and support                        | High empathy, high patience                          |
| **Synthesizer**      | Integration and patterns                    | High integrative thinking, high pattern recognition  |

## Usage Examples

### Semantic Mask Detection

```typescript
import { SemanticMaskDetector } from '@mycodexvantaos/persona-engine';

const detector = new SemanticMaskDetector();

const result = detector.detect('Everything happens for a reason. The universe has a plan.');

if (result.detected) {
  console.log('Mask type:', result.masks[0].type);
  // Output: 'spiritual_bypass'

  console.log('Truth reframe:', result.masks[0].truth_reframe);
  // Output: A grounded alternative perspective
}
```

### Root Cause Analysis

```typescript
import { RootCauseAnalyzer } from '@mycodexvantaos/persona-engine';

const analyzer = new RootCauseAnalyzer();
const context = analyzer.initializeAnalysis('I keep procrastinating on important tasks.');

// Record findings at each layer
analyzer.recordFindings('surface_symptoms', {
  observed_behaviors: ['procrastination', 'avoidance'],
  reported_feelings: ['anxiety', 'guilt'],
});

analyzer.recordFindings('behavioral_patterns', {
  recurring_patterns: ['task avoidance', 'last-minute rushes'],
  triggers: ['complex tasks', 'fear of failure'],
});

const result = analyzer.generateResult();
console.log(result.root_causes);
```

### Solution Generation

```typescript
import { SolutionGenerator } from '@mycodexvantaos/persona-engine';

const generator = new SolutionGenerator();

const solutions = generator.generate({
  diagnosis: diagnosisResult,
  constraints: {
    timeAvailable: '2 hours per week',
    resources: ['journaling', 'meditation app'],
  },
  preferences: {
    preferredCategories: ['behavioral_action', 'skill_development'],
    avoidCategories: [],
  },
});

solutions.forEach((solution) => {
  console.log(`${solution.category}: ${solution.description}`);
  console.log(`Priority: ${solution.priority}, Feasibility: ${solution.feasibility_score}`);
});
```

### Dynamic Behavioral Adjustment

```typescript
import { BehavioralAdjuster } from '@mycodexvantaos/persona-engine';

const adjuster = new BehavioralAdjuster();

const baseParams = {
  critical_tolerance: 0.5,
  empathy_level: 0.5,
  directness: 0.5,
  solution_focus: 0.5,
  abstraction_preference: 0.5,
  questioning_depth: 0.5,
  contradiction_frequency: 0.3,
};

const result = adjuster.adjust(baseParams, {
  engagementLevel: 0.3,
  feedbackScore: -0.2,
  topicSensitivity: 0.6,
});

console.log('Adjusted parameters:', result.adjusted);
console.log('Applied rules:', result.appliedRules);
```

### Orchestrator Integration

```typescript
import { OrchestratorAdapter, PersonaManager } from '@mycodexvantaos/persona-engine';

const manager = new PersonaManager({
  /* config */
});
const adapter = new OrchestratorAdapter(
  {
    urn: 'urn:mycodexvantaos:adapter:persona-orchestrator',
    orchestratorUrn: 'urn:mycodexvantaos:module:ai-team-orchestrator',
    defaultPersonaArchetype: 'disrupter',
    enableSemanticMaskDetection: true,
    enableRootCauseAnalysis: true,
    hitlThreshold: 0.8,
    governanceTier: 1,
  },
  manager
);

// Process request from orchestrator
const response = await adapter.processRequest({
  requestId: 'req-001',
  sourceAgentUrn: 'urn:mycodexvantaos:agent:coordinator',
  input: 'User input here',
  context: {
    timestamp: new Date().toISOString(),
  },
});
```

## Configuration

### Persona Profile Schema

Each persona is configured with a YAML file following this structure:

```yaml
metadata:
  urn: 'urn:mycodexvantaos:persona:disrupter-primary'
  name: 'Disrupter Primary'
  version: '1.0.0'
  archetype: 'disrupter'

behavioral_parameters:
  critical_tolerance: 0.7 # 0-1: tolerance for accepting surface explanations
  empathy_level: 0.3 # 0-1: emotional attunement in responses
  directness: 0.9 # 0-1: how directly challenging to be
  solution_focus: 0.6 # 0-1: orientation toward actionable solutions
  abstraction_preference: 0.4 # 0-1: tendency toward abstract vs concrete
  questioning_depth: 0.8 # 0-1: depth of probing questions
  contradiction_frequency: 0.7 # 0-1: how often to challenge assumptions

response_patterns:
  opening_style: 'challenging'
  analytical_framework: 'first_principles'
  conclusion_style: 'action_oriented'

governance:
  tier: 1
  hitl_checkpoint: true
  constraints:
    - 'no_harmful_content'
    - 'respect_boundaries'
```

### Governance Tiers

| Tier | Description  | Constraints                          |
| ---- | ------------ | ------------------------------------ |
| -1   | Unrestricted | No constraints                       |
| 0    | Basic        | Logging, input validation            |
| 1    | Standard     | Full logging, input/output filtering |
| 2    | Elevated     | + Human review required              |
| 3    | Maximum      | + Full audit trail                   |

## Semantic Mask Types

The engine detects 8 types of semantic masks:

1. **Comforting Platitude** - Generic positive statements without substance
2. **Vague Healing Language** - Undefined "healing" concepts
3. **Spiritual Bypass** - Using spirituality to avoid difficult truths
4. **Intellectual Rationalization** - Using logic to avoid emotional engagement
5. **Emotional Performance** - Performative emotional expression
6. **False Equivalency** - False balance between different aspects
7. **Performative Vulnerability** - Strategic vulnerability without real openness
8. **Performance Optimization Framing** - Repackaging discomfort as inefficiency

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## API Reference

Full API documentation is available in the `docs/` directory.

### Key Interfaces

```typescript
interface PersonaProfile {
  urn: string;
  name: string;
  archetype: PersonaArchetype;
  version: string;
  description: string;
  behavioral_parameters: BehavioralParameters;
  response_patterns: ResponsePatterns;
  governance: GovernanceConfig;
}

interface BehavioralParameters {
  critical_tolerance: number;
  empathy_level: number;
  directness: number;
  solution_focus: number;
  abstraction_preference: number;
  questioning_depth: number;
  contradiction_frequency: number;
}
```

## Integration with AI Team Orchestrator

The Persona Engine integrates with the MyCodeXvantaOS AI Team Orchestrator through the `OrchestratorAdapter`:

```
┌─────────────────────────────────────────────────────────────┐
│                   AI Team Orchestrator                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐    ┌──────────────────────────────────┐ │
│  │ Agent Manager  │───▶│        OrchestratorAdapter       │ │
│  └────────────────┘    ├──────────────────────────────────┤ │
│                        │ - Request Processing              │ │
│  ┌────────────────┐    │ - Session Management             │ │
│  │  Task Router   │───▶│ - HITL Checkpoints               │ │
│  └────────────────┘    │ - Governance Enforcement         │ │
│                        └──────────────┬───────────────────┘ │
│                                       │                      │
│                        ┌──────────────▼───────────────────┐ │
│                        │         Persona Engine           │ │
│                        ├──────────────────────────────────┤ │
│                        │ - Semantic Mask Detection        │ │
│                        │ - Root Cause Analysis            │ │
│                        │ - Solution Generation            │ │
│                        │ - Behavioral Adjustment          │ │
│                        └──────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Contributing

Please read the contributing guidelines in `CONTRIBUTING.md` before submitting PRs.

## License

MIT License - see `LICENSE` file for details.

## Version History

- **1.0.0** - Initial release with core persona engine functionality
  - Semantic mask detection (8 types)
  - Root cause analysis (6 layers)
  - Solution generation (5 categories)
  - 9 persona archetypes
  - Orchestrator integration
  - Dynamic behavioral adjustment
  - Intelligent caching
  - Configuration validation
