import {
  BehavioralAdjuster,
  AdjustmentContext,
  AdjustmentRule,
  BehavioralAdjusterConfig,
} from '../core/behavioral-adjuster';
import { BehavioralParameters, PersonaArchetype } from '../types';

describe('BehavioralAdjuster', () => {
  let adjuster: BehavioralAdjuster;
  const baseParams: BehavioralParameters = {
    critical_tolerance: 0.5,
    empathy_level: 0.5,
    directness: 0.5,
    solution_focus: 0.5,
    abstraction_preference: 0.5,
    questioning_depth: 0.5,
    contradiction_frequency: 0.5,
  };

  beforeEach(() => {
    adjuster = new BehavioralAdjuster();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultAdjuster = new BehavioralAdjuster();
      expect(defaultAdjuster).toBeDefined();
    });

    it('should accept custom config', () => {
      const customConfig: Partial<BehavioralAdjusterConfig> = {
        maxAdjustment: 0.2,
        smoothingFactor: 0.7,
        enableAdaptiveLearning: false,
        minConfidence: 0.6,
      };
      const customAdjuster = new BehavioralAdjuster(customConfig);
      expect(customAdjuster).toBeDefined();
    });
  });

  describe('adjust', () => {
    it('should return adjustment result with all required fields', () => {
      const context: AdjustmentContext = {
        engagementLevel: 0.5,
        feedbackScore: 0,
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result).toHaveProperty('original');
      expect(result).toHaveProperty('adjusted');
      expect(result).toHaveProperty('appliedRules');
      expect(result).toHaveProperty('delta');
      expect(result).toHaveProperty('confidence');
    });

    it('should apply low engagement rule when engagement is low', () => {
      const context: AdjustmentContext = {
        engagementLevel: 0.2,
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result.appliedRules).toContain('low_engagement_response');
    });

    it('should apply sensitive topic rule for high topic sensitivity', () => {
      const context: AdjustmentContext = {
        topicSensitivity: 0.8,
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result.appliedRules).toContain('sensitive_topic_handling');
    });

    it('should apply urgent situation rule for high time pressure', () => {
      const context: AdjustmentContext = {
        timePressure: 0.8,
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result.appliedRules).toContain('urgent_situation');
    });

    it('should apply complex topic rule for high topic complexity', () => {
      const context: AdjustmentContext = {
        topicComplexity: 0.8,
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result.appliedRules).toContain('complex_topic_deepening');
    });

    it('should apply negative feedback rule for negative feedback score', () => {
      const context: AdjustmentContext = {
        feedbackScore: -0.5,
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result.appliedRules).toContain('negative_feedback_response');
    });

    it('should apply positive feedback rule for high positive feedback', () => {
      const context: AdjustmentContext = {
        feedbackScore: 0.6,
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result.appliedRules).toContain('positive_feedback_expansion');
    });

    it('should apply direct style preference rule', () => {
      const context: AdjustmentContext = {
        preferredStyle: 'direct',
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result.appliedRules).toContain('direct_style_preference');
    });

    it('should apply gentle style preference rule', () => {
      const context: AdjustmentContext = {
        preferredStyle: 'gentle',
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result.appliedRules).toContain('gentle_style_preference');
    });

    it('should apply deep conversation rule for high conversation depth', () => {
      const context: AdjustmentContext = {
        conversationDepth: 0.8,
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result.appliedRules).toContain('deep_conversation_deepening');
    });

    it('should apply first interaction rule for new users', () => {
      const context: AdjustmentContext = {
        interactionCount: 1,
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result.appliedRules).toContain('first_interaction_moderation');
    });

    it('should not apply first interaction rule for returning users', () => {
      const context: AdjustmentContext = {
        interactionCount: 5,
      };
      const result = adjuster.adjust(baseParams, context);

      expect(result.appliedRules).not.toContain('first_interaction_moderation');
    });

    it('should keep adjusted parameters within valid range [0, 1]', () => {
      const extremeContext: AdjustmentContext = {
        engagementLevel: 0,
        feedbackScore: -1,
        topicSensitivity: 1,
        timePressure: 1,
      };
      const result = adjuster.adjust(baseParams, extremeContext);

      for (const value of Object.values(result.adjusted)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should return original parameters unchanged in result', () => {
      const context: AdjustmentContext = { engagementLevel: 0.3 };
      const result = adjuster.adjust(baseParams, context);

      expect(result.original).toEqual(baseParams);
    });

    it('should calculate confidence', () => {
      const context: AdjustmentContext = { engagementLevel: 0.3 };
      const result = adjuster.adjust(baseParams, context);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should return neutral confidence when no rules apply', () => {
      const neutralContext: AdjustmentContext = {
        engagementLevel: 0.6,
        feedbackScore: 0,
        topicSensitivity: 0.3,
        timePressure: 0.3,
        topicComplexity: 0.3,
        interactionCount: 10,
      };
      const result = adjuster.adjust(baseParams, neutralContext);

      // No rules should apply
      expect(result.appliedRules.length).toBe(0);
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('getArchetypePreset', () => {
    const archetypes: PersonaArchetype[] = [
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

    it('should return preset for each archetype', () => {
      for (const archetype of archetypes) {
        const preset = adjuster.getArchetypePreset(archetype);
        expect(preset).toBeDefined();
        expect(typeof preset).toBe('object');
      }
    });

    it('should return different presets for different archetypes', () => {
      const disrupterPreset = adjuster.getArchetypePreset('disrupter');
      const mediatorPreset = adjuster.getArchetypePreset('mediator');

      expect(disrupterPreset.directness).toBeGreaterThan(mediatorPreset.directness ?? 0);
      expect(mediatorPreset.empathy_level).toBeGreaterThan(disrupterPreset.empathy_level ?? 0);
    });

    it('should return a copy of preset (not reference)', () => {
      const preset1 = adjuster.getArchetypePreset('analyst');
      const preset2 = adjuster.getArchetypePreset('analyst');

      expect(preset1).not.toBe(preset2);
      expect(preset1).toEqual(preset2);
    });
  });

  describe('addRule', () => {
    it('should add a custom rule', () => {
      const customRule: AdjustmentRule = {
        name: 'custom_test_rule',
        condition: (ctx) => ctx.engagementLevel === 0.99,
        adjustments: { empathy_level: 0.5 },
        priority: 100,
        description: 'Custom test rule',
      };

      adjuster.addRule(customRule);
      const rules = adjuster.getRules();

      expect(rules.find((r) => r.name === 'custom_test_rule')).toBeDefined();
    });

    it('should apply custom rule when condition matches', () => {
      const customRule: AdjustmentRule = {
        name: 'custom_applied_rule',
        condition: (ctx) => ctx.topicComplexity === 1,
        adjustments: { solution_focus: 0.3 },
        priority: 100,
        description: 'Custom applied rule',
      };

      adjuster.addRule(customRule);
      const result = adjuster.adjust(baseParams, { topicComplexity: 1 });

      expect(result.appliedRules).toContain('custom_applied_rule');
    });

    it('should maintain rule order by priority', () => {
      const highPriorityRule: AdjustmentRule = {
        name: 'high_priority',
        condition: () => true,
        adjustments: {},
        priority: 200,
        description: 'High priority rule',
      };

      const lowPriorityRule: AdjustmentRule = {
        name: 'low_priority',
        condition: () => true,
        adjustments: {},
        priority: 1,
        description: 'Low priority rule',
      };

      adjuster.addRule(lowPriorityRule);
      adjuster.addRule(highPriorityRule);

      const rules = adjuster.getRules();
      const highIndex = rules.findIndex((r) => r.name === 'high_priority');
      const lowIndex = rules.findIndex((r) => r.name === 'low_priority');

      expect(highIndex).toBeLessThan(lowIndex);
    });
  });

  describe('removeRule', () => {
    it('should remove an existing rule', () => {
      const customRule: AdjustmentRule = {
        name: 'rule_to_remove',
        condition: () => true,
        adjustments: {},
        priority: 50,
        description: 'Rule to remove',
      };

      adjuster.addRule(customRule);
      const removed = adjuster.removeRule('rule_to_remove');

      expect(removed).toBe(true);
      expect(adjuster.getRules().find((r) => r.name === 'rule_to_remove')).toBeUndefined();
    });

    it('should return false for non-existent rule', () => {
      const removed = adjuster.removeRule('non_existent_rule');
      expect(removed).toBe(false);
    });
  });

  describe('getRules', () => {
    it('should return a copy of rules array', () => {
      const rules1 = adjuster.getRules();
      const rules2 = adjuster.getRules();

      expect(rules1).not.toBe(rules2);
      expect(rules1.length).toBe(rules2.length);
    });

    it('should return all default rules', () => {
      const rules = adjuster.getRules();
      const ruleNames = rules.map((r) => r.name);

      expect(ruleNames).toContain('low_engagement_response');
      expect(ruleNames).toContain('sensitive_topic_handling');
      expect(ruleNames).toContain('urgent_situation');
      expect(ruleNames).toContain('complex_topic_deepening');
      expect(ruleNames).toContain('negative_feedback_response');
      expect(ruleNames).toContain('positive_feedback_expansion');
      expect(ruleNames).toContain('first_interaction_moderation');
    });
  });

  describe('getHistory', () => {
    it('should return empty history initially', () => {
      const history = adjuster.getHistory();
      expect(history).toEqual([]);
    });

    it('should record adjustments in history when adaptive learning is enabled', () => {
      const learningAdjuster = new BehavioralAdjuster({
        enableAdaptiveLearning: true,
      });

      learningAdjuster.adjust(baseParams, { engagementLevel: 0.2 });
      const history = learningAdjuster.getHistory();

      expect(history.length).toBe(1);
      expect(history[0].context.engagementLevel).toBe(0.2);
    });

    it('should not record history when adaptive learning is disabled', () => {
      const noLearningAdjuster = new BehavioralAdjuster({
        enableAdaptiveLearning: false,
      });

      noLearningAdjuster.adjust(baseParams, { engagementLevel: 0.2 });
      const history = noLearningAdjuster.getHistory();

      expect(history.length).toBe(0);
    });

    it('should return a copy of history', () => {
      adjuster.adjust(baseParams, { engagementLevel: 0.2 });
      const history1 = adjuster.getHistory();
      const history2 = adjuster.getHistory();

      expect(history1).not.toBe(history2);
    });

    it('should bound history when exceeding 1000 entries', () => {
      for (let i = 0; i < 1100; i++) {
        adjuster.adjust(baseParams, { engagementLevel: Math.random() });
      }
      const history = adjuster.getHistory();

      // History is trimmed to 500 when exceeding 1000, then remaining entries are added
      // So after 1100 adjustments: 500 (trimmed) + 99 (remaining after threshold) = 599
      expect(history.length).toBeLessThanOrEqual(600);
      expect(history.length).toBeGreaterThan(500);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      adjuster.adjust(baseParams, { engagementLevel: 0.2 });
      adjuster.adjust(baseParams, { engagementLevel: 0.3 });
      adjuster.clearHistory();
      const history = adjuster.getHistory();

      expect(history.length).toBe(0);
    });
  });

  describe('resetRules', () => {
    it('should reset to default rules after modifications', () => {
      adjuster.addRule({
        name: 'temp_rule',
        condition: () => true,
        adjustments: {},
        priority: 1,
        description: 'Temporary',
      });
      adjuster.removeRule('low_engagement_response');

      adjuster.resetRules();
      const rules = adjuster.getRules();

      expect(rules.find((r) => r.name === 'temp_rule')).toBeUndefined();
      expect(rules.find((r) => r.name === 'low_engagement_response')).toBeDefined();
    });
  });

  describe('suggestOptimal', () => {
    it('should return base params when adaptive learning is disabled', () => {
      const noLearningAdjuster = new BehavioralAdjuster({
        enableAdaptiveLearning: false,
      });

      const suggestion = noLearningAdjuster.suggestOptimal('analyst');
      expect(suggestion).toBeDefined();
    });

    it('should return base params when history is too small', () => {
      adjuster.adjust(baseParams, { engagementLevel: 0.2 });
      const suggestion = adjuster.suggestOptimal('analyst');

      expect(suggestion).toBeDefined();
    });

    it('should analyze successful adjustments when enough history exists', () => {
      // Create enough history with positive feedback
      for (let i = 0; i < 15; i++) {
        adjuster.adjust(baseParams, {
          engagementLevel: 0.5,
          feedbackScore: 0.5,
        });
      }

      const suggestion = adjuster.suggestOptimal('analyst');
      expect(suggestion).toBeDefined();
      expect(typeof suggestion).toBe('object');
    });

    it('should return archetype preset values when no successful adjustments', () => {
      // Create history with negative feedback (not successful)
      for (let i = 0; i < 15; i++) {
        adjuster.adjust(baseParams, {
          engagementLevel: 0.5,
          feedbackScore: -0.5,
        });
      }

      const suggestion = adjuster.suggestOptimal('analyst');
      expect(suggestion).toBeDefined();
    });
  });

  describe('multiple rule application', () => {
    it('should apply multiple rules when multiple conditions match', () => {
      const complexContext: AdjustmentContext = {
        engagementLevel: 0.2, // triggers low_engagement_response
        feedbackScore: -0.5, // triggers negative_feedback_response
        timePressure: 0.8, // triggers urgent_situation
      };
      const result = adjuster.adjust(baseParams, complexContext);

      expect(result.appliedRules.length).toBeGreaterThan(1);
      expect(result.appliedRules).toContain('low_engagement_response');
      expect(result.appliedRules).toContain('negative_feedback_response');
      expect(result.appliedRules).toContain('urgent_situation');
    });

    it('should apply rules in priority order', () => {
      const context: AdjustmentContext = {
        feedbackScore: -0.5, // priority 20
        engagementLevel: 0.2, // priority 10
        timePressure: 0.8, // priority 12
      };
      const result = adjuster.adjust(baseParams, context);

      // All rules should be applied
      expect(result.appliedRules).toContain('negative_feedback_response');
      expect(result.appliedRules).toContain('low_engagement_response');
      expect(result.appliedRules).toContain('urgent_situation');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined context values', () => {
      const result = adjuster.adjust(baseParams, {});
      expect(result).toBeDefined();
      expect(result.adjusted).toBeDefined();
    });

    it('should handle extreme parameter values', () => {
      const extremeParams: BehavioralParameters = {
        critical_tolerance: 0,
        empathy_level: 0,
        directness: 1,
        solution_focus: 1,
        abstraction_preference: 0,
        questioning_depth: 1,
        contradiction_frequency: 0,
      };
      const result = adjuster.adjust(extremeParams, {
        engagementLevel: 0.2,
      });

      expect(result).toBeDefined();
      for (const value of Object.values(result.adjusted)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should handle all style preferences', () => {
      const styles: Array<'direct' | 'gentle' | 'analytical' | 'supportive'> = [
        'direct',
        'gentle',
        'analytical',
        'supportive',
      ];

      for (const style of styles) {
        const result = adjuster.adjust(baseParams, { preferredStyle: style });
        expect(result).toBeDefined();
      }
    });
  });
});
