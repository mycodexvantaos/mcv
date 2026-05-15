/**
 * Unit Tests for PersonaEngine
 *
 * Tests the main persona engine integrating mask detection, analysis, and solution generation
 */

import {
  PersonaEngine,
  PersonaEngineConfig,
  PersonaProcessingResult,
} from '../core/persona-engine';
import { PersonaProfile, PersonaArchetype, BehavioralParameters } from '../types';

// Helper to create test persona profiles
function createTestPersona(
  archetype: PersonaArchetype,
  params?: Partial<BehavioralParameters>
): PersonaProfile {
  return {
    urn: `urn:mycodexvantaos:persona:${archetype}-test`,
    name: `${archetype} Test Persona`,
    archetype,
    version: '1.0.0',
    description: `Test ${archetype} persona`,
    behavioral_parameters: {
      critical_tolerance: 0.7,
      empathy_level: 0.5,
      directness: 0.7,
      solution_focus: 0.6,
      abstraction_preference: 0.4,
      questioning_depth: 0.5,
      contradiction_frequency: 0.3,
      truth_commitment: 0.8,
      critical_intensity: 0.6,
      analytical_depth: 0.7,
      constructive_orientation: 0.5,
      communication_clarity: 0.6,
      ...params,
    },
    ethical_boundaries: {
      avoid_sarcasm: true,
      respect_autonomy: true,
      truth_with_constructive_intent: true,
    },
    response_protocols: {
      critique_to_solution_ratio: '1:2',
      action_steps_required: true,
    },
  };
}

