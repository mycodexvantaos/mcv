/**
 * @fileoverview Tests for Humaniser Rewriter
 */

import { humaniseNative } from '../core/rewriter';
import { detectNative } from '../core/detector';
import { ContentLabel, RewriteStyle } from '../types';
import type { HumaniserRequest } from '../types';

describe('humaniseNative', () => {
  let detectionResult: Awaited<ReturnType<typeof detectNative>>;

  beforeAll(async () => {
    // Use AI-typical text so there are sentences to rewrite
    const text =
      'Furthermore, it is important to note that the implementation of this strategy facilitates optimal outcomes. Consequently, stakeholders should leverage these methodologies to maximize efficiency.';
    detectionResult = await detectNative(text);
  });

  it('should return a valid HumaniserResult structure', async () => {
    const request: HumaniserRequest = {
      originalText: 'Test text.',
      detectionResult,
      style: RewriteStyle.NEUTRAL,
    };
    const result = await humaniseNative(request);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('humanisedText');
    expect(result).toHaveProperty('sentenceRewrites');
    expect(result).toHaveProperty('changeSummary');
    expect(result).toHaveProperty('updatedDetection');
    expect(result).toHaveProperty('comparison');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('providerSource');
    expect(result).toHaveProperty('processingTimeMs');
  });

  it('should rewrite with NEUTRAL style (remove AI patterns)', async () => {
    const request: HumaniserRequest = {
      originalText: 'Furthermore, it is important to leverage these capabilities.',
      detectionResult,
      style: RewriteStyle.NEUTRAL,
    };
    const result = await humaniseNative(request);
    expect(result.humanisedText).toBeDefined();
    expect(result.sentenceRewrites.length).toBeGreaterThan(0);
  });

  it('should rewrite with CONVERSATIONAL style', async () => {
    const request: HumaniserRequest = {
      originalText: 'Furthermore, the results demonstrate the efficacy of the approach.',
      detectionResult,
      style: RewriteStyle.CONVERSATIONAL,
    };
    const result = await humaniseNative(request);
    expect(result.humanisedText).toBeDefined();
    // Conversational rewrite should replace "Furthermore" with "Plus"
    const rewriteWithChange = result.sentenceRewrites.find((r) => r.changes.length > 0);
    if (rewriteWithChange) {
      expect(rewriteWithChange.changes.some((c) => c.includes('formal'))).toBe(true);
    }
  });

  it('should rewrite with PROFESSIONAL style', async () => {
    const request: HumaniserRequest = {
      originalText: 'There are a lot of really big things to consider.',
      detectionResult,
      style: RewriteStyle.PROFESSIONAL,
    };
    const result = await humaniseNative(request);
    expect(result.humanisedText).toBeDefined();
  });

  it('should provide side-by-side comparison', async () => {
    const request: HumaniserRequest = {
      originalText: 'Test text for comparison.',
      detectionResult,
      style: RewriteStyle.NEUTRAL,
    };
    const result = await humaniseNative(request);
    expect(result.comparison).toHaveProperty('originalHighlighted');
    expect(result.comparison).toHaveProperty('humanisedHighlighted');
    expect(result.comparison).toHaveProperty('diffs');
    expect(result.comparison.originalHighlighted.length).toBeGreaterThan(0);
  });

  it('should compute change summary correctly', async () => {
    const request: HumaniserRequest = {
      originalText: 'Furthermore, this is important.',
      detectionResult,
      style: RewriteStyle.NEUTRAL,
    };
    const result = await humaniseNative(request);
    const { changeSummary } = result;
    expect(changeSummary).toHaveProperty('sentencesRewritten');
    expect(changeSummary).toHaveProperty('sentencesUnchanged');
    expect(changeSummary).toHaveProperty('avgScoreImprovement');
    expect(changeSummary).toHaveProperty('overallScoreChange');
    expect(changeSummary).toHaveProperty('changeCategories');
    expect(changeSummary.sentencesRewritten + changeSummary.sentencesUnchanged).toBe(
      result.sentenceRewrites.length
    );
  });

  it('should only rewrite targeted sentences when targetSentenceIndices is provided', async () => {
    const request: HumaniserRequest = {
      originalText: 'First sentence. Second sentence. Third sentence.',
      detectionResult,
      targetSentenceIndices: [0],
      style: RewriteStyle.NEUTRAL,
    };
    const result = await humaniseNative(request);
    // Only sentence 0 should potentially have changes
    const unchanged = result.sentenceRewrites.filter(
      (r) => r.index !== 0 && r.changes.length === 0
    );
    expect(unchanged.length).toBeGreaterThan(0);
  });

  it('should have providerSource as native', async () => {
    const request: HumaniserRequest = {
      originalText: 'Test.',
      detectionResult,
    };
    const result = await humaniseNative(request);
    expect(result.providerSource).toBe('native');
  });

  it('should produce valid diff segments', async () => {
    const request: HumaniserRequest = {
      originalText: 'Furthermore, this leverages synergies. Additionally, it facilitates outcomes.',
      detectionResult,
      style: RewriteStyle.NEUTRAL,
    };
    const result = await humaniseNative(request);
    result.comparison.diffs.forEach((diff) => {
      expect(['added', 'removed', 'unchanged']).toContain(diff.type);
      expect(diff).toHaveProperty('index');
    });
  });
});
