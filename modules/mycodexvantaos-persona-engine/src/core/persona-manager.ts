/**
 * MyCodeXvantaOS Persona Engine - Persona Manager
 *
 * Manages multiple persona profiles and provides factory methods.
 * URN: urn:mycodexvantaos:core:persona-manager
 */

import type {
  PersonaProfile,
  PersonaArchetype,
  BehavioralParameters,
  EthicalBoundaries,
  InteractionPatterns,
  ResponseProtocols,
  SemanticMask,
} from '../types';

import { PersonaEngine, PersonaEngineConfig } from './persona-engine';

/**
 * Persona registry entry
 */
interface PersonaRegistryEntry {
  profile: PersonaProfile;
  engine?: PersonaEngine;
  lastUsed?: string;
  useCount: number;
}

/**
 * Persona Manager configuration
 */
export interface PersonaManagerConfig {
  defaultPersonaUrn?: string;
  autoInitializeEngines?: boolean;
  customMasks?: SemanticMask[];
  maxCachedEngines?: number;
  urn?: string;
  configPath?: string;
  autoLoad?: boolean;
  enableCache?: boolean;
  cacheTTL?: number;
}

/**
 * Default behavioral parameters by archetype
 */
const DEFAULT_BEHAVIORAL_PARAMETERS: Record<PersonaArchetype, BehavioralParameters> = {
  disrupter: {
    intellectual_provocation: 0.75,
    critical_intensity: 0.75,
    constructive_orientation: 0.6,
    empathy_level: 0.45,
    analytical_depth: 0.7,
    solution_focus: 0.55,
    communication_clarity: 0.8,
    adaptability: 0.65,
    truth_commitment: 0.9,
    practical_wisdom: 0.65,
  },
  analyst: {
    intellectual_provocation: 0.45,
    critical_intensity: 0.6,
    constructive_orientation: 0.65,
    empathy_level: 0.55,
    analytical_depth: 0.9,
    solution_focus: 0.7,
    communication_clarity: 0.85,
    adaptability: 0.6,
    truth_commitment: 0.8,
    practical_wisdom: 0.75,
  },
  mediator: {
    intellectual_provocation: 0.3,
    critical_intensity: 0.35,
    constructive_orientation: 0.8,
    empathy_level: 0.85,
    analytical_depth: 0.65,
    solution_focus: 0.75,
    communication_clarity: 0.8,
    adaptability: 0.8,
    truth_commitment: 0.65,
    practical_wisdom: 0.7,
  },
  architect: {
    intellectual_provocation: 0.4,
    critical_intensity: 0.45,
    constructive_orientation: 0.8,
    empathy_level: 0.5,
    analytical_depth: 0.85,
    solution_focus: 0.85,
    communication_clarity: 0.9,
    adaptability: 0.65,
    truth_commitment: 0.75,
    practical_wisdom: 0.8,
  },
  critic: {
    intellectual_provocation: 0.6,
    critical_intensity: 0.85,
    constructive_orientation: 0.5,
    empathy_level: 0.4,
    analytical_depth: 0.8,
    solution_focus: 0.45,
    communication_clarity: 0.85,
    adaptability: 0.5,
    truth_commitment: 0.9,
    practical_wisdom: 0.55,
  },
  creative_thinker: {
    intellectual_provocation: 0.65,
    critical_intensity: 0.4,
    constructive_orientation: 0.8,
    empathy_level: 0.65,
    analytical_depth: 0.55,
    solution_focus: 0.8,
    communication_clarity: 0.7,
    adaptability: 0.9,
    truth_commitment: 0.6,
    practical_wisdom: 0.7,
  },
  facilitator: {
    intellectual_provocation: 0.25,
    critical_intensity: 0.3,
    constructive_orientation: 0.85,
    empathy_level: 0.8,
    analytical_depth: 0.55,
    solution_focus: 0.8,
    communication_clarity: 0.85,
    adaptability: 0.85,
    truth_commitment: 0.55,
    practical_wisdom: 0.75,
  },
  mentor: {
    intellectual_provocation: 0.35,
    critical_intensity: 0.4,
    constructive_orientation: 0.85,
    empathy_level: 0.85,
    analytical_depth: 0.7,
    solution_focus: 0.85,
    communication_clarity: 0.8,
    adaptability: 0.75,
    truth_commitment: 0.7,
    practical_wisdom: 0.9,
  },
  synthesizer: {
    intellectual_provocation: 0.45,
    critical_intensity: 0.5,
    constructive_orientation: 0.8,
    empathy_level: 0.65,
    analytical_depth: 0.8,
    solution_focus: 0.85,
    communication_clarity: 0.85,
    adaptability: 0.75,
    truth_commitment: 0.75,
    practical_wisdom: 0.8,
  },
};

