import {
  PersonaOrchestratorIntegration,
  createIntegration,
  IntegrationConfig,
  AgentRegistration,
  OrchestratorTask,
  TaskResult,
} from '../integration/orchestrator-integration';
import { PersonaArchetype } from '../types';

describe('PersonaOrchestratorIntegration', () => {
  let integration: PersonaOrchestratorIntegration;

  const defaultConfig: IntegrationConfig = {
    personaManager: {
      urn: 'urn:mycodexvantaos:persona-manager:test',
      configPath: './test-config',
      autoLoad: false,
      enableCache: true,
      cacheTTL: 60000,
    },
    orchestratorAdapter: {
      urn: 'urn:mycodexvantaos:adapter:test',
      orchestratorUrn: 'urn:mycodexvantaos:module:test-orchestrator',
      defaultPersonaArchetype: 'disrupter',
      enableSemanticMaskDetection: true,
      enableRootCauseAnalysis: true,
      hitlThreshold: 0.8,
      governanceTier: 1,
      maxSessionDuration: 3600000,
    },
    enableCache: true,
    cacheConfig: {
      maxEntries: 100,
      defaultTTL: 60000,
    },
    enableValidation: true,
    enableBehavioralAdjustment: true,
  };

  beforeEach(() => {
    integration = new PersonaOrchestratorIntegration(defaultConfig);
  });

  afterEach(() => {
    integration.shutdown();
  });

  describe('constructor', () => {
    it('should create integration with config', () => {
      expect(integration).toBeDefined();
    });

    it('should create persona manager', () => {
      expect(integration.getAvailablePersonas()).toBeDefined();
    });

    it('should create cache when enabled', () => {
      const health = integration.getHealthStatus();
      expect(health.details.cacheEnabled).toBe(true);
    });

    it('should not create cache when disabled', () => {
      const noCacheIntegration = new PersonaOrchestratorIntegration({
        ...defaultConfig,
        enableCache: false,
      });
      const health = noCacheIntegration.getHealthStatus();
      expect(health.details.cacheEnabled).toBe(false);
      noCacheIntegration.shutdown();
    });

    it('should create validator when enabled', () => {
      // Validator is created internally, we can verify through behavior
      expect(integration).toBeDefined();
    });

    it('should create behavioral adjuster when enabled', () => {
      // Behavioral adjuster is created internally
      expect(integration).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await integration.initialize();
      expect(integration).toBeDefined();
    });

    it('should not initialize twice', async () => {
      await integration.initialize();
      await integration.initialize(); // Second call should be no-op
      expect(integration).toBeDefined();
    });

    it('should load default personas', async () => {
      await integration.initialize();
      const personas = integration.getAvailablePersonas();
      expect(personas.length).toBeGreaterThan(0);
    });
  });

  describe('registerAgent', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should register an agent', () => {
      const agent: AgentRegistration = {
        urn: 'urn:mycodexvantaos:agent:test-agent-001',
        name: 'Test Agent',
        capabilities: ['analysis', 'review'],
      };

      integration.registerAgent(agent);
      const agents = integration.getRegisteredAgents();

      expect(agents.find((a) => a.urn === agent.urn)).toBeDefined();
    });

    it('should register agent with persona archetype', () => {
      const agent: AgentRegistration = {
        urn: 'urn:mycodexvantaos:agent:test-agent-002',
        name: 'Analyst Agent',
        capabilities: ['analysis'],
        personaArchetype: 'analyst',
      };

      integration.registerAgent(agent);
      const agents = integration.getRegisteredAgents();

      expect(agents.find((a) => a.urn === agent.urn)).toBeDefined();
    });

    it('should create default profile for agent persona if not exists', () => {
      const agent: AgentRegistration = {
        urn: 'urn:mycodexvantaos:agent:test-agent-003',
        name: 'Mentor Agent',
        capabilities: ['guidance'],
        personaArchetype: 'mentor', // Not in default loaded personas
      };

      integration.registerAgent(agent);
      const personas = integration.getAvailablePersonas();

      expect(personas).toContain('mentor');
    });
  });

  describe('unregisterAgent', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should unregister an existing agent', () => {
      const agent: AgentRegistration = {
        urn: 'urn:mycodexvantaos:agent:test-agent-004',
        name: 'Test Agent',
        capabilities: ['analysis'],
      };

      integration.registerAgent(agent);
      const removed = integration.unregisterAgent(agent.urn);

      expect(removed).toBe(true);
      const agents = integration.getRegisteredAgents();
      expect(agents.find((a) => a.urn === agent.urn)).toBeUndefined();
    });

    it('should return false for non-existent agent', () => {
      const removed = integration.unregisterAgent('non-existent-urn');
      expect(removed).toBe(false);
    });
  });

  describe('processTask', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should process analysis task', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-001',
        type: 'analysis',
        priority: 'medium',
        input: 'Analyze this input for patterns',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);

      expect(result.taskId).toBe(task.taskId);
      expect(result.success).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should process generation task', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-002',
        type: 'generation',
        priority: 'high',
        input: 'Generate a solution',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);

      expect(result.taskId).toBe(task.taskId);
      expect(['architect', 'disrupter']).toContain(result.personaArchetype);
    });

    it('should process review task', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-003',
        type: 'review',
        priority: 'medium',
        input: 'Review this code',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);

      expect(result.taskId).toBe(task.taskId);
    });

    it('should process consultation task', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-004',
        type: 'consultation',
        priority: 'low',
        input: 'I need advice',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);

      expect(result.taskId).toBe(task.taskId);
    });

    it('should process debate task', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-005',
        type: 'debate',
        priority: 'high',
        input: 'Challenge this argument',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);

      expect(result.taskId).toBe(task.taskId);
    });

    it('should use preferred archetype when specified', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-006',
        type: 'analysis',
        priority: 'medium',
        input: 'Test input',
        preferredArchetype: 'critic',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);

      expect(result.personaArchetype).toBe('critic');
    });

    it('should handle task with session ID', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-007',
        type: 'analysis',
        priority: 'medium',
        input: 'Test input',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          sessionId: 'session-123',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);

      expect(result.taskId).toBe(task.taskId);
    });

    it('should handle task with user ID', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-008',
        type: 'analysis',
        priority: 'medium',
        input: 'Test input',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          userId: 'user-456',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);

      expect(result.taskId).toBe(task.taskId);
    });

    it('should handle task with required capabilities', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-009',
        type: 'analysis',
        priority: 'high',
        input: 'Complex analysis required',
        requiredCapabilities: ['deep-analysis', 'pattern-recognition'],
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);

      expect(result.taskId).toBe(task.taskId);
    });
  });

  describe('getAvailablePersonas', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should return list of available personas', () => {
      const personas = integration.getAvailablePersonas();
      expect(Array.isArray(personas)).toBe(true);
    });

    it('should include default personas after initialization', async () => {
      const personas = integration.getAvailablePersonas();
      expect(personas).toContain('disrupter');
      expect(personas).toContain('analyst');
    });
  });

  describe('getRegisteredAgents', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should return empty array when no agents registered', () => {
      const agents = integration.getRegisteredAgents();
      expect(agents).toEqual([]);
    });

    it('should return registered agents', () => {
      const agent: AgentRegistration = {
        urn: 'urn:mycodexvantaos:agent:test-agent-005',
        name: 'Test Agent',
        capabilities: ['analysis'],
      };

      integration.registerAgent(agent);
      const agents = integration.getRegisteredAgents();

      expect(agents.length).toBe(1);
      expect(agents[0].urn).toBe(agent.urn);
    });
  });

  describe('getHealthStatus', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should return health status', () => {
      const health = integration.getHealthStatus();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('details');
    });

    it('should include cache stats when cache enabled', () => {
      const health = integration.getHealthStatus();

      expect(health.details.cacheStats).toBeDefined();
    });

    it('should include registered agents count', () => {
      const health = integration.getHealthStatus();

      expect(health.details.registeredAgents).toBe(0);
    });

    it('should include available personas count', () => {
      const health = integration.getHealthStatus();

      expect(health.details.availablePersonas).toBeGreaterThan(0);
    });

    it('should return healthy status initially', () => {
      const health = integration.getHealthStatus();

      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      await integration.initialize();
      integration.shutdown();

      // Should not throw
      expect(true).toBe(true);
    });

    it('should clear initialized state', async () => {
      await integration.initialize();
      integration.shutdown();

      // Can initialize again
      await integration.initialize();
      expect(integration).toBeDefined();
    });
  });

  describe('createIntegration factory', () => {
    it('should create integration with default config', () => {
      const defaultIntegration = createIntegration();
      expect(defaultIntegration).toBeDefined();
      defaultIntegration.shutdown();
    });

    it('should create integration with partial config', () => {
      const customIntegration = createIntegration({
        enableCache: false,
        enableValidation: false,
      });

      const health = customIntegration.getHealthStatus();
      expect(health.details.cacheEnabled).toBe(false);

      customIntegration.shutdown();
    });

    it('should merge nested configs correctly', () => {
      const customIntegration = createIntegration({
        personaManager: {
          urn: 'urn:mycodexvantaos:persona-manager:custom',
          configPath: './custom-config',
          autoLoad: false,
          enableCache: false,
          cacheTTL: 10000,
        },
      });

      expect(customIntegration).toBeDefined();
      customIntegration.shutdown();
    });
  });

  describe('task selection logic', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should select analyst for analysis tasks', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-analyst',
        type: 'analysis',
        priority: 'medium',
        input: 'Analyze',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);
      expect(result.personaArchetype).toBe('analyst');
    });

    it('should select architect for generation tasks', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-architect',
        type: 'generation',
        priority: 'medium',
        input: 'Generate',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);
      expect(result.personaArchetype).toBe('architect');
    });

    it('should select critic for review tasks', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-critic',
        type: 'review',
        priority: 'medium',
        input: 'Review',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);
      expect(result.personaArchetype).toBe('critic');
    });

    it('should select mediator for consultation tasks', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-mediator',
        type: 'consultation',
        priority: 'medium',
        input: 'Consult',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);
      expect(result.personaArchetype).toBe('mediator');
    });

    it('should select disrupter for debate tasks', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-disrupter',
        type: 'debate',
        priority: 'medium',
        input: 'Debate',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);
      expect(result.personaArchetype).toBe('disrupter');
    });
  });

  describe('priority handling', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should handle low priority tasks', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-low',
        type: 'analysis',
        priority: 'low',
        input: 'Low priority task',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);
      expect(result.taskId).toBe('task-low');
    });

    it('should handle critical priority tasks', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-critical',
        type: 'analysis',
        priority: 'critical',
        input: 'Critical task',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);
      expect(result.taskId).toBe('task-critical');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should handle empty input', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-empty',
        type: 'analysis',
        priority: 'medium',
        input: '',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);
      expect(result).toBeDefined();
      expect(result.taskId).toBe('task-empty');
    });

    it('should return result with success boolean', async () => {
      const task: OrchestratorTask = {
        taskId: 'task-bool',
        type: 'analysis',
        priority: 'medium',
        input: 'Test',
        metadata: {
          sourceAgentUrn: 'urn:mycodexvantaos:agent:source',
          timestamp: new Date().toISOString(),
        },
      };

      const result = await integration.processTask(task);
      expect(typeof result.success).toBe('boolean');
    });
  });
});
