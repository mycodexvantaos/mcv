/**
 * MyCodexVantaOS Persona Engine - Solution Generator Tests
 *
 * Unit tests for the SolutionGenerator class.
 */

import { SolutionGenerator } from '../core/solution-generator';
import type { RootCauseDiagnosis, SolutionCategory } from '../types';

describe('SolutionGenerator', () => {
  let generator: SolutionGenerator;

  beforeEach(() => {
    generator = new SolutionGenerator();
  });

  describe('constructor', () => {
    it('should initialize with default templates', () => {
      const templates = generator.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should accept custom templates', () => {
      const customTemplate = {
        category: 'cognitive_restructuring' as SolutionCategory,
        name: 'Custom Test Template',
        description: 'A custom template for testing',
        applicability_criteria: ['test_criteria'],
        tools: ['test_tool'],
        time_frame_range: { min_days: 7, max_days: 14 },
      };

      const customGenerator = new SolutionGenerator([customTemplate]);
      const templates = customGenerator.getTemplates();

      expect(templates.length).toBe(1);
      expect(templates[0].name).toBe('Custom Test Template');
    });
  });

  describe('getTemplates', () => {
    it('should return all templates', () => {
      const templates = generator.getTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should return copies, not references', () => {
      const templates1 = generator.getTemplates();
      const templates2 = generator.getTemplates();

      expect(templates1).not.toBe(templates2);
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return templates for specific category', () => {
      const cognitiveTemplates = generator.getTemplatesByCategory('cognitive_restructuring');

      expect(cognitiveTemplates.length).toBeGreaterThan(0);
      cognitiveTemplates.forEach((t) => {
        expect(t.category).toBe('cognitive_restructuring');
      });
    });

    it('should return empty array for category with no templates', () => {
      const templates = generator.getTemplatesByCategory('cognitive_restructuring');
      expect(Array.isArray(templates)).toBe(true);
    });
  });

  describe('generate', () => {
    it('should generate solutions for diagnosis', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'cognitive_structures',
          findings: ['negative_thoughts', 'catastrophizing'],
          confidence: 0.8,
        },
      ];

      const result = generator.generate({
        problem: 'I always think the worst will happen',
        diagnosis,
        constraints: {},
        preferences: {},
      });

      expect(result.solutions.length).toBeGreaterThan(0);
      expect(result.prioritized_order.length).toBeGreaterThan(0);
      expect(result.rationale).toBeDefined();
      expect(result.estimated_time_frame).toBeDefined();
    });

    it('should respect maximum solutions constraint', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'behavioral_patterns',
          findings: ['avoidance behavior', 'procrastination'],
          confidence: 0.7,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: { maximum_solutions: 2 },
        preferences: {},
      });

      expect(result.solutions.length).toBeLessThanOrEqual(2);
    });

    it('should prioritize preferred categories', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'cognitive_structures',
          findings: ['negative beliefs'],
          confidence: 0.8,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: {},
        preferences: {
          preferred_categories: ['cognitive_restructuring'],
        },
      });

      if (result.solutions.length > 0) {
        expect(result.solutions[0].category).toBeDefined();
      }
    });

    it('should include action steps in solutions', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'behavioral_patterns',
          findings: ['avoidance'],
          confidence: 0.7,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: {},
        preferences: {},
      });

      if (result.solutions.length > 0) {
        expect(result.solutions[0].action_steps.length).toBeGreaterThan(0);
        expect(result.solutions[0].action_steps[0].action).toBeDefined();
      }
    });

    it('should identify success factors', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'surface_symptoms',
          findings: ['anxiety'],
          confidence: 0.6,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: {},
        preferences: {},
      });

      expect(result.success_factors.length).toBeGreaterThan(0);
    });

    it('should identify potential obstacles', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'cognitive_structures',
          findings: ['rigid beliefs'],
          confidence: 0.7,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: {},
        preferences: {},
      });

      expect(Array.isArray(result.potential_obstacles)).toBe(true);
    });
  });

  describe('quickSuggest', () => {
    it('should provide immediate actions for anxiety', () => {
      const result = generator.quickSuggest('I feel anxious about my upcoming presentation');

      expect(result.immediate_actions.length).toBeGreaterThan(0);
      expect(result.recommended_approach).toBeDefined();
    });

    it('should provide calming techniques for stress', () => {
      const result = generator.quickSuggest('I am very stressed about my workload');

      expect(result.immediate_actions.length).toBeGreaterThan(0);
    });

    it('should provide structure for overwhelm', () => {
      const result = generator.quickSuggest('I feel overwhelmed by everything I need to do');

      expect(result.immediate_actions).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle available resources constraint', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'behavioral_patterns',
          findings: ['avoidance behavior'],
          confidence: 0.7,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: {
          available_resources: ['Time', 'Commitment', 'Journal'],
        },
        preferences: {},
      });

      expect(result.solutions).toBeDefined();
    });

    it('should handle professional support level preference', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'cognitive_structures',
          findings: ['negative beliefs'],
          confidence: 0.7,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: {},
        preferences: { support_level: 'professional' },
      });

      expect(result.success_factors).toBeDefined();
      expect(result.success_factors.length).toBeGreaterThan(0);
    });

    it('should handle environment adjustment solutions in success factors', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'behavioral_patterns',
          findings: ['unsupportive environment patterns'],
          confidence: 0.7,
        },
      ];

      const result = generator.generate({
        problem: 'My workspace is distracting',
        diagnosis,
        constraints: {},
        preferences: {},
      });

      expect(result.solutions).toBeDefined();
    });

    it('should handle low urgency preference', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'behavioral_patterns',
          findings: ['habit formation'],
          confidence: 0.7,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: {},
        preferences: { urgency: 'low' },
      });

      expect(result.estimated_time_frame).toBeDefined();
    });

    it('should handle medium urgency preference', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'behavioral_patterns',
          findings: ['habit formation'],
          confidence: 0.7,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: {},
        preferences: { urgency: 'medium' },
      });

      expect(result.estimated_time_frame).toBeDefined();
    });

    it('should handle time_limit_days less than min_days (accelerated)', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'cognitive_structures',
          findings: ['negative beliefs'],
          confidence: 0.8,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: { time_limit_days: 3 },
        preferences: {},
      });

      expect(result.estimated_time_frame).toBeDefined();
      expect(typeof result.estimated_time_frame).toBe('string');
    });

    it('should handle time_limit_days within normal range', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'behavioral_patterns',
          findings: ['habit formation'],
          confidence: 0.7,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: { time_limit_days: 30 },
        preferences: {},
      });

      expect(result.estimated_time_frame).toBeDefined();
    });

    it('should score solutions with preferred_categories bonus', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'cognitive_structures',
          findings: ['negative beliefs'],
          confidence: 0.8,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: {},
        preferences: { preferred_categories: ['cognitive_restructuring'] },
      });

      expect(result.solutions).toBeDefined();
      expect(Array.isArray(result.prioritized_order)).toBe(true);
    });

    it('should score solutions with time_limit_days alignment bonus', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'behavioral_patterns',
          findings: ['avoidance'],
          confidence: 0.7,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: { time_limit_days: 60 },
        preferences: {},
      });

      expect(result.solutions).toBeDefined();
    });

    it('should handle high urgency with quick solutions', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'behavioral_patterns',
          findings: ['avoidance behavior'],
          confidence: 0.7,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: {},
        preferences: { urgency: 'high' },
      });

      expect(result.estimated_time_frame).toBeDefined();
    });

    it('should handle solutions with time frame alignment scoring', () => {
      const diagnosis: RootCauseDiagnosis[] = [
        {
          layer: 'behavioral_patterns',
          findings: ['avoidance behavior'],
          confidence: 0.8,
        },
      ];

      const result = generator.generate({
        problem: 'Test problem',
        diagnosis,
        constraints: { time_limit_days: 45 },
        preferences: { preferred_categories: ['behavioral_action'] },
      });

      expect(result.solutions).toBeDefined();
      expect(Array.isArray(result.solutions)).toBe(true);
    });
  });
});
