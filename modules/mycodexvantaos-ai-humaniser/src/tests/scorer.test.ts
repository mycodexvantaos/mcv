/**
 * @fileoverview Tests for Score Calculator
 */

import {
  computeWeightedAiScore,
  computeImprovement,
  computeNaturalnessScore,
  computeGrade,
  generateReport,
} from '../core/scorer';
import { ContentLabel } from '../types';
import type { DetectionResult, SentenceAnalysis } from '../types';

// Helper: create a minimal SentenceAnalysis
function makeSentence(overrides: Partial<SentenceAnalysis> = {}): SentenceAnalysis {
  return {
    text: 'Test sentence.',
    index: 0,
    label: ContentLabel.HUMAN,
    confidence: 0.8,
    aiScore: 0.2,
    humanScore: 0.8,
    features: {
      avgWordLength: 4.0,
      wordCount: 5,
      lexicalDiversity: 0.7,
      avgWordFrequency: 0.4,
      punctuationDensity: 0.05,
      complexity: 0.1,
      repetitionScore: 0.05,
      perplexityProxy: 1.2,
      transitionSmoothness: 0.1,
      vocabularyRichness: 0.2,
    },
    explanation: 'Test explanation',
    ...overrides,
  };
}

// Helper: create a minimal DetectionResult
function makeDetectionResult(overrides: Partial<DetectionResult> = {}): DetectionResult {
  return {
    id: 'test-id',
    label: ContentLabel.HUMAN,
    confidence: 0.8,
    aiScore: 0.2,
    humanScore: 0.8,
    sentences: [makeSentence()],
    stats: {
      totalSentences: 1,
      aiSentences: 0,
      humanSentences: 1,
      uncertainSentences: 0,
      avgConfidence: 0.8,
      maxAiScore: 0.2,
      minAiScore: 0.2,
      stdDevAiScore: 0,
    },
    explanation: 'Test',
    timestamp: new Date().toISOString(),
    providerSource: 'native',
    processingTimeMs: 10,
    ...overrides,
  };
}

describe('computeWeightedAiScore', () => {
  it('should return 0.5 for empty sentences array', () => {
    expect(computeWeightedAiScore([])).toBe(0.5);
  });

  it('should compute weighted score for single sentence', () => {
    const sentences = [makeSentence({ aiScore: 0.7 })];
    const score = computeWeightedAiScore(sentences);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should weight first sentence more heavily', () => {
    const sentences = [
      makeSentence({
        index: 0,
        aiScore: 0.9,
        features: { ...makeSentence().features, wordCount: 15 },
      }),
      makeSentence({
        index: 1,
        aiScore: 0.1,
        features: { ...makeSentence().features, wordCount: 5 },
      }),
    ];
    const weightedScore = computeWeightedAiScore(sentences);
    const simpleAvg = (0.9 + 0.1) / 2;
    // First sentence weighted more → weighted score > simple average
    expect(weightedScore).toBeGreaterThan(simpleAvg);
  });
});

describe('computeImprovement', () => {
  it('should compute positive improvement when AI score decreases', () => {
    const original = makeDetectionResult({ aiScore: 0.8 });
    const humanised = makeDetectionResult({ aiScore: 0.3 });
    const improvement = computeImprovement(original, humanised);
    expect(improvement).toBeCloseTo(0.5, 1);
  });

  it('should return 0 when AI score increases', () => {
    const original = makeDetectionResult({ aiScore: 0.3 });
    const humanised = makeDetectionResult({ aiScore: 0.8 });
    const improvement = computeImprovement(original, humanised);
    expect(improvement).toBe(0);
  });

  it('should return 0 when scores are equal', () => {
    const original = makeDetectionResult({ aiScore: 0.5 });
    const humanised = makeDetectionResult({ aiScore: 0.5 });
    expect(computeImprovement(original, humanised)).toBe(0);
  });
});

