/**
 * Behavioral Adjuster for MyCodexVantaOS Persona Engine
 *
 * Provides dynamic adjustment of behavioral parameters based on context,
 * user feedback, and interaction patterns to optimize persona effectiveness.
 *
 * @module mycodexvantaos-persona-engine/core/behavioral-adjuster
 */

import { BehavioralParameters, PersonaArchetype } from '../types';

/**
 * Adjustment context factors
 */
export interface AdjustmentContext {
  /** User engagement level (0-1) */
  engagementLevel?: number;
  /** Conversation depth achieved */
  conversationDepth?: number;
  /** User feedback score (-1 to 1) */
  feedbackScore?: number;
  /** Topic sensitivity level (0-1) */
  topicSensitivity?: number;
  /** Time pressure (0-1, higher = more urgent) */
  timePressure?: number;
  /** Complexity of the topic (0-1) */
  topicComplexity?: number;
  /** User's preferred communication style */
  preferredStyle?: 'direct' | 'gentle' | 'analytical' | 'supportive';
  /** Previous interaction count with this user */
  interactionCount?: number;
}

/**
 * Adjustment rule definition
 */
export interface AdjustmentRule {
  /** Rule name */
  name: string;
  /** Condition for applying the rule */
  condition: (context: AdjustmentContext) => boolean;
  /** Adjustments to apply */
  adjustments: Partial<BehavioralParameters>;
  /** Priority (higher = applied first) */
  priority: number;
  /** Rule description */
  description: string;
}

/**
 * Adjustment result
 */
export interface AdjustmentResult {
  /** Original parameters */
  original: BehavioralParameters;
  /** Adjusted parameters */
  adjusted: BehavioralParameters;
  /** Applied rules */
  appliedRules: string[];
  /** Adjustment delta for each parameter */
  delta: Partial<Record<keyof BehavioralParameters, number>>;
  /** Confidence in the adjustment (0-1) */
  confidence: number;
}

/**
 * BehavioralAdjuster configuration
 */
export interface BehavioralAdjusterConfig {
  /** Maximum adjustment per parameter (0-1) */
  maxAdjustment: number;
  /** Smoothing factor for adjustments (0-1, higher = more gradual) */
  smoothingFactor: number;
  /** Enable adaptive learning from feedback */
  enableAdaptiveLearning: boolean;
  /** Minimum confidence required to apply adjustments */
  minConfidence: number;
}

/**
 * Archetype-specific adjustment presets
 */
const ARCHETYPE_PRESETS: Record<PersonaArchetype, Partial<BehavioralParameters>> = {
  disrupter: {
    critical_tolerance: 0.7,
    empathy_level: 0.3,
    directness: 0.9,
    solution_focus: 0.6,
    abstraction_preference: 0.4,
    questioning_depth: 0.8,
    contradiction_frequency: 0.7,
  },
  analyst: {
    critical_tolerance: 0.5,
    empathy_level: 0.4,
    directness: 0.6,
    solution_focus: 0.7,
    abstraction_preference: 0.3,
    questioning_depth: 0.9,
    contradiction_frequency: 0.3,
  },
  mediator: {
    critical_tolerance: 0.4,
    empathy_level: 0.9,
    directness: 0.4,
    solution_focus: 0.8,
    abstraction_preference: 0.5,
    questioning_depth: 0.6,
    contradiction_frequency: 0.2,
  },
  architect: {
    critical_tolerance: 0.6,
    empathy_level: 0.4,
    directness: 0.7,
    solution_focus: 0.9,
    abstraction_preference: 0.6,
    questioning_depth: 0.7,
    contradiction_frequency: 0.4,
  },
  critic: {
    critical_tolerance: 0.8,
    empathy_level: 0.3,
    directness: 0.8,
    solution_focus: 0.5,
    abstraction_preference: 0.5,
    questioning_depth: 0.9,
    contradiction_frequency: 0.6,
  },
  creative_thinker: {
    critical_tolerance: 0.4,
    empathy_level: 0.6,
    directness: 0.5,
    solution_focus: 0.6,
    abstraction_preference: 0.8,
    questioning_depth: 0.7,
    contradiction_frequency: 0.4,
  },
  facilitator: {
    critical_tolerance: 0.5,
    empathy_level: 0.7,
    directness: 0.4,
    solution_focus: 0.6,
    abstraction_preference: 0.4,
    questioning_depth: 0.6,
    contradiction_frequency: 0.3,
  },
  mentor: {
    critical_tolerance: 0.4,
    empathy_level: 0.9,
    directness: 0.5,
    solution_focus: 0.7,
    abstraction_preference: 0.5,
    questioning_depth: 0.7,
    contradiction_frequency: 0.2,
  },
  synthesizer: {
    critical_tolerance: 0.6,
    empathy_level: 0.7,
    directness: 0.5,
    solution_focus: 0.7,
    abstraction_preference: 0.8,
    questioning_depth: 0.8,
    contradiction_frequency: 0.4,
  },
};

