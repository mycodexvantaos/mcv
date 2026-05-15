/**
 * AI Team Orchestrator Integration Example
 *
 * Demonstrates how to integrate the Persona Engine with the
 * MyCodeXvantaOS AI Team Orchestrator for seamless multi-agent collaboration.
 *
 * @module mycodexvantaos-persona-engine/integration/orchestrator-integration
 */

import {
  PersonaManager,
  PersonaManagerConfig,
  OrchestratorAdapter,
  OrchestratorAdapterConfig,
  PersonaProfile,
  PersonaArchetype,
  BehavioralAdjuster,
  PersonaCacheManager,
  PersonaValidator,
} from '../index';

// ============================================
// Types for Integration
// ============================================

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  /** Persona Manager configuration */
  personaManager: PersonaManagerConfig;
  /** Orchestrator Adapter configuration */
  orchestratorAdapter: OrchestratorAdapterConfig;
  /** Enable caching */
  enableCache: boolean;
  /** Cache configuration */
  cacheConfig?: {
    maxEntries: number;
    defaultTTL: number;
  };
  /** Enable validation */
  enableValidation: boolean;
  /** Enable behavioral adjustment */
  enableBehavioralAdjustment: boolean;
}

/**
 * Agent registration from Orchestrator
 */
export interface AgentRegistration {
  /** Agent URN */
  urn: string;
  /** Agent name */
  name: string;
  /** Agent capabilities */
  capabilities: string[];
  /** Associated persona archetype */
  personaArchetype?: PersonaArchetype;
}

/**
 * Task from Orchestrator
 */
export interface OrchestratorTask {
  /** Task ID */
  taskId: string;
  /** Task type */
  type: 'analysis' | 'generation' | 'review' | 'consultation' | 'debate';
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Input content */
  input: string;
  /** Required capabilities */
  requiredCapabilities?: string[];
  /** Preferred persona archetype */
  preferredArchetype?: PersonaArchetype;
  /** Context metadata */
  metadata: {
    sourceAgentUrn: string;
    sessionId?: string;
    userId?: string;
    timestamp: string;
  };
}

/**
 * Task result
 */
export interface TaskResult {
  /** Task ID */
  taskId: string;
  /** Success status */
  success: boolean;
  /** Result content */
  content: string;
  /** Persona used */
  personaArchetype: PersonaArchetype;
  /** Processing time in ms */
  processingTime: number;
  /** Quality metrics */
  qualityMetrics?: {
    confidence: number;
    completeness: number;
    relevance: number;
  };
  /** Additional insights */
  insights?: {
    semanticMasks?: string[];
    rootCauses?: string[];
    suggestions?: string[];
  };
}

// ============================================
// Integration Manager
// ============================================

/**
 * PersonaOrchestratorIntegration provides a complete integration layer
 * between the Persona Engine and AI Team Orchestrator
 *
 * @example
 * ```typescript
 * const integration = new PersonaOrchestratorIntegration(config);
 * await integration.initialize();
 *
 * const result = await integration.processTask({
 *   taskId: 'task-001',
 *   type: 'consultation',
 *   priority: 'high',
 *   input: 'I need help analyzing this problem...',
 *   metadata: { sourceAgentUrn: '...', timestamp: new Date().toISOString() }
 * });
 * ```
 */
export class PersonaOrchestratorIntegration {
  private config: IntegrationConfig;
  private personaManager: PersonaManager;
  private orchestratorAdapter: OrchestratorAdapter;
  private cache?: PersonaCacheManager;
  private validator?: PersonaValidator;
  private behavioralAdjuster?: BehavioralAdjuster;
  private registeredAgents: Map<string, AgentRegistration> = new Map();
  private initialized: boolean = false;

  constructor(config: IntegrationConfig) {
    this.config = config;
    this.personaManager = new PersonaManager(config.personaManager);
    this.orchestratorAdapter = new OrchestratorAdapter(
      config.orchestratorAdapter,
      this.personaManager
    );

    if (config.enableCache) {
      this.cache = new PersonaCacheManager(config.cacheConfig);
    }

    if (config.enableValidation) {
      this.validator = new PersonaValidator();
    }

    if (config.enableBehavioralAdjustment) {
      this.behavioralAdjuster = new BehavioralAdjuster();
    }
  }

