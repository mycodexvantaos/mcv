/**
 * @fileoverview Tests for Humaniser Engine
 */

import { HumaniserEngine } from '../core/engine';
import { ContentLabel, RewriteStyle } from '../types';
import type { HumaniserConfig } from '../types';

const defaultConfig: HumaniserConfig = {
  mode: 'native',
  detectionThreshold: 0.65,
  minSentenceLength: 3,
  nativeOnly: true,
  defaultStyle: RewriteStyle.NEUTRAL,
  preserveTechnicalTerms: true,
  defaultFormality: 'semi-formal' as any,
  cacheTtlSeconds: 300,
  maxTextLength: 50000,
};

describe('HumaniserEngine', () => {
  let engine: HumaniserEngine;

  beforeEach(() => {
    engine = new HumaniserEngine(defaultConfig);
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('detect', () => {
    it('should return a DetectionResult for text input', async () => {
      const result = await engine.detect('This is a test sentence for detection.');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('sentences');
      expect(result.sentences.length).toBeGreaterThan(0);
    });

    it('should use native provider by default', async () => {
      const result = await engine.detect('Native detection test.');
      expect(result.providerSource).toBe('native');
    });
  });

  describe('humanise', () => {
    it('should return a HumaniserResult', async () => {
      const detection = await engine.detect(
        'Furthermore, it is important to leverage these capabilities. Consequently, the utilization of best practices facilitates outcomes.'
      );
      const result = await engine.humanise({
        originalText: 'Furthermore, it is important to leverage these capabilities.',
        detectionResult: detection,
        style: RewriteStyle.NEUTRAL,
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('humanisedText');
      expect(result).toHaveProperty('sentenceRewrites');
      expect(result).toHaveProperty('changeSummary');
    });
  });

  describe('detectAndHumanise', () => {
    it('should detect and then humanise in one call', async () => {
      const result = await engine.detectAndHumanise(
        'Furthermore, this facilitates optimal outcomes. Additionally, stakeholders should leverage synergies.'
      );
      expect(result.detection).toHaveProperty('label');
      expect(result.humanisation).toHaveProperty('humanisedText');
    });
  });

  describe('healthCheck', () => {
    it('should return true for native engine', async () => {
      const healthy = await engine.healthCheck();
      expect(healthy).toBe(true);
    });
  });

  describe('getRuntimeMode', () => {
    it('should return native mode when configured', () => {
      expect(engine.getRuntimeMode()).toBe('native');
    });

    it('should resolve auto mode based on available providers', () => {
      const autoEngine = new HumaniserEngine({ ...defaultConfig, mode: 'auto' });
      expect(autoEngine.getRuntimeMode()).toBe('native'); // auto resolves to native when no external
      autoEngine.shutdown();
    });
  });

  describe('getConfig', () => {
    it('should return the engine configuration', () => {
      const config = engine.getConfig();
      expect(config.mode).toBe('native');
      expect(config.detectionThreshold).toBe(0.65);
    });
  });
});
