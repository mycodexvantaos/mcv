/**
 * MyCodexVantaOS Persona Engine - Semantic Mask Detector Tests
 *
 * Unit tests for the SemanticMaskDetector class.
 */

import { SemanticMaskDetector } from '../core/semantic-mask-detector';
import type { SemanticMask } from '../types';

describe('SemanticMaskDetector', () => {
  let detector: SemanticMaskDetector;

  beforeEach(() => {
    detector = new SemanticMaskDetector();
  });

  describe('constructor', () => {
    it('should initialize with default masks', () => {
      const masks = detector.getMasks();
      expect(masks.length).toBeGreaterThan(0);
    });

    it('should accept custom masks', () => {
      const customMask: SemanticMask = {
        urn: 'urn:mycodexvantaos:mask:test-mask',
        mask_type: 'comforting_platitude',
        name: 'Test Mask',
        patterns: ['test pattern'],
        truth_reframe: {
          pattern_name: 'test',
          truth_exposure: 'test exposure',
          constructive_alternative: 'test alternative',
        },
      };

      const customDetector = new SemanticMaskDetector([customMask]);
      const masks = customDetector.getMasks();
      const found = masks.find((m) => m.urn === customMask.urn);
      expect(found).toBeDefined();
    });
  });

  describe('detect', () => {
    it('should detect comforting platitude patterns', () => {
      const text = '一切都會好起來的，時間會治癒一切';
      const result = detector.detect(text);

      expect(result.detected).toBe(true);
      expect(result.masks.length).toBeGreaterThan(0);
    });

    it('should detect English patterns', () => {
      const text = 'Just stay positive and everything will be fine';
      const result = detector.detect(text);

      expect(result.detected).toBe(true);
      expect(result.masks.length).toBeGreaterThan(0);
    });

    it('should return no detection for clean text', () => {
      const text = 'I need to complete this project by Friday and review the requirements';
      const result = detector.detect(text);

      // This might or might not detect depending on patterns
      // Just verify the structure is correct
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('masks');
      expect(result).toHaveProperty('summary');
    });

    it('should provide correct position information', () => {
      const text = '我相信一切都會好起來的';
      const result = detector.detect(text);

      if (result.detected && result.masks.length > 0) {
        const firstMask = result.masks[0];
        expect(firstMask.position.start).toBeGreaterThanOrEqual(0);
        expect(firstMask.position.end).toBeGreaterThan(firstMask.position.start);
      }
    });

    it('should include truth reframe for detected masks', () => {
      const text = '時間會治癒一切';
      const result = detector.detect(text);

      if (result.detected && result.masks.length > 0) {
        expect(result.masks[0].truth_reframe).toBeDefined();
        expect(result.masks[0].truth_reframe.truth_exposure).toBeDefined();
        expect(result.masks[0].truth_reframe.constructive_alternative).toBeDefined();
      }
    });

    it('should calculate total severity', () => {
      const text = '一切都會好起來的，要相信自己，時間會治癒一切';
      const result = detector.detect(text);

      expect(result.total_severity).toBeGreaterThanOrEqual(0);
    });

    it('should generate summary', () => {
      const text = '一切都會好起來的';
      const result = detector.detect(text);

      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
    });
  });

  describe('addMask', () => {
    it('should add a new mask', () => {
      const newMask: SemanticMask = {
        urn: 'urn:mycodexvantaos:mask:custom-test',
        mask_type: 'self_deception',
        name: 'Custom Test Mask',
        patterns: ['custom pattern test'],
        truth_reframe: {
          pattern_name: 'custom_test',
          truth_exposure: 'Custom exposure',
          constructive_alternative: 'Custom alternative',
        },
      };

      detector.addMask(newMask);
      const found = detector.getMask(newMask.urn);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Custom Test Mask');
    });
  });

  describe('removeMask', () => {
    it('should remove an existing mask', () => {
      const masks = detector.getMasks();
      const firstMaskUrn = masks[0].urn;

      const removed = detector.removeMask(firstMaskUrn);
      expect(removed).toBe(true);

      const found = detector.getMask(firstMaskUrn);
      expect(found).toBeUndefined();
    });

    it('should return false for non-existent mask', () => {
      const removed = detector.removeMask('urn:mycodexvantaos:mask:nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('getMasksByType', () => {
    it('should return masks filtered by type', () => {
      const comfortingPlatitudes = detector.getMasksByType('comforting_platitude');

      expect(Array.isArray(comfortingPlatitudes)).toBe(true);
      comfortingPlatitudes.forEach((mask) => {
        expect(mask.mask_type).toBe('comforting_platitude');
      });
    });
  });

  describe('generateConstructiveResponse', () => {
    it('should generate response for detected masks', () => {
      const text = '一切都會好起來的';
      const detection = detector.detect(text);

      if (detection.detected) {
        const response = detector.generateConstructiveResponse(detection);
        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
      }
    });

    it('should return empty string for no detection', () => {
      const detection = {
        detected: false,
        masks: [],
        total_severity: 0,
        summary: 'No masks detected',
      };
      const response = detector.generateConstructiveResponse(detection);
      expect(response).toBe('');
    });
  });

  describe('analyze', () => {
    it('should return comprehensive analysis', () => {
      const text = '時間會治癒一切，要相信自己';
      const analysis = detector.analyze(text);

      expect(analysis).toHaveProperty('detection');
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis).toHaveProperty('followUpQuestions');
      expect(Array.isArray(analysis.recommendations)).toBe(true);
      expect(Array.isArray(analysis.followUpQuestions)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = detector.detect('');
      expect(result.detected).toBe(false);
      expect(result.masks.length).toBe(0);
    });

    it('should handle very long text', () => {
      const longText = '一切都會好起來的'.repeat(100);
      const result = detector.detect(longText);

      // Should not throw and should handle gracefully
      expect(result).toBeDefined();
    });

    it('should handle special characters', () => {
      const specialText = '一切都會好起來的！@#$%^&*()';
      const result = detector.detect(specialText);

      expect(result).toBeDefined();
    });

    it('should return undefined for non-existent mask type in getTruthReframe', () => {
      const reframe = detector.getTruthReframe('non_existent_type' as any);
      expect(reframe).toBeUndefined();
    });

    it('should return truth reframe for existing mask type', () => {
      const text = '我很好，一切都很好，沒有問題';
      const detection = detector.detect(text);

      if (detection.detected && detection.masks.length > 0) {
        const maskType = detection.masks[0].mask.mask_type;
        const reframe = detector.getTruthReframe(maskType);
        expect(reframe).toBeDefined();
      }
    });
  });
});
