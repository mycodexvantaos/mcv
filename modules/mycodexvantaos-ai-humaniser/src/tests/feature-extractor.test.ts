/**
 * @fileoverview Tests for Feature Extractor
 */

import { extractFeatures, splitIntoSentences, extractFeaturesBatch } from '../core/feature-extractor';

describe('splitIntoSentences', () => {
  it('should split text on sentence-ending punctuation', () => {
    const text = 'Hello world. How are you? I am fine!';
    const sentences = splitIntoSentences(text);
    expect(sentences).toHaveLength(3);
    expect(sentences[0]).toBe('Hello world.');
    expect(sentences[1]).toBe('How are you?');
    expect(sentences[2]).toBe('I am fine!');
  });

  it('should handle text without sentence-ending punctuation', () => {
    const text = 'Just a single line of text';
    const sentences = splitIntoSentences(text);
    expect(sentences).toHaveLength(1);
    expect(sentences[0]).toBe('Just a single line of text');
  });

  it('should handle empty text', () => {
    const sentences = splitIntoSentences('');
    expect(sentences).toHaveLength(0);
  });

  it('should trim whitespace from sentences', () => {
    const text = 'First sentence.  Second sentence.  ';
    const sentences = splitIntoSentences(text);
    expect(sentences.every((s) => s === s.trim())).toBe(true);
  });
});

describe('extractFeatures', () => {
  it('should return zero features for empty string', () => {
    const features = extractFeatures('');
    expect(features.wordCount).toBe(0);
    expect(features.avgWordLength).toBe(0);
    expect(features.lexicalDiversity).toBe(0);
  });

  it('should compute word count correctly', () => {
    const features = extractFeatures('The quick brown fox jumps over the lazy dog');
    expect(features.wordCount).toBe(9);
  });

  it('should compute average word length correctly', () => {
    const features = extractFeatures('Hi there friend');
    // Hi=2, there=5, friend=6 → avg = 13/3 ≈ 4.333
    expect(features.avgWordLength).toBeGreaterThan(4);
    expect(features.avgWordLength).toBeLessThan(5);
  });

  it('should compute lexical diversity (type-token ratio)', () => {
    // All unique words → diversity close to 1
    const highDiversity = extractFeatures('The quick brown fox jumps over lazy dogs');
    expect(highDiversity.lexicalDiversity).toBeGreaterThan(0.7);

    // Repeated words → lower diversity
    const lowDiversity = extractFeatures('the the the the the');
    expect(lowDiversity.lexicalDiversity).toBeLessThan(0.5);
  });

  it('should compute punctuation density', () => {
    const withPunctuation = extractFeatures('Hello, world! How are you?');
    const withoutPunctuation = extractFeatures('Hello world how are you');
    expect(withPunctuation.punctuationDensity).toBeGreaterThan(withoutPunctuation.punctuationDensity);
  });

  it('should detect transition word usage', () => {
    const withTransitions = extractFeatures(
      'Furthermore, the results demonstrate that the approach is effective. Consequently, we recommend adoption.'
    );
    const withoutTransitions = extractFeatures(
      'The results show the approach works. We think you should use it.'
    );
    expect(withTransitions.transitionSmoothness).toBeGreaterThan(withoutTransitions.transitionSmoothness);
  });

  it('should compute perplexity proxy', () => {
    const features = extractFeatures('This is a simple test sentence with various words');
    expect(features.perplexityProxy).toBeGreaterThanOrEqual(0);
  });

  it('should compute vocabulary richness', () => {
    // Text with many uncommon/long words
    const richVocab = extractFeatures(
      'The extraordinary phenomenon demonstrates remarkable characteristics throughout unprecedented circumstances'
    );
    // Text with only common words
    const poorVocab = extractFeatures('The thing is a good way to do the work');
    expect(richVocab.vocabularyRichness).toBeGreaterThan(poorVocab.vocabularyRichness);
  });

  it('should compute all feature fields', () => {
    const features = extractFeatures('This is a test sentence for feature extraction.');
    const requiredFields = [
      'avgWordLength', 'wordCount', 'lexicalDiversity', 'avgWordFrequency',
      'punctuationDensity', 'complexity', 'repetitionScore', 'perplexityProxy',
      'transitionSmoothness', 'vocabularyRichness',
    ];
    for (const field of requiredFields) {
      expect(features).toHaveProperty(field);
      expect(typeof (features as Record<string, unknown>)[field]).toBe('number');
    }
  });
});

describe('extractFeaturesBatch', () => {
  it('should extract features for multiple sentences', () => {
    const sentences = [
      'This is the first sentence.',
      'Here is another one.',
      'And a third for good measure.',
    ];
    const features = extractFeaturesBatch(sentences);
    expect(features).toHaveLength(3);
    features.forEach((f) => {
      expect(f.wordCount).toBeGreaterThan(0);
    });
  });
});