/**
 * Default ethical boundaries by archetype
 */
const DEFAULT_ETHICAL_BOUNDARIES: Record<PersonaArchetype, EthicalBoundaries> = {
  disrupter: {
    avoid_sarcasm: false,
    no_shaming: true,
    respect_autonomy: true,
    support_without_dependency: true,
    truth_with_constructive_intent: true,
  },
  analyst: {
    avoid_sarcasm: true,
    no_shaming: true,
    respect_autonomy: true,
    support_without_dependency: true,
    truth_with_constructive_intent: true,
  },
  mediator: {
    avoid_sarcasm: true,
    no_shaming: true,
    respect_autonomy: true,
    support_without_dependency: true,
    truth_with_constructive_intent: true,
  },
  architect: {
    avoid_sarcasm: true,
    no_shaming: true,
    respect_autonomy: true,
    support_without_dependency: true,
    truth_with_constructive_intent: true,
  },
  critic: {
    avoid_sarcasm: false,
    no_shaming: true,
    respect_autonomy: true,
    support_without_dependency: true,
    truth_with_constructive_intent: true,
  },
  creative_thinker: {
    avoid_sarcasm: true,
    no_shaming: true,
    respect_autonomy: true,
    support_without_dependency: true,
    truth_with_constructive_intent: true,
  },
  facilitator: {
    avoid_sarcasm: true,
    no_shaming: true,
    respect_autonomy: true,
    support_without_dependency: true,
    truth_with_constructive_intent: true,
  },
  mentor: {
    avoid_sarcasm: true,
    no_shaming: true,
    respect_autonomy: true,
    support_without_dependency: true,
    truth_with_constructive_intent: true,
  },
  synthesizer: {
    avoid_sarcasm: true,
    no_shaming: true,
    respect_autonomy: true,
    support_without_dependency: true,
    truth_with_constructive_intent: true,
  },
};

/**
 * Default interaction patterns by archetype
 */
const DEFAULT_INTERACTION_PATTERNS: Record<PersonaArchetype, InteractionPatterns> = {
  disrupter: {
    response_style: 'provocative',
    engagement_level: 'proactive',
    feedback_approach: 'critical',
  },
  analyst: {
    response_style: 'analytical',
    engagement_level: 'reactive',
    feedback_approach: 'balanced',
  },
  mediator: {
    response_style: 'diplomatic',
    engagement_level: 'reactive',
    feedback_approach: 'constructive',
  },
  architect: {
    response_style: 'analytical',
    engagement_level: 'proactive',
    feedback_approach: 'constructive',
  },
  critic: {
    response_style: 'direct',
    engagement_level: 'proactive',
    feedback_approach: 'critical',
  },
  creative_thinker: {
    response_style: 'provocative',
    engagement_level: 'proactive',
    feedback_approach: 'encouraging',
  },
  facilitator: {
    response_style: 'supportive',
    engagement_level: 'reactive',
    feedback_approach: 'encouraging',
  },
  mentor: {
    response_style: 'supportive',
    engagement_level: 'proactive',
    feedback_approach: 'constructive',
  },
  synthesizer: {
    response_style: 'analytical',
    engagement_level: 'proactive',
    feedback_approach: 'balanced',
  },
};

/**
 * Default response protocols by archetype
 */
const DEFAULT_RESPONSE_PROTOCOLS: Record<PersonaArchetype, ResponseProtocols> = {
  disrupter: {
    critique_to_solution_ratio: '2:1',
    minimum_solution_depth: 2,
    action_steps_required: true,
  },
  analyst: {
    critique_to_solution_ratio: '1:1',
    minimum_solution_depth: 3,
    action_steps_required: true,
  },
  mediator: {
    critique_to_solution_ratio: '1:2',
    minimum_solution_depth: 3,
    action_steps_required: true,
  },
  architect: {
    critique_to_solution_ratio: '1:2',
    minimum_solution_depth: 4,
    action_steps_required: true,
  },
  critic: {
    critique_to_solution_ratio: '3:1',
    minimum_solution_depth: 2,
    action_steps_required: false,
  },
  creative_thinker: {
    critique_to_solution_ratio: '1:3',
    minimum_solution_depth: 3,
    action_steps_required: true,
  },
  facilitator: {
    critique_to_solution_ratio: '1:3',
    minimum_solution_depth: 3,
    action_steps_required: true,
  },
  mentor: {
    critique_to_solution_ratio: '1:2',
    minimum_solution_depth: 4,
    action_steps_required: true,
  },
  synthesizer: {
    critique_to_solution_ratio: '1:2',
    minimum_solution_depth: 4,
    action_steps_required: true,
  },
};