describe('computeNaturalnessScore', () => {
  it('should return higher naturalness for human-labelled content', () => {
    const humanResult = makeDetectionResult({
      label: ContentLabel.HUMAN,
      aiScore: 0.15,
      humanScore: 0.85,
      stats: {
        totalSentences: 5,
        aiSentences: 0,
        humanSentences: 5,
        uncertainSentences: 0,
        avgConfidence: 0.9,
        maxAiScore: 0.2,
        minAiScore: 0.05,
        stdDevAiScore: 0.05,
      },
    });
    const aiResult = makeDetectionResult({
      label: ContentLabel.AI,
      aiScore: 0.85,
      humanScore: 0.15,
      stats: {
        totalSentences: 5,
        aiSentences: 5,
        humanSentences: 0,
        uncertainSentences: 0,
        avgConfidence: 0.9,
        maxAiScore: 0.95,
        minAiScore: 0.7,
        stdDevAiScore: 0.1,
      },
    });
    expect(computeNaturalnessScore(humanResult)).toBeGreaterThan(computeNaturalnessScore(aiResult));
  });

  it('should return a value between 0 and 1', () => {
    const result = makeDetectionResult({ aiScore: 0.5, humanScore: 0.5 });
    const score = computeNaturalnessScore(result);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('computeGrade', () => {
  it('should return A+ for very low AI scores', () => {
    expect(computeGrade(0.1)).toBe('A+');
  });

  it('should return D for very high AI scores', () => {
    expect(computeGrade(0.9)).toBe('D');
  });

  it('should return B for moderate AI scores', () => {
    expect(computeGrade(0.55)).toBe('B');
  });

  it('should return progressively worse grades for higher AI scores', () => {
    const grades = [0.1, 0.3, 0.5, 0.7, 0.9].map(computeGrade);
    // Grades should get worse (higher letters = worse)
    const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D'];
    for (let i = 1; i < grades.length; i++) {
      expect(gradeOrder.indexOf(grades[i])).toBeGreaterThanOrEqual(
        gradeOrder.indexOf(grades[i - 1])
      );
    }
  });
});

describe('generateReport', () => {
  it('should generate a complete report', () => {
    const result = makeDetectionResult({
      label: ContentLabel.HUMAN,
      aiScore: 0.2,
      humanScore: 0.8,
      sentences: [
        makeSentence({ index: 0, label: ContentLabel.HUMAN, aiScore: 0.15 }),
        makeSentence({ index: 1, label: ContentLabel.HUMAN, aiScore: 0.25 }),
      ],
      stats: {
        totalSentences: 2,
        aiSentences: 0,
        humanSentences: 2,
        uncertainSentences: 0,
        avgConfidence: 0.85,
        maxAiScore: 0.25,
        minAiScore: 0.15,
        stdDevAiScore: 0.05,
      },
    });
    const report = generateReport(result);
    expect(report).toHaveProperty('grade');
    expect(report).toHaveProperty('naturalness');
    expect(report).toHaveProperty('verdict');
    expect(report).toHaveProperty('aiPercentage');
    expect(report).toHaveProperty('humanPercentage');
    expect(report).toHaveProperty('sentenceBreakdown');
    expect(report).toHaveProperty('topAISentences');
    expect(report).toHaveProperty('recommendations');
  });

  it('should include recommendations for AI-heavy content', () => {
    const result = makeDetectionResult({
      label: ContentLabel.AI,
      aiScore: 0.8,
      humanScore: 0.2,
      stats: {
        totalSentences: 5,
        aiSentences: 4,
        humanSentences: 1,
        uncertainSentences: 0,
        avgConfidence: 0.85,
        maxAiScore: 0.95,
        minAiScore: 0.6,
        stdDevAiScore: 0.12,
      },
    });
    const report = generateReport(result);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('should recommend no changes for natural human text', () => {
    const result = makeDetectionResult({
      label: ContentLabel.HUMAN,
      aiScore: 0.1,
      humanScore: 0.9,
      sentences: [makeSentence({ label: ContentLabel.HUMAN, aiScore: 0.1 })],
      stats: {
        totalSentences: 1,
        aiSentences: 0,
        humanSentences: 1,
        uncertainSentences: 0,
        avgConfidence: 0.9,
        maxAiScore: 0.1,
        minAiScore: 0.1,
        stdDevAiScore: 0,
      },
    });
    const report = generateReport(result);
    expect(report.recommendations).toContain(
      'The text appears natural. No significant changes recommended.'
    );
  });
});