/**
 * BehavioralAdjuster dynamically adjusts persona behavioral parameters
 *
 * @example
 * ```typescript
 * const adjuster = new BehavioralAdjuster();
 *
 * const result = adjuster.adjust(baseParams, {
 *   engagementLevel: 0.3,
 *   feedbackScore: -0.2
 * });
 *
 * console.log(result.adjusted);
 * ```
 */
export class BehavioralAdjuster {
  private config: BehavioralAdjusterConfig;
  private rules: AdjustmentRule[] = [];
  private adjustmentHistory: Array<{
    timestamp: number;
    context: AdjustmentContext;
    result: AdjustmentResult;
  }> = [];

  constructor(config: Partial<BehavioralAdjusterConfig> = {}) {
    this.config = {
      maxAdjustment: config.maxAdjustment ?? 0.3,
      smoothingFactor: config.smoothingFactor ?? 0.5,
      enableAdaptiveLearning: config.enableAdaptiveLearning ?? true,
      minConfidence: config.minConfidence ?? 0.5,
    };

    this.initializeDefaultRules();
  }

  /**
   * Initializes default adjustment rules
   */
  private initializeDefaultRules(): void {
    this.rules = [
      // Low engagement - increase empathy and reduce directness
      {
        name: 'low_engagement_response',
        condition: (ctx) => (ctx.engagementLevel ?? 0.5) < 0.4,
        adjustments: {
          empathy_level: 0.15,
          directness: -0.1,
          questioning_depth: -0.1,
        },
        priority: 10,
        description: 'Increase empathy and soften approach when engagement is low',
      },

      // High topic sensitivity - increase empathy, reduce directness
      {
        name: 'sensitive_topic_handling',
        condition: (ctx) => (ctx.topicSensitivity ?? 0) > 0.7,
        adjustments: {
          empathy_level: 0.2,
          directness: -0.15,
          critical_tolerance: -0.1,
        },
        priority: 15,
        description: 'Handle sensitive topics with more care',
      },

      // High time pressure - increase directness and solution focus
      {
        name: 'urgent_situation',
        condition: (ctx) => (ctx.timePressure ?? 0) > 0.7,
        adjustments: {
          directness: 0.15,
          solution_focus: 0.2,
          questioning_depth: -0.2,
        },
        priority: 12,
        description: 'Be more direct and solution-oriented under time pressure',
      },

      // Complex topic - increase abstraction preference and questioning
      {
        name: 'complex_topic_deepening',
        condition: (ctx) => (ctx.topicComplexity ?? 0) > 0.7,
        adjustments: {
          abstraction_preference: 0.15,
          questioning_depth: 0.1,
          solution_focus: -0.1,
        },
        priority: 8,
        description: 'Allow more abstract thinking for complex topics',
      },

      // Negative feedback - reduce intensity across the board
      {
        name: 'negative_feedback_response',
        condition: (ctx) => (ctx.feedbackScore ?? 0) < -0.3,
        adjustments: {
          critical_tolerance: -0.15,
          directness: -0.1,
          contradiction_frequency: -0.2,
          empathy_level: 0.1,
        },
        priority: 20,
        description: 'Soften approach after negative feedback',
      },

      // Positive feedback - can be more challenging
      {
        name: 'positive_feedback_expansion',
        condition: (ctx) => (ctx.feedbackScore ?? 0) > 0.5,
        adjustments: {
          questioning_depth: 0.1,
          contradiction_frequency: 0.1,
        },
        priority: 5,
        description: 'Can push deeper after positive feedback',
      },

      // Preferred direct style
      {
        name: 'direct_style_preference',
        condition: (ctx) => ctx.preferredStyle === 'direct',
        adjustments: {
          directness: 0.15,
          empathy_level: -0.05,
        },
        priority: 7,
        description: 'Adapt to user preference for direct communication',
      },

      // Preferred gentle style
      {
        name: 'gentle_style_preference',
        condition: (ctx) => ctx.preferredStyle === 'gentle',
        adjustments: {
          empathy_level: 0.15,
          directness: -0.1,
          critical_tolerance: -0.05,
        },
        priority: 7,
        description: 'Adapt to user preference for gentle communication',
      },

      // Deep conversation achieved - can go deeper
      {
        name: 'deep_conversation_deepening',
        condition: (ctx) => (ctx.conversationDepth ?? 0) > 0.7,
        adjustments: {
          questioning_depth: 0.15,
          abstraction_preference: 0.1,
        },
        priority: 6,
        description: 'Deepen exploration in established conversations',
      },

      // First interaction - start moderate
      {
        name: 'first_interaction_moderation',
        condition: (ctx) => (ctx.interactionCount ?? 0) <= 1,
        adjustments: {
          critical_tolerance: -0.1,
          contradiction_frequency: -0.2,
          empathy_level: 0.1,
        },
        priority: 11,
        description: 'Start with a more moderate approach in first interactions',
      },
    ];

    // Sort by priority (highest first)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Adjusts behavioral parameters based on context
   */
  adjust(baseParams: BehavioralParameters, context: AdjustmentContext): AdjustmentResult {
    const appliedRules: string[] = [];
    const delta: Partial<Record<keyof BehavioralParameters, number>> = {
      critical_tolerance: 0,
      empathy_level: 0,
      directness: 0,
      solution_focus: 0,
      abstraction_preference: 0,
      questioning_depth: 0,
      contradiction_frequency: 0,
    };

    // Find applicable rules
    const applicableRules = this.rules.filter((rule) => rule.condition(context));

    // Apply adjustments from rules
    for (const rule of applicableRules) {
      appliedRules.push(rule.name);

      for (const [param, adjustment] of Object.entries(rule.adjustments) as [
        keyof BehavioralParameters,
        number,
      ][]) {
        // Apply with smoothing
        const smoothedAdjustment = adjustment * (1 - this.config.smoothingFactor);
        delta[param] = (delta[param] ?? 0) + smoothedAdjustment;
      }
    }

    // Clamp adjustments
    for (const param of Object.keys(delta) as (keyof BehavioralParameters)[]) {
      if (delta[param] !== undefined) {
        delta[param] = Math.max(
          -this.config.maxAdjustment,
          Math.min(this.config.maxAdjustment, delta[param]!)
        );
      }
    }

    // Calculate adjusted parameters
    const adjusted: BehavioralParameters = {
      critical_tolerance: this.clampValue(
        (baseParams.critical_tolerance ?? 0) + (delta.critical_tolerance ?? 0)
      ),
      empathy_level: this.clampValue((baseParams.empathy_level ?? 0) + (delta.empathy_level ?? 0)),
      directness: this.clampValue((baseParams.directness ?? 0) + (delta.directness ?? 0)),
      solution_focus: this.clampValue(
        (baseParams.solution_focus ?? 0) + (delta.solution_focus ?? 0)
      ),
      abstraction_preference: this.clampValue(
        (baseParams.abstraction_preference ?? 0) + (delta.abstraction_preference ?? 0)
      ),
      questioning_depth: this.clampValue(
        (baseParams.questioning_depth ?? 0) + (delta.questioning_depth ?? 0)
      ),
      contradiction_frequency: this.clampValue(
        (baseParams.contradiction_frequency ?? 0) + (delta.contradiction_frequency ?? 0)
      ),
    };

    // Calculate confidence based on number of rules applied and their consistency
    const confidence = this.calculateConfidence(applicableRules, delta);

    const result: AdjustmentResult = {
      original: baseParams,
      adjusted,
      appliedRules,
      delta,
      confidence,
    };

    // Store in history for learning
    if (this.config.enableAdaptiveLearning) {
      this.adjustmentHistory.push({
        timestamp: Date.now(),
        context,
        result,
      });

      // Keep history bounded
      if (this.adjustmentHistory.length > 1000) {
        this.adjustmentHistory = this.adjustmentHistory.slice(-500);
      }
    }

    return result;
  }

  /**
   * Clamps a value to valid range [0, 1]
   */
  private clampValue(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  /**
   * Calculates confidence in the adjustment
   */
  private calculateConfidence(
    rules: AdjustmentRule[],
    delta: Partial<Record<keyof BehavioralParameters, number>>
  ): number {
    if (rules.length === 0) {
      return 0.5; // Neutral confidence when no rules apply
    }

    // Higher confidence with more consistent rules
    const avgDelta = Object.values(delta).reduce((a, b) => a + Math.abs(b), 0) / 7;
    const ruleConsistency = rules.length > 1 ? 0.8 : 0.6;

    return Math.min(1, ruleConsistency + avgDelta);
  }

  /**
   * Gets the preset parameters for an archetype
   */
  getArchetypePreset(archetype: PersonaArchetype): Partial<BehavioralParameters> {
    return { ...ARCHETYPE_PRESETS[archetype] };
  }

  /**
   * Adds a custom adjustment rule
   */
  addRule(rule: AdjustmentRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Removes an adjustment rule by name
   */
  removeRule(name: string): boolean {
    const index = this.rules.findIndex((r) => r.name === name);
    if (index > -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Gets all current rules
   */
  getRules(): AdjustmentRule[] {
    return [...this.rules];
  }

  /**
   * Gets adjustment history
   */
  getHistory(): Array<{ timestamp: number; context: AdjustmentContext; result: AdjustmentResult }> {
    return [...this.adjustmentHistory];
  }

  /**
   * Clears adjustment history
   */
  clearHistory(): void {
    this.adjustmentHistory = [];
  }

  /**
   * Resets to default rules
   */
  resetRules(): void {
    this.initializeDefaultRules();
  }

  /**
   * Suggests optimal parameters based on historical feedback
   */
  suggestOptimal(archetype: PersonaArchetype): BehavioralParameters {
    const preset = this.getArchetypePreset(archetype);
    const baseParams: BehavioralParameters = {
      critical_tolerance: preset.critical_tolerance ?? 0.5,
      empathy_level: preset.empathy_level ?? 0.5,
      directness: preset.directness ?? 0.5,
      solution_focus: preset.solution_focus ?? 0.5,
      abstraction_preference: preset.abstraction_preference ?? 0.5,
      questioning_depth: preset.questioning_depth ?? 0.5,
      contradiction_frequency: preset.contradiction_frequency ?? 0.5,
    };

    if (!this.config.enableAdaptiveLearning || this.adjustmentHistory.length < 10) {
      return baseParams;
    }

    // Analyze history for successful adjustments
    const successfulAdjustments = this.adjustmentHistory
      .filter((h) => (h.context.feedbackScore ?? 0) > 0.3)
      .map((h) => h.result.adjusted);

    if (successfulAdjustments.length === 0) {
      return baseParams;
    }

    // Average successful parameters
    const avgParams: BehavioralParameters = {
      critical_tolerance: 0,
      empathy_level: 0,
      directness: 0,
      solution_focus: 0,
      abstraction_preference: 0,
      questioning_depth: 0,
      contradiction_frequency: 0,
    };

    for (const params of successfulAdjustments) {
      for (const key of Object.keys(avgParams) as (keyof BehavioralParameters)[]) {
        if (avgParams[key] !== undefined && params[key] !== undefined) {
          avgParams[key]! += params[key]!;
        }
      }
    }

    for (const key of Object.keys(avgParams) as (keyof BehavioralParameters)[]) {
      if (avgParams[key] !== undefined) {
        avgParams[key]! /= successfulAdjustments.length;
      }
    }

    return avgParams;
  }
}

export default BehavioralAdjuster;