/**
 * PersonaManager class
 * Central management for all persona profiles and engines
 */
export class PersonaManager {
  private registry: Map<string, PersonaRegistryEntry>;
  private config: PersonaManagerConfig;
  private customMasks: SemanticMask[];

  constructor(config: PersonaManagerConfig = {}) {
    this.registry = new Map();
    this.config = {
      autoInitializeEngines: config.autoInitializeEngines ?? true,
      maxCachedEngines: config.maxCachedEngines ?? 10,
      ...config,
    };
    this.customMasks = config.customMasks || [];
  }

  /**
   * Register a persona profile
   */
  registerPersona(profile: PersonaProfile): void {
    const urn = profile.urn;

    if (this.registry.has(urn)) {
      throw new Error(`Persona with URN ${urn} already registered`);
    }

    const entry: PersonaRegistryEntry = {
      profile,
      useCount: 0,
    };

    // Auto-initialize engine if configured
    if (this.config.autoInitializeEngines) {
      entry.engine = this.createEngine(profile);
    }

    this.registry.set(urn, entry);
  }

  /**
   * Unregister a persona
   */
  unregisterPersona(urn: string): boolean {
    return this.registry.delete(urn);
  }

  /**
   * Get a persona profile by URN
   */
  getPersona(urn: string): PersonaProfile | undefined {
    return this.registry.get(urn)?.profile;
  }

  /**
   * Get all registered personas
   */
  getAllPersonas(): PersonaProfile[] {
    return Array.from(this.registry.values()).map((e) => e.profile);
  }

  /**
   * Get personas by archetype
   */
  /**
   * Get persona profile by URN (alias for getPersona)
   */
  getPersonaProfile(urn: string): PersonaProfile | undefined {
    return this.getPersona(urn);
  }

  /**
   * Get all available archetypes
   */
  getAvailableArchetypes(): PersonaArchetype[] {
    return [
      'disrupter',
      'analyst',
      'mediator',
      'architect',
      'critic',
      'creative_thinker',
      'facilitator',
      'mentor',
      'synthesizer',
    ];
  }

  getPersonasByArchetype(archetype: PersonaArchetype): PersonaProfile[] {
    return this.getAllPersonas().filter((p) => p.archetype === archetype);
  }

  /**
   * Get or create a persona engine
   */
  getEngine(urn: string): PersonaEngine | undefined {
    const entry = this.registry.get(urn);
    if (!entry) return undefined;

    if (!entry.engine) {
      entry.engine = this.createEngine(entry.profile);
    }

    entry.lastUsed = new Date().toISOString();
    entry.useCount++;

    // Clean up old engines if over limit
    this.cleanupOldEngines();

    return entry.engine;
  }

  /**
   * Create a persona engine for a profile
   */
  private createEngine(profile: PersonaProfile): PersonaEngine {
    const config: PersonaEngineConfig = {
      persona: profile,
      customMasks: this.customMasks,
    };
    return new PersonaEngine(config);
  }

  /**
   * Clean up old engines to stay under cache limit
   */
  private cleanupOldEngines(): void {
    if (this.registry.size <= (this.config.maxCachedEngines || 10)) return;

    // Find least recently used entries with engines
    const entries = Array.from(this.registry.entries())
      .filter(([, e]) => e.engine !== undefined)
      .sort((a, b) => {
        const aTime = a[1].lastUsed ? new Date(a[1].lastUsed).getTime() : 0;
        const bTime = b[1].lastUsed ? new Date(b[1].lastUsed).getTime() : 0;
        return aTime - bTime;
      });

    // Remove engines from oldest entries
    const toRemove = entries.slice(0, entries.length - (this.config.maxCachedEngines || 10));
    for (const [urn] of toRemove) {
      const entry = this.registry.get(urn);
      if (entry) {
        entry.engine = undefined;
      }
    }
  }

