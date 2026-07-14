/**
 * Orchestrator Adapter for MyCodexVantaOS Persona Engine
 *
 * This module provides integration between the Persona Engine and the
 * AI Team Orchestrator, enabling persona-aware agent interactions.
 *
 * @module mycodexvantaos-persona-engine/core/orchestrator-adapter
 */

import { PersonaManager } from './persona-manager';
import { PersonaEngine } from './persona-engine';
import {
  PersonaProfile,
  PersonaSession,
  RootCauseDiagnosis,
  SolutionProposal,
  SemanticMask,
  PersonaArchetype,
} from '../types';

/**
 * Configuration for the Orchestrator Adapter
 */
export interface OrchestratorAdapterConfig {
  /** URN of the adapter */
  urn: string;
  /** Reference to the orchestrator URN */
  orchestratorUrn: string;
  /** Default persona to use when none specified */
  defaultPersonaArchetype: PersonaArchetype;
  /** Enable semantic mask detection in all interactions */
  enableSemanticMaskDetection: boolean;
  /** Enable root cause analysis for complex queries */
  enableRootCauseAnalysis: boolean;
  /** HITL checkpoint threshold (0-1) for triggering human review */
  hitlThreshold: number;
  /** Governance tier for operations (-1 to 3) */
  governanceTier: number;
  /** Maximum session duration in milliseconds */
  maxSessionDuration: number;
}

/**
 * Request from the Orchestrator to the Persona Engine
 */
export interface OrchestratorRequest {
  /** Unique request identifier */
  requestId: string;
  /** Source agent URN */
  sourceAgentUrn: string;
  /** Target persona archetype (optional, uses default if not specified) */
  targetPersonaArchetype?: PersonaArchetype;
  /** The input text or query to process */
  input: string;
  /** Context metadata */
  context: {
    /** Conversation or session ID */
    sessionId?: string;
    /** User ID making the request */
    userId?: string;
    /** Priority level (1-10) */
    priority?: number;
    /** Request timestamp */
    timestamp: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
  };
  /** Requested analysis types */
  analysisTypes?: Array<'semantic_mask' | 'root_cause' | 'solution' | 'behavioral'>;
}

/**
 * Response from the Persona Engine to the Orchestrator
 */
export interface OrchestratorResponse {
  /** Unique response identifier */
  responseId: string;
  /** Corresponding request ID */
  requestId: string;
  /** Persona URN that processed the request */
  personaUrn: string;
  /** Persona archetype used */
  personaArchetype: PersonaArchetype;
  /** Processing timestamp */
  timestamp: string;
  /** Whether processing was successful */
  success: boolean;
  /** The generated response */
  response: {
    /** Main response content */
    content: string;
    /** Critical track output (problem identification) */
    criticalTrack?: string;
    /** Constructive track output (solution proposal) */
    constructiveTrack?: string;
    /** Detected semantic masks (if any) */
    semanticMasks?: Array<{
      type: string;
      detected: boolean;
      confidence: number;
      truth_reframe: string;
    }>;
    /** Root cause diagnosis (if requested) */
    rootCauseDiagnosis?: {
      layer: string;
      findings: string[];
      confidence: number;
      primaryRootCause: string;
    };
    /** Solution proposals (if requested) */
    solutions?: Array<{
      category: string;
      description: string;
      title?: string;
      expected_outcome?: string;
    }>;
  };
  /** Behavioral parameters applied */
  appliedBehavioralParams: {
    criticalTolerance: number;
    empathyLevel: number;
    directness: number;
    solutionFocus: number;
  };
  /** HITL checkpoint triggers (if any) */
  hitlTriggers?: Array<{
    type: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  /** Governance information */
  governance: {
    tier: number;
    constraints: string[];
    auditTrail: string[];
  };
}

/**
 * Event emitted by the Orchestrator Adapter
 */
export interface AdapterEvent {
  /** Event type */
  type:
    | 'session_created'
    | 'session_closed'
    | 'mask_detected'
    | 'root_cause_found'
    | 'solution_generated'
    | 'hitl_triggered'
    | 'error';
  /** Event timestamp */
  timestamp: string;
  /** Event data */
  data: Record<string, unknown>;
  /** Severity level */
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Event listener function type
 */
export type AdapterEventListener = (event: AdapterEvent) => void;

/**
 * OrchestratorAdapter provides integration between Persona Engine and AI Team Orchestrator
 *
 * @example
 * ```typescript
 * const adapter = new OrchestratorAdapter(config, personaManager);
 *
 * const response = await adapter.processRequest({
 *   requestId: 'req-001',
 *   sourceAgentUrn: 'urn:mycodexvantaos:agent:coordinator',
 *   input: 'I feel like nothing ever changes...',
 *   context: { timestamp: new Date().toISOString() }
 * });
 * ```
 */
export class OrchestratorAdapter {
  private config: OrchestratorAdapterConfig;
  private personaManager: PersonaManager;
  private activeSessions: Map<string, PersonaSession> = new Map();
  private eventListeners: AdapterEventListener[] = [];
  private requestCount: number = 0;
  private auditLog: Array<{ timestamp: string; action: string; details: Record<string, unknown> }> =
    [];

