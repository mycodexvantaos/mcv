/**
 * @fileoverview Tests for Native AI Content Detector
 */

import { detectNative } from '../core/detector';
import { ContentLabel } from '../types';

describe('detectNative', () => {
  it('should classify clearly human-like text as HUMAN', async () => {
    const text =
      "I went to the store yesterday and ran into my old friend from college. We hadn't seen each other in ages, so we grabbed coffee and caught up on everything. It was really nice.";
    const result = await detectNative(text);
    expect(result.label).toBe(ContentLabel.HUMAN);
    expect(result.sentences.length).toBeGreaterThan(0);
    expect(result.humanScore).toBeGreaterThan(result.aiScore);
  });

  it('should classify AI-typical text with higher AI scores', async () => {
    const text =
      'Furthermore, it is important to note that the implementation of this strategy facilitates optimal outcomes. Consequently, stakeholders should leverage these methodologies to maximize efficiency. Additionally, the utilization of best practices ensures comprehensive coverage of all relevant parameters.';
    const result = await detectNative(text);
    expect(result.aiScore).toBeGreaterThan(0.4);
    expect(result.sentences.length).toBeGreaterThan(0);
  });

  it('should return a valid DetectionResult structure', async () => {
    const text = 'This is a simple test. It has two sentences.';
    const result = await detectNative(text);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('label');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('aiScore');
    expect(result).toHaveProperty('humanScore');
    expect(result).toHaveProperty('sentences');
    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('explanation');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('providerSource');
    expect(result).toHaveProperty('processingTimeMs');
  });

  it('should have aiScore + humanScore approximately equal to 1', async () => {
    const text = 'The quick brown fox jumps over the lazy dog. However, the dog was not impressed.';
    const result = await detectNative(text);
    expect(result.aiScore + result.humanScore).toBeCloseTo(1, 1);
  });

  it('should analyze each sentence individually', async () => {
    const text = 'First sentence here. Second sentence there. Third sentence everywhere.';
    const result = await detectNative(text);
    expect(result.sentences.length).toBe(3);
    result.sentences.forEach((s) => {
      expect(s).toHaveProperty('text');
      expect(s).toHaveProperty('index');
      expect(s).toHaveProperty('label');
      expect(s).toHaveProperty('confidence');
      expect(s).toHaveProperty('aiScore');
      expect(s).toHaveProperty('humanScore');
      expect(s).toHaveProperty('features');
      expect(s).toHaveProperty('explanation');
    });
  });

  it('should compute valid stats', async () => {
    const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
    const result = await detectNative(text);
    expect(result.stats.totalSentences).toBe(4);
    expect(
      result.stats.aiSentences + result.stats.humanSentences + result.stats.uncertainSentences
    ).toBe(result.stats.totalSentences);
    expect(result.stats.avgConfidence).toBeGreaterThan(0);
    expect(result.stats.maxAiScore).toBeGreaterThanOrEqual(result.stats.minAiScore);
  });

  it('should have providerSource as native', async () => {
    const result = await detectNative('Some text to analyze.');
    expect(result.providerSource).toBe('native');
  });

  it('should record processing time', async () => {
    const result = await detectNative('A sentence for timing.');
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('should produce a non-empty explanation', async () => {
    const result = await detectNative('This is a test sentence for explanation.');
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it('should handle single-sentence text', async () => {
    const result = await detectNative('Just one sentence here.');
    expect(result.sentences).toHaveLength(1);
    expect(result.stats.totalSentences).toBe(1);
  });

  it('should generate valid UUIDs for result id', async () => {
    const result = await detectNative('Test sentence for ID generation.');
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});