  /**
   * Create a persona profile with defaults
   */
  createPersonaProfile(options: {
    urn: string;
    name: string;
    archetype: PersonaArchetype;
    description?: string;
    version?: string;
    behavioralParameters?: Partial<BehavioralParameters>;
    ethicalBoundaries?: Partial<EthicalBoundaries>;
    interactionPatterns?: Partial<InteractionPatterns>;
    responseProtocols?: Partial<ResponseProtocols>;
    governanceTier?: number;
  }): PersonaProfile {
    const defaultBehavioral = DEFAULT_BEHAVIORAL_PARAMETERS[options.archetype];
    const defaultEthical = DEFAULT_ETHICAL_BOUNDARIES[options.archetype];
    const defaultInteraction = DEFAULT_INTERACTION_PATTERNS[options.archetype];
    const defaultProtocols = DEFAULT_RESPONSE_PROTOCOLS[options.archetype];

    const profile: PersonaProfile = {
      urn: options.urn,
      name: options.name,
      version: options.version || '1.0.0',
      description: options.description,
      archetype: options.archetype,
      behavioral_parameters: {
        ...defaultBehavioral,
        ...options.behavioralParameters,
      },
      ethical_boundaries: {
        ...defaultEthical,
        ...options.ethicalBoundaries,
      },
      interaction_patterns: {
        ...defaultInteraction,
        ...options.interactionPatterns,
      },
      response_protocols: {
        ...defaultProtocols,
        ...options.responseProtocols,
      },
      governance_tier: options.governanceTier ?? 0,
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    return profile;
  }

  /**
   * Create and register a persona in one step
   */
  createAndRegisterPersona(options: {
    urn: string;
    name: string;
    archetype: PersonaArchetype;
    description?: string;
    version?: string;
    behavioralParameters?: Partial<BehavioralParameters>;
    ethicalBoundaries?: Partial<EthicalBoundaries>;
    interactionPatterns?: Partial<InteractionPatterns>;
    responseProtocols?: Partial<ResponseProtocols>;
    governanceTier?: number;
  }): PersonaProfile {
    const profile = this.createPersonaProfile(options);
    this.registerPersona(profile);
    return profile;
  }

  /**
   * Update a persona profile
   */
  updatePersona(urn: string, updates: Partial<PersonaProfile>): PersonaProfile | undefined {
    const entry = this.registry.get(urn);
    if (!entry) return undefined;

    // Apply updates
    entry.profile = {
      ...entry.profile,
      ...updates,
      metadata: {
        ...entry.profile.metadata,
        updated_at: new Date().toISOString(),
      },
    };

    // Recreate engine with updated profile
    if (entry.engine) {
      entry.engine = this.createEngine(entry.profile);
    }

    return entry.profile;
  }

  /**
   * Process input with a specific persona
   */
  processWithPersona(
    urn: string,
    input: string,
    sessionId?: string
  ): {
    success: boolean;
    result?: ReturnType<PersonaEngine['process']>;
    error?: string;
  } {
    const engine = this.getEngine(urn);
    if (!engine) {
      return { success: false, error: `Persona ${urn} not found` };
    }

    try {
      const result = engine.process(input, sessionId);
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalPersonas: number;
    activeEngines: number;
    byArchetype: Record<PersonaArchetype, number>;
    mostUsed: string[];
  } {
    const byArchetype: Record<PersonaArchetype, number> = {
      disrupter: 0,
      analyst: 0,
      mediator: 0,
      architect: 0,
      critic: 0,
      creative_thinker: 0,
      facilitator: 0,
      mentor: 0,
      synthesizer: 0,
    };

    let activeEngines = 0;
    const usageData: Array<{ urn: string; useCount: number }> = [];

    for (const [urn, entry] of this.registry) {
      byArchetype[entry.profile.archetype]++;
      if (entry.engine) activeEngines++;
      usageData.push({ urn, useCount: entry.useCount });
    }

    const mostUsed = usageData
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 5)
      .map((d) => d.urn);

    return {
      totalPersonas: this.registry.size,
      activeEngines,
      byArchetype,
      mostUsed,
    };
  }

  /**
   * Export all persona profiles
   */
  exportProfiles(): string {
    const profiles = this.getAllPersonas();
    return JSON.stringify(profiles, null, 2);
  }

  /**
   * Import persona profiles
   */
  importProfiles(json: string): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const profiles: PersonaProfile[] = JSON.parse(json);

      for (const profile of profiles) {
        try {
          this.registerPersona(profile);
          imported++;
        } catch (error) {
          errors.push(`Failed to import ${profile.urn}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to parse JSON: ${error}`);
    }

    return { imported, errors };
  }

  /**
   * Load personas from configuration files
   */
  async loadFromDirectory(directory: string): Promise<{ loaded: number; errors: string[] }> {
    // This would load YAML/JSON files from a directory
    // Implementation would depend on file system access
    const errors: string[] = [];
    let loaded = 0;

    // Placeholder for file loading logic
    // In production, this would use fs or similar to load persona configs

    return { loaded, errors };
  }
}

// Create singleton instance
let defaultManager: PersonaManager | null = null;

/**
 * Get the default persona manager instance
 */
export function getDefaultPersonaManager(): PersonaManager {
  if (!defaultManager) {
    defaultManager = new PersonaManager();
  }
  return defaultManager;
}

/**
 * Reset the default persona manager
 */
export function resetDefaultPersonaManager(): void {
  defaultManager = null;
}

export default PersonaManager;
