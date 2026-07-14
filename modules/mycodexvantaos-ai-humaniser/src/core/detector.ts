/**
 * @fileoverview Native AI Content Detector — Zero-dependency detection engine
 *
 * Implements local-first AI content detection using linguistic and statistical
 * feature analysis. Operates entirely without external API calls, following
 * the MyCodexVantaOS Local-first principle.
 *
 * Detection signals:
 * - Perplexity proxy (pattern uniformity)
 * - Lexical diversity
 * - Punctuation density
 * - Sentence complexity
 * - Repetition patterns
 * - Transition word overuse
 * - Vocabulary richness
 * - Word length distribution
 */

import {
  ContentLabel,
  type SentenceAnalysis,
  type SentenceFeatures,
  type DetectionResult,
  type DetectionStats,
  type ProviderSource,
  type InputSource,
} from '../types';
import { extractFeatures, splitIntoSentences } from './feature-extractor';
import { v4 as uuidv4 } from 'uuid';

// ─── Scoring Weights ──────────────────────────────────────────────────

/** Weights for each feature in the AI detection model */
const FEATURE_WEIGHTS: Record<keyof SentenceFeatures, number> = {
  avgWordLength: 0.08,
  wordCount: 0.05,
  lexicalDiversity: 0.15,
  avgWordFrequency: 0.1,
  punctuationDensity: 0.08,
  complexity: 0.1,
  repetitionScore: 0.12,
  perplexityProxy: 0.15,
  transitionSmoothness: 0.07,
  vocabularyRichness: 0.1,
};

/** Thresholds for AI detection classification */
const THRESHOLDS = {
  AI_THRESHOLD: 0.65, // Score above this → likely AI
  HUMAN_THRESHOLD: 0.35, // Score below this → likely human
  MIN_CONFIDENCE: 0.5, // Minimum confidence for decisive classification
  UNCERTAIN_RANGE: 0.15, // Range around 0.5 considered uncertain
} as const;

// ─── Native Detection Engine ──────────────────────────────────────────

/**
 * Compute an AI probability score from sentence features
 *
 * Uses a weighted scoring model:
 * - Low perplexity proxy (uniform patterns) → higher AI score
 * - Low lexical diversity → higher AI score
 * - High transition smoothness (overuse of connectors) → higher AI score
 * - Low punctuation density (uniform punctuation) → higher AI score
 * - Low repetition (too consistent) → higher AI score
 * - High avg word frequency (common words only) → higher AI score
 */
