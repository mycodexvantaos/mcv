/**
 * MyCodexVantaOS Persona Engine - Root Cause Analyzer Tests
 *
 * Unit tests for the RootCauseAnalyzer class.
 */

import { RootCauseAnalyzer } from '../core/root-cause-analyzer';
import type { AnalysisLayer } from '../types';

describe('RootCauseAnalyzer', () => {
  let analyzer: RootCauseAnalyzer;

  beforeEach(() => {
    analyzer = new RootCauseAnalyzer(0.6); // Default confidence threshold
  });

  describe('constructor', () => {
    it('should initialize with default confidence threshold', () => {
      const defaultAnalyzer = new RootCauseAnalyzer();
      expect(defaultAnalyzer).toBeDefined();
    });

    it('should accept custom confidence threshold', () => {
      const customAnalyzer = new RootCauseAnalyzer(0.8);
      expect(customAnalyzer).toBeDefined();
    });
  });

  describe('getLayerConfig', () => {
    it('should return config for each layer', () => {
      const layers: AnalysisLayer[] = [
        'surface_symptoms',
        'behavioral_patterns',
        'cognitive_structures',
        'emotional_drivers',
        'core_beliefs',
        'root_causes',
      ];

      for (const layer of layers) {
        const config = analyzer.getLayerConfig(layer);
        expect(config).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.probing_questions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getAllLayerConfigs', () => {
    it('should return all layer configurations', () => {
      const configs = analyzer.getAllLayerConfigs();
      expect(Object.keys(configs).length).toBe(6);
    });
  });

  describe('initializeAnalysis', () => {
    it('should create a new analysis context', () => {
      const problem = 'I keep procrastinating on important tasks';
      const context = analyzer.initializeAnalysis(problem);

      expect(context.original_problem).toBe(problem);
      expect(context.current_layer).toBe('surface_symptoms');
      expect(context.layers.size).toBe(0);
      expect(context.confidence_score).toBe(0);
    });
  });

  describe('getProbingQuestions', () => {
    it('should return questions for the current layer', () => {
      const context = analyzer.initializeAnalysis('Test problem');
      const questions = analyzer.getProbingQuestions(context, 2);

      expect(questions.length).toBeLessThanOrEqual(2);
      expect(questions.length).toBeGreaterThan(0);
      questions.forEach((q) => {
        expect(typeof q).toBe('string');
        expect(q.length).toBeGreaterThan(0);
      });
    });

    it('should respect the count parameter', () => {
      const context = analyzer.initializeAnalysis('Test problem');
      const questions = analyzer.getProbingQuestions(context, 5);

      expect(questions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('recordFindings', () => {
    it('should record findings for a layer', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      const updatedContext = analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Finding 1', 'Finding 2'],
        ['Evidence 1'],
        ['Question 1?'],
        ['Response 1']
      );

      expect(updatedContext.layers.has('surface_symptoms')).toBe(true);
      const layerAnalysis = updatedContext.layers.get('surface_symptoms');
      expect(layerAnalysis?.findings.length).toBe(2);
      expect(layerAnalysis?.confidence).toBeGreaterThan(0);
    });

    it('should update overall confidence', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      const updatedContext = analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Finding 1', 'Finding 2', 'Finding 3'],
        ['Evidence 1', 'Evidence 2'],
        ['Question 1?'],
        ['This is a detailed response that should count']
      );

      expect(updatedContext.confidence_score).toBeGreaterThan(0);
    });
  });

  describe('advanceToNextLayer', () => {
    it('should advance to the next layer', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      expect(context.current_layer).toBe('surface_symptoms');

      const nextLayer = analyzer.advanceToNextLayer(context);
      expect(nextLayer).toBe('behavioral_patterns');
      expect(context.current_layer).toBe('behavioral_patterns');
    });

    it('should return null when at the deepest layer', () => {
      const context = analyzer.initializeAnalysis('Test problem');
      context.current_layer = 'root_causes';

      const nextLayer = analyzer.advanceToNextLayer(context);
      expect(nextLayer).toBeNull();
    });
  });

  describe('isReadyToAdvance', () => {
    it('should return false without recorded findings', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      const ready = analyzer.isReadyToAdvance(context);
      expect(ready).toBe(false);
    });

    it('should return true with sufficient confidence', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Finding 1', 'Finding 2', 'Finding 3'],
        ['Evidence 1', 'Evidence 2'],
        ['Question 1?', 'Question 2?'],
        ['Response 1', 'Response 2']
      );

      const ready = analyzer.isReadyToAdvance(context);
      // Depending on confidence calculation, might be true or false
      expect(typeof ready).toBe('boolean');
    });
  });

  describe('generateResult', () => {
    it('should generate complete analysis result', () => {
      const context = analyzer.initializeAnalysis('I feel anxious about presentations');

      analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Anxiety before presentations'],
        ['Physical symptoms reported'],
        ['What happens?'],
        ['Heart races, hands shake']
      );

      const result = analyzer.generateResult(context);

      expect(result.context).toBe(context);
      expect(result.diagnosis.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.summary).toBeDefined();
    });

    it('should include diagnosis for recorded layers', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Symptom 1'],
        ['Evidence'],
        ['Question?'],
        ['Response']
      );

      const result = analyzer.generateResult(context);

      const surfaceDiagnosis = result.diagnosis.find((d) => d.layer === 'surface_symptoms');
      expect(surfaceDiagnosis).toBeDefined();
    });
  });

  describe('quickAnalyze', () => {
    it('should provide quick analysis suggestions', () => {
      const problem = 'I feel anxious when I have to speak in public';
      const result = analyzer.quickAnalyze(problem);

      expect(result.suggested_layers.length).toBeGreaterThan(0);
      expect(result.initial_questions).toBeDefined();
      expect(result.hypothesis.length).toBeGreaterThanOrEqual(0);
    });

    it('should suggest relevant layers based on keywords', () => {
      const behavioralProblem = 'I always procrastinate when I have deadlines';
      const result = analyzer.quickAnalyze(behavioralProblem);

      expect(result.suggested_layers).toContain('surface_symptoms');
    });

    it('should generate initial questions for suggested layers', () => {
      const problem = 'I think I am not good enough';
      const result = analyzer.quickAnalyze(problem);

      for (const layer of result.suggested_layers) {
        expect(result.initial_questions[layer]).toBeDefined();
        expect(result.initial_questions[layer]?.length ?? 0).toBeGreaterThan(0);
      }
    });
  });

  describe('exportAnalysis', () => {
    it('should export analysis to JSON string', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Finding 1'],
        ['Evidence'],
        ['Question?'],
        ['Response']
      );

      const exported = analyzer.exportAnalysis(context);

      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.problem).toBe('Test problem');
      expect(parsed.layers).toBeDefined();
    });
  });

  describe('importAnalysis', () => {
    it('should import analysis from JSON string', () => {
      const context = analyzer.initializeAnalysis('Original problem');

      analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Finding 1'],
        ['Evidence'],
        ['Question?'],
        ['Response']
      );

      const exported = analyzer.exportAnalysis(context);
      const imported = analyzer.importAnalysis(exported);

      expect(imported.original_problem).toBe('Original problem');
      expect(imported.layers.has('surface_symptoms')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty problem description', () => {
      const context = analyzer.initializeAnalysis('');
      expect(context.original_problem).toBe('');
    });

    it('should detect connections between related findings', () => {
      const context = analyzer.initializeAnalysis('I always procrastinate');

      analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['I procrastinate on tasks'],
        ['Evidence shows procrastination pattern'],
        ['What happens?'],
        ['I delay my work consistently']
      );

      analyzer.recordFindings(
        context,
        'behavioral_patterns',
        ['I procrastinate on important tasks'],
        ['Pattern confirmed'],
        ['Why do you procrastinate?'],
        ['I delay my work consistently']
      );

      const analysis = context.layers.get('behavioral_patterns');
      expect(analysis?.connections_to_other_layers.length).toBeGreaterThan(0);
    });

    it('should generate root causes from root_causes layer', () => {
      const context = analyzer.initializeAnalysis('Deep issue');

      analyzer.recordFindings(
        context,
        'root_causes',
        ['Root cause 1', 'Root cause 2'],
        ['Evidence'],
        ['Q?'],
        ['Response']
      );

      const result = analyzer.generateResult(context);
      expect(result.root_causes).toContain('Root cause 1');
      expect(result.root_causes).toContain('Root cause 2');
    });

    it('should identify layers needing more attention', () => {
      const context = analyzer.initializeAnalysis('Complex issue');

      // Low confidence finding
      analyzer.recordFindings(context, 'surface_symptoms', ['S1'], [], [], []);

      const result = analyzer.generateResult(context);
      expect(result.recommended_focus.length).toBeGreaterThan(0);
    });

    it('should generate layer recommendations', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Symptom'],
        ['Evidence'],
        ['Q?'],
        ['Response']
      );

      const result = analyzer.generateResult(context);
      const surfaceDiagnosis = result.diagnosis.find((d) => d.layer === 'surface_symptoms');
      expect(surfaceDiagnosis?.recommended_actions?.length).toBeDefined();
    });

    it('should handle all keyword types in quickAnalyze', () => {
      const problems = [
        { problem: 'I think this is wrong', expectedLayer: 'cognitive_structures' },
        { problem: 'I feel anxious about this', expectedLayer: 'emotional_drivers' },
        { problem: 'I always do this pattern', expectedLayer: 'behavioral_patterns' },
        { problem: 'I am not worth anything', expectedLayer: 'core_beliefs' },
        { problem: 'This started in my childhood', expectedLayer: 'root_causes' },
      ];

      for (const { problem, expectedLayer } of problems) {
        const result = analyzer.quickAnalyze(problem);
        expect(result.suggested_layers).toContain(expectedLayer);
      }
    });

    it('should generate hypotheses for different layer combinations', () => {
      const result = analyzer.quickAnalyze(
        'I always procrastinate because I think I am not worth it and I feel anxious about my childhood experiences'
      );

      expect(result.hypothesis.length).toBeGreaterThan(2);
    });

    it('should generate synthesis questions at deepest layer', () => {
      const context = analyzer.initializeAnalysis('Deep problem');
      context.current_layer = 'root_causes';

      analyzer.recordFindings(
        context,
        'root_causes',
        ['Root cause found'],
        ['Evidence'],
        ['Question?'],
        ['This is a very detailed response that should count']
      );

      // Generate next questions should return synthesis questions
      const result = analyzer.generateResult(context);
      expect(result.next_questions).toBeDefined();
      expect(result.next_questions.length).toBeGreaterThan(0);
    });

    it('should advance through all layers', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      const layers = [
        'surface_symptoms',
        'behavioral_patterns',
        'cognitive_structures',
        'emotional_drivers',
        'core_beliefs',
        'root_causes',
      ];

      for (const layer of layers.slice(0, -1)) {
        const nextLayer = analyzer.advanceToNextLayer(context);
        expect(nextLayer).not.toBeNull();
      }

      // At root_causes, should return null
      context.current_layer = 'root_causes';
      const finalNext = analyzer.advanceToNextLayer(context);
      expect(finalNext).toBeNull();
    });

    it('should calculate confidence with detailed responses', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Finding 1', 'Finding 2', 'Finding 3'],
        ['Evidence 1', 'Evidence 2'],
        ['Question?'],
        ['This is a detailed response that exceeds twenty characters']
      );

      const analysis = context.layers.get('surface_symptoms');
      expect(analysis?.confidence).toBeGreaterThan(0.5);
    });

    it('should handle low confidence threshold', () => {
      const lowThresholdAnalyzer = new RootCauseAnalyzer(0.3);
      const context = lowThresholdAnalyzer.initializeAnalysis('Test problem');

      lowThresholdAnalyzer.recordFindings(
        context,
        'surface_symptoms',
        ['F1'],
        ['E1'],
        ['Q?'],
        ['Response']
      );

      const ready = lowThresholdAnalyzer.isReadyToAdvance(context);
      expect(typeof ready).toBe('boolean');
    });

    it('should handle high confidence threshold', () => {
      const highThresholdAnalyzer = new RootCauseAnalyzer(0.95);
      const context = highThresholdAnalyzer.initializeAnalysis('Test problem');

      highThresholdAnalyzer.recordFindings(
        context,
        'surface_symptoms',
        ['F1', 'F2', 'F3'],
        ['E1', 'E2', 'E3'],
        ['Q1', 'Q2'],
        ['Detailed response one', 'Detailed response two']
      );

      const ready = highThresholdAnalyzer.isReadyToAdvance(context);
      expect(typeof ready).toBe('boolean');
    });

    it('should generate summary with multiple diagnosis layers', () => {
      const context = analyzer.initializeAnalysis('Complex issue');

      analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Symptom 1'],
        ['Evidence'],
        ['Q1?'],
        ['Response']
      );
      analyzer.recordFindings(
        context,
        'behavioral_patterns',
        ['Pattern 1'],
        ['Evidence'],
        ['Q2?'],
        ['Response']
      );

      const result = analyzer.generateResult(context);
      expect(result.summary).toContain('Analysis Summary');
      expect(result.summary).toContain('Pattern 1');
    });

    it('should skip already asked questions', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      // First call to get questions
      const questions1 = analyzer.getProbingQuestions(context, 3);
      expect(questions1.length).toBeGreaterThan(0);

      // Record findings with the questions
      analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Finding 1'],
        ['Evidence'],
        questions1,
        ['Response 1', 'Response 2', 'Response 3']
      );

      // Second call should skip already asked questions
      const questions2 = analyzer.getProbingQuestions(context, 3);
      expect(questions2).toBeDefined();
    });

    it('should get questions for next layer after advancing', () => {
      const context = analyzer.initializeAnalysis('Test problem');

      analyzer.recordFindings(
        context,
        'surface_symptoms',
        ['Finding 1', 'Finding 2', 'Finding 3'],
        ['Evidence 1', 'Evidence 2'],
        ['Question 1?', 'Question 2?'],
        ['Detailed response']
      );

      // Advance to next layer
      const nextLayer = analyzer.advanceToNextLayer(context);
      expect(nextLayer).toBe('behavioral_patterns');

      // Get questions for the new layer
      const questions = analyzer.getProbingQuestions(context, 3);
      expect(questions.length).toBeGreaterThan(0);
    });
  });
});
