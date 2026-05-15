# MyCodeXvantaOS AI Team Orchestrator

## Overview

The AI Team Orchestrator is a core module of MyCodeXvantaOS that enables multi-agent collaboration and task orchestration. It provides the infrastructure for creating, managing, and coordinating AI agents working together on complex tasks.

## Architecture

### Core Principles

- **Local-First**: Core functionality works without external dependencies
- **Cloud-Agnostic**: Not tied to any specific cloud provider
- **Contract-First**: All interfaces are defined via JSON schemas
- **Governance-Enforced**: All operations are subject to governance policies

### Module Structure

```
mycodexvantaos-ai-team-orchestrator/
├── src/
│   ├── core/
│   │   ├── orchestrator.ts      # Main facade
│   │   ├── agent-manager.ts     # Agent lifecycle management
│   │   ├── message-bus.ts       # Pub/Sub messaging
│   │   ├── workflow-engine.ts   # DAG/State Machine execution
│   │   ├── team-manager.ts      # Team topology management
│   │   ├── task-decomposer.ts   # Task decomposition
│   │   └── governance-enforcer.ts # Policy enforcement
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── index.ts                 # Module exports
├── config/
│   ├── agents/                  # Agent profile definitions
│   └── teams/                   # Team topology definitions
└── tests/
```

## Core Components

### 1. Orchestrator

The main entry point for all AI Team operations. Provides a unified API for:

- Agent registration and management
- Team creation and activation
- Workflow execution
- Message routing
- Governance operations

### 2. AgentManager

Manages the lifecycle of AI agents:

- Registration and deregistration
- Task assignment and release
- Context window management
- Memory compression

### 3. MessageBus

Implements Pub/Sub pattern for agent communication:

- Direct messaging
- Broadcast messaging
- Message queuing
- Retry handling
- Event emission

### 4. WorkflowEngine

Executes workflows using DAG or State Machine patterns:

- Workflow definition validation
- Cycle detection
- Node execution
- HITL checkpoint management
- Error handling and recovery

### 5. TeamManager

Manages team topologies:

- Team creation from topology
- Agent assignment
- Topology type management
- HITL configuration

### 6. TaskDecomposer

Decomposes complex tasks into subtasks:

- Pattern-based decomposition rules
- Sequential, parallel, and hybrid strategies
- Subtask dependency generation

### 7. GovernanceEnforcer

Enforces governance policies:

- Permission validation by tier
- Approval workflow management
- Tool access control
- Policy management

## Agent Roles

The system supports the following specialized agent roles:

| Role                  | Description                      | Default Tier |
| --------------------- | -------------------------------- | ------------ |
| `architect`           | System design and architecture   | 1 (Elevated) |
| `engineer`            | Code implementation              | 0 (Standard) |
| `tester`              | Quality assurance and testing    | 0 (Standard) |
| `reviewer`            | Code review and feedback         | 0 (Standard) |
| `coordinator`         | Team coordination and management | 1 (Elevated) |
| `analyst`             | Data analysis and insights       | 0 (Standard) |
| `ethicist`            | AI ethics and compliance         | 2 (High)     |
| `blockchain_expert`   | Blockchain and DeFi              | 1 (Elevated) |
| `security_specialist` | Security audit and compliance    | 2 (High)     |
| `devops_engineer`     | DevOps and infrastructure        | 1 (Elevated) |
| `data_scientist`      | ML and data science              | 0 (Standard) |

## Governance Tiers

| Tier | Level        | Description                     |
| ---- | ------------ | ------------------------------- |
| -1   | Experimental | Sandbox only, requires approval |
| 0    | Standard     | Normal operations               |
| 1    | Elevated     | Cross-module access             |
| 2    | High         | Sensitive operations            |
| 3    | Critical     | Core system operations          |

## Topology Types