function computeAiScore(features: SentenceFeatures): number {
  let score = 0.5; // Start neutral

  // Perplexity proxy: lower = more uniform = more AI-like
  if (features.perplexityProxy < 0.8) {
    score += FEATURE_WEIGHTS.perplexityProxy * (1 - features.perplexityProxy / 0.8);
  } else {
    score -= FEATURE_WEIGHTS.perplexityProxy * 0.3;
  }

  // Lexical diversity: lower = more repetitive = more AI-like
  if (features.lexicalDiversity < 0.5) {
    score += FEATURE_WEIGHTS.lexicalDiversity * (1 - features.lexicalDiversity / 0.5);
  } else {
    score -= FEATURE_WEIGHTS.lexicalDiversity * 0.2;
  }

  // Transition smoothness: higher = more formal connectors = more AI-like
  if (features.transitionSmoothness > 0.3) {
    score += FEATURE_WEIGHTS.transitionSmoothness * Math.min(features.transitionSmoothness, 1);
  } else {
    score -= FEATURE_WEIGHTS.transitionSmoothness * 0.1;
  }

  // Punctuation density: very low or very high → more AI-like
  if (features.punctuationDensity < 0.02 || features.punctuationDensity > 0.15) {
    score += FEATURE_WEIGHTS.punctuationDensity * 0.5;
  } else {
    score -= FEATURE_WEIGHTS.punctuationDensity * 0.2;
  }

  // Repetition: very low (too clean) → more AI-like
  if (features.repetitionScore < 0.02) {
    score += FEATURE_WEIGHTS.repetitionScore * 0.4;
  }

  // Word frequency: high average frequency (only common words) → more AI-like
  if (features.avgWordFrequency > 0.5) {
    score += FEATURE_WEIGHTS.avgWordFrequency * (features.avgWordFrequency - 0.5);
  }

  // Complexity: very uniform complexity → more AI-like
  if (features.complexity > 0.05 && features.complexity < 0.15) {
    score += FEATURE_WEIGHTS.complexity * 0.3;
  }

  // Vocabulary richness: low richness → more AI-like
  if (features.vocabularyRichness < 0.15) {
    score += FEATURE_WEIGHTS.vocabularyRichness * (1 - features.vocabularyRichness / 0.15);
  }

  // Word count: very short or very long sentences → slightly more AI-like
  if (features.wordCount < 5 || features.wordCount > 40) {
    score += FEATURE_WEIGHTS.wordCount * 0.2;
  }

  // Average word length: very uniform (around 4.5-5.5) → more AI-like
  if (features.avgWordLength > 4.2 && features.avgWordLength < 5.8) {
    score += FEATURE_WEIGHTS.avgWordLength * 0.15;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Classify a sentence based on its AI score
 */
function classifySentence(aiScore: number): {
  label: ContentLabel;
  confidence: number;
  explanation: string;
} {
  if (aiScore >= THRESHOLDS.AI_THRESHOLD) {
    const confidence =
      0.5 + ((aiScore - THRESHOLDS.AI_THRESHOLD) / (1 - THRESHOLDS.AI_THRESHOLD)) * 0.5;
    return {
      label: ContentLabel.AI,
      confidence: Math.round(confidence * 1000) / 1000,
      explanation: `High AI probability (${(aiScore * 100).toFixed(1)}%). Sentence shows patterns typical of AI-generated text: uniform structure, predictable vocabulary, and formal transitions.`,
    };
  }

  if (aiScore <= THRESHOLDS.HUMAN_THRESHOLD) {
    const confidence =
      0.5 + ((THRESHOLDS.HUMAN_THRESHOLD - aiScore) / THRESHOLDS.HUMAN_THRESHOLD) * 0.5;
    return {
      label: ContentLabel.HUMAN,
      confidence: Math.round(confidence * 1000) / 1000,
      explanation: `High human probability (${((1 - aiScore) * 100).toFixed(1)}%). Sentence shows natural variation, diverse vocabulary, and organic structure typical of human writing.`,
    };
  }

  if (Math.abs(aiScore - 0.5) < THRESHOLDS.UNCERTAIN_RANGE) {
    return {
      label: ContentLabel.UNCERTAIN,
      confidence: Math.round((0.4 + Math.abs(aiScore - 0.5) * 2) * 1000) / 1000,
      explanation: `Uncertain classification (${(aiScore * 100).toFixed(1)}% AI probability). The sentence shows a mix of AI and human characteristics.`,
    };
  }

  return {
    label: ContentLabel.MIXED,
    confidence: Math.round((0.5 + Math.abs(aiScore - 0.5)) * 1000) / 1000,
    explanation: `Mixed signals (${(aiScore * 100).toFixed(1)}% AI probability). Some features suggest AI origin while others suggest human authorship.`,
  };
}

/**
 * Compute aggregate statistics from sentence analyses
 */
function computeStats(sentences: SentenceAnalysis[]): DetectionStats {
  const aiScores = sentences.map((s) => s.aiScore);
  const totalSentences = sentences.length;
  const aiSentences = sentences.filter((s) => s.label === ContentLabel.AI).length;
  const humanSentences = sentences.filter((s) => s.label === ContentLabel.HUMAN).length;
  const uncertainSentences = sentences.filter(
    (s) => s.label === ContentLabel.UNCERTAIN || s.label === ContentLabel.MIXED
  ).length;

  const avgConfidence =
    totalSentences > 0 ? sentences.reduce((sum, s) => sum + s.confidence, 0) / totalSentences : 0;

  const maxAiScore = aiScores.length > 0 ? Math.max(...aiScores) : 0;
  const minAiScore = aiScores.length > 0 ? Math.min(...aiScores) : 0;

  const mean = aiScores.length > 0 ? aiScores.reduce((a, b) => a + b, 0) / aiScores.length : 0;
  const stdDevAiScore =
    aiScores.length > 0
      ? Math.sqrt(aiScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / aiScores.length)
      : 0;

  return {
    totalSentences,
    aiSentences,
    humanSentences,
    uncertainSentences,
    avgConfidence: Math.round(avgConfidence * 1000) / 1000,
    maxAiScore: Math.round(maxAiScore * 1000) / 1000,
    minAiScore: Math.round(minAiScore * 1000) / 1000,
    stdDevAiScore: Math.round(stdDevAiScore * 1000) / 1000,
  };
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Detect AI-generated content in text using native feature analysis
 *
 * @param text - The text to analyze
 * @param source - Input source type (text, file, url)
 * @returns Detection result with per-sentence analysis and overall scoring
 */
export async function detectNative(text: string, source?: InputSource): Promise<DetectionResult> {
  const startTime = Date.now();

  const rawSentences = splitIntoSentences(text);
  const sentences: SentenceAnalysis[] = rawSentences.map((sentenceText, index) => {
    const features = extractFeatures(sentenceText);
    const aiScore = computeAiScore(features);
    const humanScore = 1 - aiScore;
    const { label, confidence, explanation } = classifySentence(aiScore);

    return {
      text: sentenceText,
      index,
      label,
      confidence,
      aiScore: Math.round(aiScore * 1000) / 1000,
      humanScore: Math.round(humanScore * 1000) / 1000,
      features,
      explanation,
    };
  });

  // Overall score: weighted average with slight penalty for high-AI clusters
  const overallAiScore =
    sentences.length > 0 ? sentences.reduce((sum, s) => sum + s.aiScore, 0) / sentences.length : 0;
  const overallHumanScore = 1 - overallAiScore;
  const overallLabel = classifySentence(overallAiScore).label;
  const overallConfidence = classifySentence(overallAiScore).confidence;

  const stats = computeStats(sentences);
  const processingTimeMs = Date.now() - startTime;

  const explanation = generateOverallExplanation(overallLabel, overallAiScore, stats);

  return {
    id: uuidv4(),
    label: overallLabel,
    confidence: overallConfidence,
    aiScore: Math.round(overallAiScore * 1000) / 1000,
    humanScore: Math.round(overallHumanScore * 1000) / 1000,
    sentences,
    stats,
    explanation,
    timestamp: new Date().toISOString(),
    providerSource: 'native' as ProviderSource,
    processingTimeMs,
  };
}

/**
 * Generate an overall explanation for the detection result
 */
function generateOverallExplanation(
  label: ContentLabel,
  aiScore: number,
  stats: DetectionStats
): string {
  const pct = (aiScore * 100).toFixed(1);
  const aiPct = ((stats.aiSentences / stats.totalSentences) * 100).toFixed(0);

  switch (label) {
    case ContentLabel.AI:
      return `This text is likely AI-generated (${pct}% AI probability). ${stats.aiSentences} of ${stats.totalSentences} sentences (${aiPct}%) show patterns consistent with AI generation, including uniform sentence structure, predictable vocabulary choices, and formal transition patterns.`;
    case ContentLabel.HUMAN:
      return `This text appears to be human-written (${pct}% AI probability). ${stats.humanSentences} of ${stats.totalSentences} sentences show natural variation, diverse vocabulary, and organic structure typical of human authorship.`;
    case ContentLabel.MIXED:
      return `This text shows mixed authorship signals (${pct}% AI probability). ${stats.aiSentences} sentences appear AI-generated while ${stats.humanSentences} appear human-written, suggesting possible AI-assisted editing or mixed authorship.`;
    case ContentLabel.UNCERTAIN:
      return `Unable to confidently classify this text (${pct}% AI probability). The writing shows a blend of AI and human characteristics that makes definitive classification difficult.`;
    default:
      return `Analysis complete: ${pct}% AI probability.`;
  }
}