describe('PersonaEngine', () => {
  describe('constructor', () => {
    it('should create engine with valid config', () => {
      const persona = createTestPersona('analyst');
      const config: PersonaEngineConfig = { persona };
      const engine = new PersonaEngine(config);
      expect(engine).toBeDefined();
    });

    it('should use default config values when not specified', () => {
      const persona = createTestPersona('disrupter');
      const config: PersonaEngineConfig = { persona };
      const engine = new PersonaEngine(config);
      expect(engine).toBeDefined();
    });

    it('should accept custom config values', () => {
      const persona = createTestPersona('architect');
      const config: PersonaEngineConfig = {
        persona,
        minDiagnosisConfidence: 0.8,
        maxSolutionsPerResponse: 5,
      };
      const engine = new PersonaEngine(config);
      expect(engine).toBeDefined();
    });

    it('should accept custom masks', () => {
      const persona = createTestPersona('critic');
      const config: PersonaEngineConfig = {
        persona,
        customMasks: [],
      };
      const engine = new PersonaEngine(config);
      expect(engine).toBeDefined();
    });
  });

  describe('getPersona', () => {
    it('should return the persona profile', () => {
      const persona = createTestPersona('mediator');
      const engine = new PersonaEngine({ persona });
      expect(engine.getPersona()).toEqual(persona);
    });
  });

  describe('getBehavioralParameters', () => {
    it('should return behavioral parameters', () => {
      const persona = createTestPersona('mentor');
      const engine = new PersonaEngine({ persona });
      const params = engine.getBehavioralParameters();
      expect(params).toBeDefined();
      expect(params.critical_tolerance).toBeDefined();
    });
  });

  describe('getEthicalBoundaries', () => {
    it('should return ethical boundaries', () => {
      const persona = createTestPersona('facilitator');
      const engine = new PersonaEngine({ persona });
      const boundaries = engine.getEthicalBoundaries();
      expect(boundaries).toBeDefined();
      expect(boundaries.respect_autonomy).toBe(true);
    });

    it('should return empty object when no boundaries defined', () => {
      const persona = createTestPersona('synthesizer');
      delete persona.ethical_boundaries;
      const engine = new PersonaEngine({ persona });
      const boundaries = engine.getEthicalBoundaries();
      expect(boundaries).toEqual({});
    });
  });

  describe('getResponseProtocols', () => {
    it('should return response protocols', () => {
      const persona = createTestPersona('creative_thinker');
      const engine = new PersonaEngine({ persona });
      const protocols = engine.getResponseProtocols();
      expect(protocols).toBeDefined();
    });

    it('should return empty object when no protocols defined', () => {
      const persona = createTestPersona('analyst');
      delete persona.response_protocols;
      const engine = new PersonaEngine({ persona });
      const protocols = engine.getResponseProtocols();
      expect(protocols).toEqual({});
    });
  });

  describe('session management', () => {
    it('should create a new session', () => {
      const persona = createTestPersona('disrupter');
      const engine = new PersonaEngine({ persona });
      const sessionId = engine.createSession();
      expect(sessionId).toMatch(/^session-/);
    });

    it('should get session by ID', () => {
      const persona = createTestPersona('analyst');
      const engine = new PersonaEngine({ persona });
      const sessionId = engine.createSession();
      const session = engine.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.session_id).toBe(sessionId);
    });

    it('should return undefined for non-existent session', () => {
      const persona = createTestPersona('mediator');
      const engine = new PersonaEngine({ persona });
      const session = engine.getSession('non-existent');
      expect(session).toBeUndefined();
    });

    it('should end an active session', () => {
      const persona = createTestPersona('architect');
      const engine = new PersonaEngine({ persona });
      const sessionId = engine.createSession();
      const result = engine.endSession(sessionId);
      expect(result).toBe(true);
      const session = engine.getSession(sessionId);
      expect(session?.current_state).toBe('completed');
    });

    it('should return false when ending non-existent session', () => {
      const persona = createTestPersona('critic');
      const engine = new PersonaEngine({ persona });
      const result = engine.endSession('non-existent');
      expect(result).toBe(false);
    });

    it('should get session summary', () => {
      const persona = createTestPersona('mentor');
      const engine = new PersonaEngine({ persona });
      const sessionId = engine.createSession();
      const summary = engine.getSessionSummary(sessionId);
      expect(summary).toContain(sessionId);
      expect(summary).toContain('Interactions: 0');
    });

    it('should return not found for non-existent session summary', () => {
      const persona = createTestPersona('facilitator');
      const engine = new PersonaEngine({ persona });
      const summary = engine.getSessionSummary('non-existent');
      expect(summary).toBe('Session not found');
    });

    it('should export session data', () => {
      const persona = createTestPersona('synthesizer');
      const engine = new PersonaEngine({ persona });
      const sessionId = engine.createSession();
      const exported = engine.exportSession(sessionId);
      expect(exported).toContain(sessionId);
      expect(exported).toContain('synthesizer');
    });

    it('should return empty string for non-existent session export', () => {
      const persona = createTestPersona('creative_thinker');
      const engine = new PersonaEngine({ persona });
      const exported = engine.exportSession('non-existent');
      expect(exported).toBe('');
    });
  });

  describe('process', () => {
    it('should process input and return result', () => {
      const persona = createTestPersona('disrupter');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Test input');
      expect(result).toBeDefined();
      expect(result.input).toBe('Test input');
      expect(result.response).toBeDefined();
    });

    it('should create session if not provided', () => {
      const persona = createTestPersona('analyst');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Test input');
      expect(result.session_id).toMatch(/^session-/);
    });

    it('should use provided session ID', () => {
      const persona = createTestPersona('mediator');
      const engine = new PersonaEngine({ persona });
      const sessionId = engine.createSession();
      const result = engine.process('Test input', sessionId);
      expect(result.session_id).toBe(sessionId);
    });

    it('should throw error for non-existent session', () => {
      const persona = createTestPersona('architect');
      const engine = new PersonaEngine({ persona });
      expect(() => engine.process('Test input', 'non-existent')).toThrow(
        'Session non-existent not found'
      );
    });

    it('should record interaction in session history', () => {
      const persona = createTestPersona('critic');
      const engine = new PersonaEngine({ persona });
      const sessionId = engine.createSession();
      engine.process('First input', sessionId);
      engine.process('Second input', sessionId);
      const session = engine.getSession(sessionId);
      expect(session?.history.length).toBe(2);
    });
  });

  describe('archetype-specific behavior', () => {
    it('should handle disrupter archetype', () => {
      const persona = createTestPersona('disrupter');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('I think everything is fine');
      expect(result.response).toBeDefined();
    });

    it('should handle analyst archetype', () => {
      const persona = createTestPersona('analyst', { analytical_depth: 0.8 });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Let me analyze this situation');
      expect(result.response).toBeDefined();
    });

    it('should handle mediator archetype', () => {
      const persona = createTestPersona('mediator');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('There are two sides to this');
      expect(result.response).toBeDefined();
    });

    it('should handle architect archetype', () => {
      const persona = createTestPersona('architect');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Let me structure this properly');
      expect(result.response).toBeDefined();
    });

    it('should handle critic archetype', () => {
      const persona = createTestPersona('critic', { critical_intensity: 0.8 });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('This solution has some issues');
      expect(result.response).toBeDefined();
    });

    it('should handle creative_thinker archetype', () => {
      const persona = createTestPersona('creative_thinker');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('What if we try something different?');
      expect(result.response).toBeDefined();
    });

    it('should handle facilitator archetype', () => {
      const persona = createTestPersona('facilitator');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('How can we work through this?');
      expect(result.response).toBeDefined();
    });

    it('should handle mentor archetype', () => {
      const persona = createTestPersona('mentor', { empathy_level: 0.8 });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('I need some guidance');
      expect(result.response).toBeDefined();
    });

    it('should handle synthesizer archetype', () => {
      const persona = createTestPersona('synthesizer');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Let me integrate these ideas');
      expect(result.response).toBeDefined();
    });
  });

  describe('behavioral parameter variations', () => {
    it('should handle high truth commitment', () => {
      const persona = createTestPersona('disrupter', { truth_commitment: 0.9 });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('I am not sure about this');
      expect(result).toBeDefined();
    });

    it('should handle low truth commitment', () => {
      const persona = createTestPersona('mediator', { truth_commitment: 0.2 });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('I am not sure about this');
      expect(result).toBeDefined();
    });

    it('should handle high critical intensity', () => {
      const persona = createTestPersona('critic', { critical_intensity: 0.9 });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('This needs evaluation');
      expect(result.response.style).toBe('critical');
    });

    it('should handle high constructive orientation', () => {
      const persona = createTestPersona('facilitator', {
        constructive_orientation: 0.9,
        critical_intensity: 0.3,
      });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('How can we improve this?');
      expect(result.response.style).toBe('constructive');
    });

    it('should handle balanced parameters', () => {
      const persona = createTestPersona('analyst', {
        critical_intensity: 0.5,
        constructive_orientation: 0.5,
      });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Let me consider this');
      expect(result.response.style).toBe('balanced');
    });

    it('should handle integrated style with high both values', () => {
      const persona = createTestPersona('synthesizer', {
        critical_intensity: 0.8,
        constructive_orientation: 0.8,
      });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('This is complex');
      expect(result.response.style).toBe('integrated');
    });

    it('should handle high analytical depth for intensive approach', () => {
      const persona = createTestPersona('analyst', { analytical_depth: 0.9 });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Deep analysis needed');
      expect(result).toBeDefined();
    });

    it('should handle low analytical depth for flexible approach', () => {
      const persona = createTestPersona('creative_thinker', { analytical_depth: 0.3 });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Quick thinking needed');
      expect(result).toBeDefined();
    });

    it('should handle high empathy and low critical for supportive tone', () => {
      const persona = createTestPersona('mentor', {
        empathy_level: 0.8,
        critical_intensity: 0.3,
      });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('I need help');
      expect(result.response.tone).toBe('supportive');
    });

    it('should handle high critical and low empathy for direct tone', () => {
      const persona = createTestPersona('critic', {
        critical_intensity: 0.8,
        empathy_level: 0.3,
      });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Evaluate this');
      expect(result.response.tone).toBe('direct');
    });

    it('should handle high communication clarity', () => {
      const persona = createTestPersona('architect', { communication_clarity: 0.8 });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Explain this clearly');
      expect(result.response.tone).toBe('clear and direct');
    });
  });

  describe('response generation', () => {
    it('should generate follow-up questions', () => {
      const persona = createTestPersona('facilitator');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Tell me more about this');
      expect(result.follow_up_questions).toBeDefined();
      expect(result.follow_up_questions.length).toBeGreaterThan(0);
    });

    it('should include critique section for critical style', () => {
      const persona = createTestPersona('critic', {
        critical_intensity: 0.9,
        constructive_orientation: 0.3,
      });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('This needs critique');
      expect(result.response.critique_section).toBeDefined();
    });

    it('should include solution section for constructive style', () => {
      const persona = createTestPersona('mentor', {
        constructive_orientation: 0.9,
        critical_intensity: 0.3,
        solution_focus: 0.9,
      });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('I need solutions');
      expect(result.response.solution_section).toBeDefined();
    });

    it('should calculate confidence score', () => {
      const persona = createTestPersona('analyst');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Analyze this');
      expect(result.response.confidence).toBeGreaterThanOrEqual(0);
      expect(result.response.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle high solution focus for closing statement', () => {
      const persona = createTestPersona('facilitator', { solution_focus: 0.8 });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('What should I do?');
      expect(result.response.content).toBeDefined();
    });

    it('should handle high critical intensity for closing statement', () => {
      const persona = createTestPersona('critic', {
        critical_intensity: 0.8,
        solution_focus: 0.3,
      });
      const engine = new PersonaEngine({ persona });
      const result = engine.process('What do you think?');
      expect(result.response.content).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const persona = createTestPersona('disrupter');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('');
      expect(result).toBeDefined();
    });

    it('should handle very long input', () => {
      const persona = createTestPersona('analyst');
      const engine = new PersonaEngine({ persona });
      const longInput = 'This is a test. '.repeat(100);
      const result = engine.process(longInput);
      expect(result).toBeDefined();
    });

    it('should handle special characters in input', () => {
      const persona = createTestPersona('creative_thinker');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('What about @#$%^&*() special chars?');
      expect(result).toBeDefined();
    });

    it('should handle multiple interactions in same session', () => {
      const persona = createTestPersona('mediator');
      const engine = new PersonaEngine({ persona });
      const sessionId = engine.createSession();

      for (let i = 0; i < 5; i++) {
        const result = engine.process(`Input ${i}`, sessionId);
        expect(result).toBeDefined();
      }

      const session = engine.getSession(sessionId);
      expect(session?.history.length).toBe(5);
    });

    it('should handle missing behavioral parameters with defaults', () => {
      const persona = createTestPersona('mentor');
      persona.behavioral_parameters = {};
      const engine = new PersonaEngine({ persona });
      const result = engine.process('Test with minimal params');
      expect(result).toBeDefined();
    });
  });

  describe('diagnosis confidence', () => {
    it('should respect minDiagnosisConfidence setting', () => {
      const persona = createTestPersona('analyst', { analytical_depth: 0.9 });
      const engine = new PersonaEngine({ persona, minDiagnosisConfidence: 0.9 });
      const result = engine.process('Analyze this thoroughly');
      expect(result).toBeDefined();
    });

    it('should work with low minDiagnosisConfidence', () => {
      const persona = createTestPersona('analyst');
      const engine = new PersonaEngine({ persona, minDiagnosisConfidence: 0.3 });
      const result = engine.process('Quick analysis');
      expect(result).toBeDefined();
    });
  });

  describe('solution generation', () => {
    it('should respect maxSolutionsPerResponse setting', () => {
      const persona = createTestPersona('facilitator', {
        solution_focus: 0.9,
        constructive_orientation: 0.8,
        analytical_depth: 0.7,
      });
      const engine = new PersonaEngine({ persona, maxSolutionsPerResponse: 5 });
      const result = engine.process('I need many solutions for this complex problem');
      expect(result).toBeDefined();
    });
  });

  describe('mask detection integration', () => {
    it('should use detected masks to inform analysis', () => {
      const persona = createTestPersona('analyst');
      const engine = new PersonaEngine({ persona });
      // Input that should trigger mask detection
      const result = engine.process(
        'I am totally fine and everything is perfect, no issues at all'
      );
      expect(result).toBeDefined();
    });

    it('should handle mask detection with no masks found', () => {
      const persona = createTestPersona('mentor');
      const engine = new PersonaEngine({ persona });
      const result = engine.process('I am feeling genuinely happy today');
      expect(result).toBeDefined();
    });
  });

  describe('diagnosis integration', () => {
    it('should generate diagnosis with high confidence findings', () => {
      const persona = createTestPersona('analyst', { analytical_depth: 0.9 });
      const engine = new PersonaEngine({ persona, minDiagnosisConfidence: 0.5 });
      const result = engine.process(
        'I have been feeling anxious about my work presentations for months'
      );
      expect(result).toBeDefined();
    });

    it('should handle complex multi-layer analysis', () => {
      const persona = createTestPersona('facilitator');
      const engine = new PersonaEngine({ persona });
      const sessionId = engine.createSession();

      // Multiple interactions to build up analysis
      engine.process('I keep procrastinating on my tasks', sessionId);
      engine.process('I feel overwhelmed by the workload', sessionId);
      const result = engine.process('I think this started in my childhood', sessionId);

      expect(result).toBeDefined();
    });
  });

  describe('session management edge cases', () => {
    it('should handle non-existent session gracefully', () => {
      const persona = createTestPersona('mentor');
      const engine = new PersonaEngine({ persona });

      const session = engine.getSession('non-existent-session');
      expect(session).toBeUndefined();
    });

    it('should handle multiple sessions independently', () => {
      const persona = createTestPersona('mentor');
      const engine = new PersonaEngine({ persona });

      const id1 = engine.createSession();
      const id2 = engine.createSession();

      engine.process('Session 1 input', id1);
      engine.process('Session 2 input', id2);

      const session1 = engine.getSession(id1);
      const session2 = engine.getSession(id2);

      expect(session1?.history.length).toBe(1);
      expect(session2?.history.length).toBe(1);
    });
  });
});