  constructor(config: OrchestratorAdapterConfig, personaManager: PersonaManager) {
    this.config = config;
    this.personaManager = personaManager;
    this.validateConfig();
  }

  /**
   * Validates the adapter configuration
   */
  private validateConfig(): void {
    if (!this.config.urn.startsWith('urn:mycodexvantaos:')) {
      throw new Error('Invalid URN format. Must start with urn:mycodexvantaos:');
    }

    if (this.config.governanceTier < -1 || this.config.governanceTier > 3) {
      throw new Error('Governance tier must be between -1 and 3');
    }

    if (this.config.hitlThreshold < 0 || this.config.hitlThreshold > 1) {
      throw new Error('HITL threshold must be between 0 and 1');
    }
  }

  /**
   * Adds an event listener
   */
  addEventListener(listener: AdapterEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Removes an event listener
   */
  removeEventListener(listener: AdapterEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emits an event to all listeners
   */
  private emitEvent(
    type: AdapterEvent['type'],
    data: Record<string, unknown>,
    severity: AdapterEvent['severity'] = 'info'
  ): void {
    const event: AdapterEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
      severity,
    };

    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Logs an action to the audit log
   */
  private logAction(action: string, details: Record<string, unknown>): void {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action,
      details,
    });
  }

  /**
   * Processes a request from the Orchestrator
   */
  async processRequest(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    const responseId = `resp-${++this.requestCount}`;

    this.logAction('process_request', {
      requestId: request.requestId,
      sourceAgentUrn: request.sourceAgentUrn,
    });

    try {
      // Determine which persona archetype to use
      const archetype = request.targetPersonaArchetype || this.config.defaultPersonaArchetype;

      // Get or create a persona engine for this archetype
      const engine = this.personaManager.getEngine(archetype);
      if (!engine) {
        throw new Error(`No persona engine available for archetype: ${archetype}`);
      }

      // Get the persona profile
      const profile = this.personaManager.getPersonaProfile(archetype);
      if (!profile) {
        throw new Error(`No persona profile found for archetype: ${archetype}`);
      }

      // Create or retrieve session
      let sessionId: string;
      if (request.context.sessionId && this.activeSessions.has(request.context.sessionId)) {
        sessionId = request.context.sessionId;
      } else {
        sessionId = engine.createSession();
        this.activeSessions.set(sessionId, {} as PersonaSession);
        this.emitEvent('session_created', { sessionId, archetype });
      }

      // Process through the persona engine
      const result = engine.process(request.input, sessionId);

      // Build the response
      const response: OrchestratorResponse = {
        responseId,
        requestId: request.requestId,
        personaUrn: profile.urn,
        personaArchetype: archetype,
        timestamp: new Date().toISOString(),
        success: true,
        response: {
          content: result.response.content,
          criticalTrack: result.response.criticalTrack,
          constructiveTrack: result.response.constructiveTrack,
        },
        appliedBehavioralParams: {
          criticalTolerance: profile.behavioral_parameters.critical_tolerance ?? 0,
          empathyLevel: profile.behavioral_parameters.empathy_level ?? 0,
          directness: profile.behavioral_parameters.directness ?? 0,
          solutionFocus: profile.behavioral_parameters.solution_focus ?? 0,
        },
        governance: {
          tier: this.config.governanceTier,
          constraints: this.getGovernanceConstraints(),
          auditTrail: this.auditLog.slice(-10).map((log) => `[${log.timestamp}] ${log.action}`),
        },
      };

      // Add semantic masks if detected
      if (result.masks && result.masks.length > 0) {
        response.response.semanticMasks = result.masks!.map((mask) => ({
          type: mask.mask_type,
          detected: true,
          confidence: mask.precision ?? 0,
          truth_reframe: mask.truth_reframe?.constructive_alternative ?? '',
        }));

        this.emitEvent(
          'mask_detected',
          {
            requestId: request.requestId,
            masks: result.masks!.map((m) => m.mask_type),
          },
          'warning'
        );
      }

      // Add root cause diagnosis if available
      if (result.diagnosis) {
        response.response.rootCauseDiagnosis = {
          layer: result.diagnosis.layer,
          findings: result.diagnosis.findings,
          confidence: result.diagnosis.confidence,
          primaryRootCause: result.diagnosis.findings[0] || 'Unknown',
        };

        this.emitEvent('root_cause_found', {
          requestId: request.requestId,
          confidence: result.diagnosis.confidence,
        });
      }

      // Add solutions if available
      if (result.solutionsArray && result.solutionsArray.length > 0) {
        response.response.solutions = result.solutionsArray.map((sol) => ({
          category: sol.category,
          description: sol.description,
          title: sol.title,
          expected_outcome: sol.expected_outcome,
        }));

        this.emitEvent('solution_generated', {
          requestId: request.requestId,
          count: result.solutionsArray.length,
        });
      }

      // Check for HITL triggers
      const hitlTriggers = this.checkHITLTriggers(result);
      if (hitlTriggers && hitlTriggers.length > 0) {
        response.hitlTriggers = hitlTriggers;
        this.emitEvent(
          'hitl_triggered',
          {
            requestId: request.requestId,
            triggers: hitlTriggers,
          },
          'warning'
        );
      }

      this.logAction('request_completed', {
        requestId: request.requestId,
        responseId,
        duration: Date.now() - startTime,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.emitEvent(
        'error',
        {
          requestId: request.requestId,
          error: errorMessage,
        },
        'error'
      );

      this.logAction('request_failed', {
        requestId: request.requestId,
        error: errorMessage,
      });

      // Return error response
      return {
        responseId,
        requestId: request.requestId,
        personaUrn: this.config.urn,
        personaArchetype: request.targetPersonaArchetype || this.config.defaultPersonaArchetype,
        timestamp: new Date().toISOString(),
        success: false,
        response: {
          content: `Error processing request: ${errorMessage}`,
        },
        appliedBehavioralParams: {
          criticalTolerance: 0.5,
          empathyLevel: 0.5,
          directness: 0.5,
          solutionFocus: 0.5,
        },
        governance: {
          tier: this.config.governanceTier,
          constraints: this.getGovernanceConstraints(),
          auditTrail: this.auditLog.slice(-10).map((log) => `[${log.timestamp}] ${log.action}`),
        },
      };
    }
  }

  /**
   * Checks for HITL (Human-in-the-Loop) triggers
   */
  private checkHITLTriggers(result: {
    masks?: SemanticMask[];
    diagnosis?: RootCauseDiagnosis;
    solutionsArray?: SolutionProposal[];
  }): OrchestratorResponse['hitlTriggers'] {
    const triggers: NonNullable<OrchestratorResponse['hitlTriggers']> = [];

    // Check for high confidence semantic masks
    const masks = result.masks || [];
    const highConfidenceMasks = masks.filter(
      (m) => (m.precision ?? 0) >= this.config.hitlThreshold
    );
    if (highConfidenceMasks.length > 0) {
      triggers.push({
        type: 'high_confidence_mask',
        reason: `Detected ${highConfidenceMasks.length} semantic masks above threshold`,
        severity: 'medium',
      });
    }

    // Check for low confidence diagnosis
    if (result.diagnosis && result.diagnosis.confidence < this.config.hitlThreshold) {
      triggers.push({
        type: 'low_confidence_diagnosis',
        reason: 'Root cause diagnosis confidence below threshold',
        severity: 'high',
      });
    }

    // Check for no solutions generated
    if (!result.solutionsArray || result.solutionsArray.length === 0) {
      triggers.push({
        type: 'no_solutions',
        reason: 'No viable solutions generated for the problem',
        severity: 'medium',
      });
    }

    return triggers;
  }

  /**
   * Gets governance constraints based on current tier
   */
  private getGovernanceConstraints(): string[] {
    const constraints: string[] = [];

    switch (this.config.governanceTier) {
      case -1:
        constraints.push('unrestricted');
        break;
      case 0:
        constraints.push('basic_logging', 'input_validation');
        break;
      case 1:
        constraints.push('full_logging', 'input_validation', 'output_filtering');
        break;
      case 2:
        constraints.push(
          'full_logging',
          'input_validation',
          'output_filtering',
          'human_review_required'
        );
        break;
      case 3:
        constraints.push(
          'full_logging',
          'input_validation',
          'output_filtering',
          'human_review_required',
          'audit_trail'
        );
        break;
    }

    return constraints;
  }

  /**
   * Closes an active session
   */
  closeSession(sessionId: string): boolean {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.delete(sessionId);
      this.emitEvent('session_closed', { sessionId });
      this.logAction('session_closed', { sessionId });
      return true;
    }
    return false;
  }

  /**
   * Gets the number of active sessions
   */
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Gets the adapter configuration
   */
  getConfig(): OrchestratorAdapterConfig {
    return { ...this.config };
  }

  /**
   * Gets the audit log
   */
  getAuditLog(): Array<{ timestamp: string; action: string; details: Record<string, unknown> }> {
    return [...this.auditLog];
  }

  /**
   * Clears the audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
    this.logAction('audit_log_cleared', {});
  }

  /**
   * Gets available persona archetypes from the manager
   */
  getAvailableArchetypes(): PersonaArchetype[] {
    return this.personaManager.getAvailableArchetypes();
  }

  /**
   * Health check for the adapter
   */
  healthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, unknown>;
  } {
    const archetypes = this.getAvailableArchetypes();
    const activeSessions = this.getActiveSessionCount();

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (archetypes.length === 0) {
      status = 'unhealthy';
    } else if (activeSessions > 100) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        urn: this.config.urn,
        availableArchetypes: archetypes.length,
        activeSessions,
        totalRequests: this.requestCount,
        auditLogEntries: this.auditLog.length,
        governanceTier: this.config.governanceTier,
      },
    };
  }
}

export default OrchestratorAdapter;