| Type            | Description                 | Best For            |
| --------------- | --------------------------- | ------------------- |
| `sequential`    | Agents execute in order     | Linear workflows    |
| `hierarchical`  | Manager-coordinator pattern | Complex projects    |
| `broadcast`     | All agents receive messages | Information sharing |
| `mesh`          | Peer-to-peer communication  | Collaborative tasks |
| `dag`           | Directed Acyclic Graph      | Parallel processing |
| `state_machine` | State-based transitions     | Complex workflows   |

## API Usage

### REST API

```bash
# Register an agent
POST /api/v1/agents
Content-Type: application/json
{
  "id": "urn:mycodexvantaos:agent:my-agent",
  "name": "My Agent",
  "role": "engineer",
  ...
}

# Create a team
POST /api/v1/teams
{
  "name": "Development Team",
  "topology_type": "hierarchical",
  "agents": [...]
}

# Start a workflow
POST /api/v1/workflows/start
{
  "team_id": "urn:mycodexvantaos:team:dev-team",
  "variables": {...}
}
```

### GraphQL

```graphql
query {
  agents {
    id
    name
    role
    status
  }
}

mutation {
  createTeam(input: {
    name: "New Team"
    topologyType: DAG
    agents: [...]
  })
}
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Subscribe to events
ws.send(
  JSON.stringify({
    type: 'subscribe',
    payload: { eventType: 'task:completed' },
  })
);

// Handle events
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Event:', message);
};
```

## Configuration

### Environment Variables

| Variable       | Description          | Default     |
| -------------- | -------------------- | ----------- |
| `PORT`         | Server port          | 3000        |
| `HOST`         | Server host          | 0.0.0.0     |
| `CORS_ORIGINS` | Allowed CORS origins | \*          |
| `NODE_ENV`     | Environment          | development |

### Orchestrator Configuration

```typescript
const orchestrator = new Orchestrator({
  max_concurrent_tasks: 10,
  default_timeout_ms: 60000,
  enable_memory_compression: true,
  max_context_tokens: 8000,
  governance_enforcement_enabled: true,
  hitl_default_timeout_seconds: 300,
});
```

## Integration Points

The AI Team Orchestrator is designed to integrate with other MyCodeXvantaOS modules:

1. **mycodexvantaos-ai-engine**: LLM inference and model routing
2. **mycodexvantaos-decision-engine**: Deterministic decision making
3. **mycodexvantaos-automation-workflows**: Task automation execution
4. **mycodexvantaos-governance-autonomy**: Policy enforcement and compliance

## Example: Creating a Development Team

```typescript
import { Orchestrator } from '@mycodexvantaos/ai-team-orchestrator';

async function main() {
  // Initialize orchestrator
  const orchestrator = new Orchestrator();
  await orchestrator.initialize();

  // Register agents
  orchestrator.registerAgent({
    id: 'urn:mycodexvantaos:agent:architect-01',
    name: 'Architect',
    role: 'architect',
    goal: 'Design system architecture',
    backstory: '...',
    allowed_tools: [],
    version: '1.0.0',
    status: 'active',
  });

  // Create team
  const teamId = orchestrator.createTeam({
    name: 'Development Team',
    topology_type: 'dag',
    agents: [{ agent_id: 'urn:mycodexvantaos:agent:architect-01', position: 0 }],
  });

  // Activate and start workflow
  orchestrator.activateTeam(teamId);
  const workflowId = orchestrator.startWorkflow(teamId);

  console.log('Workflow started:', workflowId);
}

main();
```

## Error Handling

The orchestrator implements comprehensive error handling:

- **Validation errors**: Schema validation failures
- **Permission errors**: Governance tier violations
- **Timeout errors**: Workflow and message timeouts
- **Recovery mechanisms**: Automatic retry with backoff

## Testing

Run tests with:

```bash
npm test
npm run test:coverage
```

## License

MIT

---

**Version**: 1.0.0  
**Author**: MyCodeXvantaOS Team
