/**
 * @fileoverview Score Calculator — Confidence scoring and analytics
 *
 * Provides scoring utilities for computing confidence levels,
 * score improvements, and statistical measures for the Humaniser engine.
 */

import type { DetectionResult, DetectionStats, SentenceAnalysis } from '../types';
import { ContentLabel } from '../types';

/**
 * Compute a weighted AI score considering sentence position and length
 *
 * Earlier sentences and longer sentences carry more weight,
 * reflecting how readers typically assess text origin.
 */
export function computeWeightedAiScore(sentences: SentenceAnalysis[]): number {
  if (sentences.length === 0) return 0.5;

  let totalWeight = 0;
  let weightedSum = 0;

  sentences.forEach((s, index) => {
    // Position weight: first and last sentences carry more weight
    const positionWeight = index === 0 ? 1.3 : index === sentences.length - 1 ? 1.2 : 1.0;

    // Length weight: longer sentences carry more weight
    const lengthWeight = Math.min(s.features.wordCount / 15, 2.0);

    // Confidence weight: more confident classifications carry more weight
    const confidenceWeight = 0.5 + s.confidence * 0.5;

    const weight = positionWeight * lengthWeight * confidenceWeight;
    totalWeight += weight;
    weightedSum += s.aiScore * weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
}

/**
 * Compute the improvement score between original and humanised detection results
 */
export function computeImprovement(original: DetectionResult, humanised: DetectionResult): number {
  return Math.max(0, original.aiScore - humanised.aiScore);
}

/**
 * Compute a "naturalness" score (inverse of AI score, with adjustments)
 */
export function computeNaturalnessScore(result: DetectionResult): number {
  const baseNaturalness = result.humanScore;

  // Bonus for low standard deviation (consistent human-like quality)
  const consistencyBonus = Math.max(0, 0.1 - result.stats.stdDevAiScore) * 0.5;

  // Bonus for having mostly human-flagged sentences
  const humanRatio = result.stats.humanSentences / Math.max(result.stats.totalSentences, 1);
  const humanRatioBonus = humanRatio > 0.7 ? 0.05 : 0;

  return Math.min(1, baseNaturalness + consistencyBonus + humanRatioBonus);
}

/**
 * Generate a letter grade based on the AI score
 */
export function computeGrade(aiScore: number): string {
  if (aiScore < 0.15) return 'A+';
  if (aiScore < 0.25) return 'A';
  if (aiScore < 0.35) return 'A-';
  if (aiScore < 0.45) return 'B+';
  if (aiScore < 0.55) return 'B';
  if (aiScore < 0.65) return 'B-';
  if (aiScore < 0.75) return 'C+';
  if (aiScore < 0.85) return 'C';
  return 'D';
}

/**
 * Generate a summary report from a detection result
 */
export interface DetectionReport {
  grade: string;
  naturalness: number;
  verdict: string;
  aiPercentage: number;
  humanPercentage: number;
  sentenceBreakdown: {
    ai: number;
    human: number;
    mixed: number;
    uncertain: number;
  };
  topAISentences: { index: number; text: string; aiScore: number }[];
  recommendations: string[];
}

/**
 * Generate a comprehensive detection report
 */
export function generateReport(result: DetectionResult): DetectionReport {
  const grade = computeGrade(result.aiScore);
  const naturalness = computeNaturalnessScore(result);

  let verdict: string;
  if (result.label === ContentLabel.AI) {
    verdict = 'This content appears to be primarily AI-generated.';
  } else if (result.label === ContentLabel.HUMAN) {
    verdict = 'This content appears to be primarily human-written.';
  } else if (result.label === ContentLabel.MIXED) {
    verdict = 'This content shows signs of mixed AI and human authorship.';
  } else {
    verdict = 'The origin of this content is uncertain.';
  }

  // Find top AI-flagged sentences
  const topAISentences = [...result.sentences]
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 5)
    .map((s) => ({ index: s.index, text: s.text, aiScore: s.aiScore }));

  // Generate recommendations
  const recommendations = generateRecommendations(result);

  return {
    grade,
    naturalness: Math.round(naturalness * 1000) / 1000,
    verdict,
    aiPercentage: Math.round(result.aiScore * 100),
    humanPercentage: Math.round(result.humanScore * 100),
    sentenceBreakdown: {
      ai: result.stats.aiSentences,
      human: result.stats.humanSentences,
      mixed: result.sentences.filter((s) => s.label === ContentLabel.MIXED).length,
      uncertain: result.sentences.filter((s) => s.label === ContentLabel.UNCERTAIN).length,
    },
    topAISentences,
    recommendations,
  };
}

/**
 * Generate actionable recommendations based on detection results
 */
function generateRecommendations(result: DetectionResult): string[] {
  const recommendations: string[] = [];

  if (result.aiScore > 0.65) {
    recommendations.push('Consider using the Humaniser to rewrite AI-flagged sentences.');
  }

  if (result.stats.aiSentences > result.stats.totalSentences * 0.5) {
    recommendations.push(
      'More than half the sentences appear AI-generated. A full rewrite may be most effective.'
    );
  }

  const highTransition = result.sentences.filter(
    (s) => s.features.transitionSmoothness > 0.3
  ).length;
  if (highTransition > 2) {
    recommendations.push(
      'Reduce use of formal transition words (furthermore, consequently, etc.) for a more natural flow.'
    );
  }

  const lowDiversity = result.sentences.filter((s) => s.features.lexicalDiversity < 0.4).length;
  if (lowDiversity > 2) {
    recommendations.push('Increase vocabulary diversity by using synonyms and varied expressions.');
  }

  const uniformLength = result.sentences.every(
    (s) => Math.abs(s.features.wordCount - result.sentences[0].features.wordCount) < 5
  );
  if (uniformLength && result.sentences.length > 3) {
    recommendations.push(
      'Vary sentence lengths more — uniform sentence length is a common AI pattern.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('The text appears natural. No significant changes recommended.');
  }

  return recommendations;
}