  /**
   * Initializes the integration
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Register event listeners
    this.setupEventListeners();

    // Load default personas
    await this.loadDefaultPersonas();

    this.initialized = true;
  }

  /**
   * Sets up event listeners for the adapter
   */
  private setupEventListeners(): void {
    this.orchestratorAdapter.addEventListener((event) => {
      switch (event.type) {
        case 'session_created':
          console.log(`[Integration] Session created: ${event.data.sessionId}`);
          break;
        case 'session_closed':
          console.log(`[Integration] Session closed: ${event.data.sessionId}`);
          break;
        case 'mask_detected':
          console.log(`[Integration] Semantic masks detected: ${event.data.masks}`);
          break;
        case 'hitl_triggered':
          console.log(`[Integration] HITL checkpoint triggered: ${event.data.triggers}`);
          break;
        case 'error':
          console.error(`[Integration] Error: ${event.data.error}`);
          break;
      }
    });
  }

  /**
   * Loads default persona configurations
   */
  private async loadDefaultPersonas(): Promise<void> {
    const defaultArchetypes: PersonaArchetype[] = [
      'disrupter',
      'analyst',
      'critic',
      'architect',
      'mediator',
      'creative_thinker',
    ];

    for (const archetype of defaultArchetypes) {
      // Check if already loaded
      if (this.personaManager.getPersonaProfile(archetype)) {
        continue;
      }

      // Create default profile
      const profile = this.createDefaultProfile(archetype);

      // Validate if enabled
      if (this.validator && !this.validator.isValid(profile)) {
        console.warn(`[Integration] Default profile for ${archetype} failed validation`);
        continue;
      }

      this.personaManager.registerPersona(profile);
    }
  }

  /**
   * Creates a default persona profile for an archetype
   */
  private createDefaultProfile(archetype: PersonaArchetype): PersonaProfile {
    const behavioralPresets = this.behavioralAdjuster?.getArchetypePreset(archetype) ?? {
      critical_tolerance: 0.5,
      empathy_level: 0.5,
      directness: 0.5,
      solution_focus: 0.5,
      abstraction_preference: 0.5,
      questioning_depth: 0.5,
      contradiction_frequency: 0.3,
    };

    return {
      urn: `urn:mycodexvantaos:persona:${archetype.replace(/_/g, '-')}-primary`,
      name: `${archetype.charAt(0).toUpperCase() + archetype.slice(1).replace('_', ' ')} Primary`,
      archetype,
      version: '1.0.0',
      description: `Default ${archetype} persona configuration`,
      behavioral_parameters: {
        critical_tolerance: behavioralPresets.critical_tolerance ?? 0.5,
        empathy_level: behavioralPresets.empathy_level ?? 0.5,
        directness: behavioralPresets.directness ?? 0.5,
        solution_focus: behavioralPresets.solution_focus ?? 0.5,
        abstraction_preference: behavioralPresets.abstraction_preference ?? 0.5,
        questioning_depth: behavioralPresets.questioning_depth ?? 0.5,
        contradiction_frequency: behavioralPresets.contradiction_frequency ?? 0.3,
      },
      response_patterns: {
        opening_style: 'direct',
        analytical_framework: 'first_principles',
        conclusion_style: 'action_oriented',
      },
      governance: {
        tier: 1,
        hitl_checkpoint: true,
        audit_required: false,
        constraints: {},
      },
    };
  }

  /**
   * Registers an agent with the integration
   */
  registerAgent(agent: AgentRegistration): void {
    this.registeredAgents.set(agent.urn, agent);

    // If agent has a preferred persona, ensure it's loaded
    if (agent.personaArchetype && !this.personaManager.getPersonaProfile(agent.personaArchetype)) {
      const profile = this.createDefaultProfile(agent.personaArchetype);
      this.personaManager.registerPersona(profile);
    }
  }

  /**
   * Unregisters an agent
   */
  unregisterAgent(agentUrn: string): boolean {
    return this.registeredAgents.delete(agentUrn);
  }

  /**
   * Processes a task from the Orchestrator
   */
  async processTask(task: OrchestratorTask): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      if (this.cache) {
        const cached = this.cache.getResponse<TaskResult>(
          task.metadata.sessionId ?? 'default',
          task.taskId
        );
        if (cached) {
          return cached;
        }
      }

      // Determine which persona to use
      const archetype = this.selectPersonaForTask(task);

