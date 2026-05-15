# MyCodeXvantaOS Persona Engine - Integration Guide

This guide provides detailed instructions for integrating the Persona Engine with the MyCodeXvantaOS AI Team Orchestrator and other system components.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Basic Integration](#basic-integration)
4. [Advanced Integration](#advanced-integration)
5. [Event Handling](#event-handling)
6. [Governance and HITL](#governance-and-hitl)
7. [Performance Optimization](#performance-optimization)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Production Deployment](#production-deployment)

---

## Architecture Overview

The Persona Engine integrates with the AI Team Orchestrator through multiple layers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI Team Orchestrator                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Agent     │  │    Task     │  │  Workflow   │  │    Governance       │ │
│  │  Manager    │  │   Router    │  │   Engine    │  │    Enforcer         │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                    │            │
│         └────────────────┴────────────────┴────────────────────┘            │
│                                    │                                         │
│                          ┌─────────▼─────────┐                               │
│                          │ OrchestratorAdapter│                               │
│                          │  (Integration Layer)│                              │
│                          └─────────┬─────────┘                               │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                         Persona Engine                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ PersonaManager  │  │ SemanticMask    │  │ RootCause       │              │
│  │                 │  │ Detector        │  │ Analyzer        │              │
│  └────────┬────────┘  └─────────────────┘  └─────────────────┘              │
│           │                       │                    │                     │
│           └───────────────────────┴────────────────────┘                     │
│                                   │                                          │
│                    ┌──────────────▼──────────────┐                           │
│                    │      PersonaEngine          │                           │
│                    │    (Processing Core)        │                           │
│                    └─────────────────────────────┘                           │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Solution        │  │ Behavioral      │  │ Persona Cache   │              │
│  │ Generator       │  │ Adjuster        │  │ Manager         │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before integrating the Persona Engine, ensure you have:

1. **Node.js 18+** installed
2. **TypeScript 5.0+** for type safety
3. **MyCodeXvantaOS AI Team Orchestrator** module configured
4. **Persona configuration files** in place

### Dependencies

```json
{
  "dependencies": {
    "@mycodexvantaos/persona-engine": "^1.0.0",
    "yaml": "^2.3.0",
    "uuid": "^9.0.0"
  }
}
```

---

## Basic Integration

### Step 1: Install and Import

```typescript
import {
  PersonaManager,
  OrchestratorAdapter,
  createIntegration,
} from '@mycodexvantaos/persona-engine';
```

### Step 2: Initialize the Integration

```typescript
// Option A: Use the factory function (recommended)
const integration = createIntegration({
  enableCache: true,
  enableValidation: true,
  enableBehavioralAdjustment: true,
});

await integration.initialize();

// Option B: Manual configuration
const personaManager = new PersonaManager({
  urn: 'urn:mycodexvantaos:persona-manager:main',
  configPath: './config/personas',
  autoLoad: true,
  enableCache: true,
});

const orchestratorAdapter = new OrchestratorAdapter(
  {
    urn: 'urn:mycodexvantaos:adapter:persona-orchestrator',
    orchestratorUrn: 'urn:mycodexvantaos:module:ai-team-orchestrator',
    defaultPersonaArchetype: 'disrupter',
    enableSemanticMaskDetection: true,
    enableRootCauseAnalysis: true,
    hitlThreshold: 0.8,
    governanceTier: 1,
  },
  personaManager
);
```

### Step 3: Register Agents

```typescript
// Register agents that will use personas
integration.registerAgent({
  urn: 'urn:mycodexvantaos:agent:analyst-01',
  name: 'Primary Analyst',
  capabilities: ['data_analysis', 'pattern_recognition'],
  personaArchetype: 'analyst',
});

integration.registerAgent({
  urn: 'urn:mycodexvantaos:agent:challenger-01',
  name: 'Critical Challenger',
  capabilities: ['critical_review', 'assumption_testing'],
  personaArchetype: 'disrupter',
});
```

### Step 4: Process Tasks

```typescript
const result = await integration.processTask({
  taskId: 'task-001',
  type: 'consultation',
  priority: 'high',
  input: 'I need help understanding why my team is resistant to change.',
  metadata: {
    sourceAgentUrn: 'urn:mycodexvantaos:agent:coordinator',
    timestamp: new Date().toISOString(),
  },
});

console.log(result.content);
```

---

## Advanced Integration

### Multi-Persona Workflows

For complex analysis requiring multiple perspectives:

```typescript
import { PersonaOrchestratorIntegration } from '@mycodexvantaos/persona-engine';

class MultiPersonaAnalysis {
  private integration: PersonaOrchestratorIntegration;

  constructor(integration: PersonaOrchestratorIntegration) {
    this.integration = integration;
  }

  async analyzeWithMultiplePerspectives(input: string): Promise<Map<string, string>> {
    const perspectives = new Map<string, string>();
    const archetypes: PersonaArchetype[] = ['disrupter', 'analyst', 'synthesizer'];

    for (const archetype of archetypes) {
      const result = await this.integration.processTask({
        taskId: `analysis-${archetype}-${Date.now()}`,
        type: 'analysis',
        priority: 'medium',
        input,
        preferredArchetype: archetype,
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:coordinator',
          timestamp: new Date().toISOString(),
        },
      });

      perspectives.set(archetype, result.content);
    }

    return perspectives;
  }
}
```

### Dynamic Persona Selection

```typescript
import { BehavioralAdjuster, AdjustmentContext } from '@mycodexvantaos/persona-engine';

const adjuster = new BehavioralAdjuster();

function selectPersonaForContext(context: AdjustmentContext): PersonaArchetype {
  // High sensitivity topic - use mediator
  if (context.topicSensitivity && context.topicSensitivity > 0.7) {
    return 'mediator';
  }

  // Low engagement - use mentor
  if (context.engagementLevel && context.engagementLevel < 0.3) {
    return 'mentor';
  }

  // Complex topic - use synthesizer
  if (context.topicComplexity && context.topicComplexity > 0.8) {
    return 'synthesizer';
  }

  // Default to disrupter for challenging assumptions
  return 'disrupter';
}
```

### Caching Strategies

```typescript
import { PersonaCacheManager } from '@mycodexvantaos/persona-engine';

const cache = new PersonaCacheManager({
  maxEntries: 2000,
  defaultTTL: 600000, // 10 minutes
  enableLRU: true,
});

// Cache analysis results
cache.setAnalysisResult(sessionId, 'root_cause', diagnosisResult);

// Retrieve cached results
const cachedDiagnosis = cache.getAnalysisResult<RootCauseDiagnosis>(sessionId, 'root_cause');

// Invalidate session cache when done
cache.invalidateSession(sessionId);
```

---

## Event Handling

### Setting Up Event Listeners

```typescript
const adapter = integration.getOrchestratorAdapter();

adapter.addEventListener((event) => {
  switch (event.type) {
    case 'session_created':
      handleNewSession(event.data);
      break;

    case 'mask_detected':
      handleSemanticMask(event.data);
      break;

    case 'hitl_triggered':
      escalateToHuman(event.data);
      break;

    case 'error':
      logError(event.data);
      break;
  }
});
```

### Event-Driven Workflow Control

```typescript
interface WorkflowController {
  pause(sessionId: string): void;
  resume(sessionId: string): void;
  escalate(sessionId: string, reason: string): void;
}

function handleHITLTrigger(event: AdapterEvent, controller: WorkflowController): void {
  const { sessionId, triggers } = event.data;

  for (const trigger of triggers) {
    if (trigger.severity === 'high') {
      controller.pause(sessionId);
      notifyHumanReviewer(sessionId, trigger.reason);
    }
  }
}
```

---

## Governance and HITL

### Governance Tiers

```typescript
// Tier 0: Basic logging
const basicAdapter = new OrchestratorAdapter(
  {
    governanceTier: 0,
    // ... other config
  },
  personaManager
);

// Tier 2: Human review required
const reviewedAdapter = new OrchestratorAdapter(
  {
    governanceTier: 2,
    hitlThreshold: 0.5, // Lower threshold = more human reviews
    // ... other config
  },
  personaManager
);

// Tier 3: Maximum audit trail
const auditedAdapter = new OrchestratorAdapter(
  {
    governanceTier: 3,
    // ... other config
  },
  personaManager
);
```

### HITL Checkpoint Configuration

```typescript
const hitlConfig = {
  triggers: [
    {
      condition: 'confidence_below_threshold',
      threshold: 0.6,
      action: 'request_human_review',
    },
    {
      condition: 'sensitive_topic_detected',
      keywords: ['mental_health', 'crisis', 'emergency'],
      action: 'immediate_escalation',
    },
    {
      condition: 'no_solutions_generated',
      action: 'request_human_input',
    },
  ],
};
```

---

## Performance Optimization

### Caching Best Practices

```typescript
// Profile caching
cache.setProfile('disrupter', profile, 3600000); // 1 hour TTL

// Response caching with hash
const inputHash = hashInput(userInput);
cache.setResponse(sessionId, inputHash, response, 300000); // 5 minutes

// Bulk invalidation
cache.invalidateByTag('analysis');
```

### Batch Processing

```typescript
async function processBatch(inputs: string[], archetype: PersonaArchetype): Promise<TaskResult[]> {
  const results: TaskResult[] = [];

  // Process in parallel with concurrency limit
  const batchSize = 5;
  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((input) =>
        integration.processTask({
          taskId: `batch-${i}-${Date.now()}`,
          type: 'analysis',
          priority: 'medium',
          input,
          preferredArchetype: archetype,
          metadata: {
            sourceAgentUrn: 'urn:mycodexvantaos:agent:batch-processor',
            timestamp: new Date().toISOString(),
          },
        })
      )
    );
    results.push(...batchResults);
  }

  return results;
}
```

---

## Error Handling

### Comprehensive Error Handling

```typescript
import { ValidationResult } from '@mycodexvantaos/persona-engine';

async function safeProcess(task: OrchestratorTask): Promise<TaskResult> {
  try {
    // Validate input first
    if (!task.input || task.input.trim().length === 0) {
      throw new Error('Empty input provided');
    }

    const result = await integration.processTask(task);

    // Check for processing issues
    if (!result.success) {
      logWarning('Processing failed', { taskId: task.taskId, result });
    }

    return result;
  } catch (error) {
    if (error instanceof ValidationError) {
      return createErrorResult(task.taskId, 'validation_failed', error.message);
    }

    if (error instanceof TimeoutError) {
      return createErrorResult(task.taskId, 'timeout', 'Processing timed out');
    }

    return createErrorResult(task.taskId, 'unknown', 'An unexpected error occurred');
  }
}
```

---

## Testing

### Unit Testing Integration

```typescript
import { PersonaValidator, PersonaCacheManager } from '@mycodexvantaos/persona-engine';

describe('PersonaOrchestratorIntegration', () => {
  let integration: PersonaOrchestratorIntegration;

  beforeEach(async () => {
    integration = createIntegration({
      enableCache: true,
      enableValidation: true,
    });
    await integration.initialize();
  });

  afterEach(() => {
    integration.shutdown();
  });

  test('should process task with correct persona', async () => {
    const result = await integration.processTask({
      taskId: 'test-001',
      type: 'analysis',
      priority: 'medium',
      input: 'Test input for analysis',
      preferredArchetype: 'analyst',
      metadata: {
        sourceAgentUrn: 'test-agent',
        timestamp: new Date().toISOString(),
      },
    });

    expect(result.success).toBe(true);
    expect(result.personaArchetype).toBe('analyst');
  });

  test('should detect semantic masks', async () => {
    const result = await integration.processTask({
      taskId: 'test-002',
      type: 'consultation',
      priority: 'high',
      input: 'Everything happens for a reason. The universe has a plan.',
      metadata: {
        sourceAgentUrn: 'test-agent',
        timestamp: new Date().toISOString(),
      },
    });

    expect(result.insights?.semanticMasks).toBeDefined();
    expect(result.insights?.semanticMasks?.length).toBeGreaterThan(0);
  });
});
```

---

## Production Deployment

### Health Checks

```typescript
// Health check endpoint
app.get('/health/persona-engine', (req, res) => {
  const health = integration.getHealthStatus();

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### Monitoring

```typescript
// Prometheus metrics
const metrics = {
  tasksProcessed: new Counter('persona_tasks_processed_total'),
  processingTime: new Histogram('persona_processing_time_ms'),
  cacheHits: new Counter('persona_cache_hits_total'),
  cacheMisses: new Counter('persona_cache_misses_total'),
};

integration.addEventListener((event) => {
  if (event.type === 'hit') {
    metrics.cacheHits.inc();
  } else if (event.type === 'miss') {
    metrics.cacheMisses.inc();
  }
});
```

### Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down Persona Engine...');

  // Stop accepting new tasks
  integration.pause();

  // Wait for current tasks to complete
  await integration.drain();

  // Clean up resources
  integration.shutdown();

  process.exit(0);
});
```

---

## Troubleshooting

### Common Issues

1. **Persona not found**: Ensure persona configurations are loaded

   ```typescript
   const available = integration.getAvailablePersonas();
   console.log('Available personas:', available);
   ```

2. **Cache not working**: Check cache statistics

   ```typescript
   const stats = cache.getStatistics();
   console.log('Cache hit ratio:', stats.hitRatio);
   ```

3. **HITL triggering too often**: Adjust threshold
   ```typescript
   const adapter = new OrchestratorAdapter(
     {
       hitlThreshold: 0.9, // Higher = fewer triggers
       // ...
     },
     personaManager
   );
   ```

---

## Support

For additional support:

- Documentation: `/docs`
- Issues: GitHub Issues
- Community: Discord channel

---

_Last updated: 2024-01-15_