      // Process through adapter
      const response = await this.orchestratorAdapter.processRequest({
        requestId: task.taskId,
        sourceAgentUrn: task.metadata.sourceAgentUrn,
        targetPersonaArchetype: archetype,
        input: task.input,
        context: {
          sessionId: task.metadata.sessionId,
          userId: task.metadata.userId,
          timestamp: task.metadata.timestamp,
        },
      });

      // Build result
      const result: TaskResult = {
        taskId: task.taskId,
        success: response.success,
        content: response.response.content,
        personaArchetype: response.personaArchetype,
        processingTime: Date.now() - startTime,
        qualityMetrics: {
          confidence: response.response.rootCauseDiagnosis?.confidence ?? 0.5,
          completeness: 0.8,
          relevance: 0.9,
        },
        insights: {
          semanticMasks: response.response.semanticMasks?.map((m) => m.type),
          rootCauses: response.response.rootCauseDiagnosis
            ? [response.response.rootCauseDiagnosis.primaryRootCause]
            : undefined,
          suggestions: response.response.solutions?.map((s) => s.description),
        },
      };

      // Cache the result
      if (this.cache) {
        this.cache.setResponse(
          task.metadata.sessionId ?? 'default',
          task.taskId,
          result,
          300000 // 5 minutes TTL
        );
      }

      return result;
    } catch (error) {
      return {
        taskId: task.taskId,
        success: false,
        content: error instanceof Error ? error.message : 'Unknown error',
        personaArchetype: task.preferredArchetype ?? 'disrupter',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Selects the best persona for a task
   */
  private selectPersonaForTask(task: OrchestratorTask): PersonaArchetype {
    // Use preferred archetype if specified
    if (task.preferredArchetype) {
      return task.preferredArchetype;
    }

    // Select based on task type
    switch (task.type) {
      case 'analysis':
        return 'analyst';
      case 'generation':
        return 'architect';
      case 'review':
        return 'critic';
      case 'consultation':
        return 'mediator';
      case 'debate':
        return 'disrupter';
      default:
        return 'disrupter';
    }
  }

  /**
   * Gets available personas
   */
  getAvailablePersonas(): PersonaArchetype[] {
    return this.personaManager.getAvailableArchetypes();
  }

  /**
   * Gets registered agents
   */
  getRegisteredAgents(): AgentRegistration[] {
    return Array.from(this.registeredAgents.values());
  }

  /**
   * Gets integration health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, unknown>;
  } {
    const adapterHealth = this.orchestratorAdapter.healthCheck();
    const cacheStats = this.cache?.getStatistics();

    return {
      status: adapterHealth.status,
      details: {
        ...adapterHealth.details,
        cacheEnabled: !!this.cache,
        cacheStats: cacheStats
          ? {
              entries: cacheStats.totalEntries,
              hitRatio: cacheStats.hitRatio,
            }
          : null,
        registeredAgents: this.registeredAgents.size,
        availablePersonas: this.personaManager.getAvailableArchetypes().length,
      },
    };
  }

  /**
   * Shuts down the integration
   */
  shutdown(): void {
    this.cache?.destroy();
    this.initialized = false;
  }
}

// ============================================
// Factory Function
// ============================================

/**
 * Creates a configured integration instance
 */
export function createIntegration(
  config?: Partial<IntegrationConfig>
): PersonaOrchestratorIntegration {
  const defaultConfig: IntegrationConfig = {
    personaManager: {
      urn: 'urn:mycodexvantaos:persona-manager:integration',
      configPath: './config/personas',
      autoLoad: false,
      enableCache: true,
      cacheTTL: 300000,
    },
    orchestratorAdapter: {
      urn: 'urn:mycodexvantaos:adapter:persona-orchestrator',
      orchestratorUrn: 'urn:mycodexvantaos:module:ai-team-orchestrator',
      defaultPersonaArchetype: 'disrupter',
      enableSemanticMaskDetection: true,
      enableRootCauseAnalysis: true,
      hitlThreshold: 0.8,
      governanceTier: 1,
      maxSessionDuration: 3600000,
    },
    enableCache: true,
    cacheConfig: {
      maxEntries: 1000,
      defaultTTL: 300000,
    },
    enableValidation: true,
    enableBehavioralAdjustment: true,
  };

  return new PersonaOrchestratorIntegration({
    ...defaultConfig,
    ...config,
    personaManager: { ...defaultConfig.personaManager, ...config?.personaManager },
    orchestratorAdapter: { ...defaultConfig.orchestratorAdapter, ...config?.orchestratorAdapter },
  });
}

export default PersonaOrchestratorIntegration;
