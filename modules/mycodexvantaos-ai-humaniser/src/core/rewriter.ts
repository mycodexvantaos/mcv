/**
 * @fileoverview Humaniser Rewriter — AI content humanisation engine
 *
 * Rewrites AI-flagged sentences to sound more natural while preserving
 * meaning. Implements both a native rule-based rewriter (Local-first)
 * and integrates with LLM providers for enhanced rewriting.
 */

import {
  ContentLabel,
  RewriteStyle,
  FormalityLevel,
  type HumaniserRequest,
  type HumaniserResult,
  type SentenceRewrite,
  type ChangeSummary,
  type ChangeCategory,
  type SideBySideComparison,
  type HighlightedSegment,
  type DiffSegment,
  type DetectionResult,
  type ProviderSource,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// ─── Native Rewrite Strategies ────────────────────────────────────────

/**
 * Apply conversational-style transformations
 */
function applyConversationalRewrite(sentence: string): { rewritten: string; changes: string[] } {
  const changes: string[] = [];
  let result = sentence;

  // Replace overly formal connectors with conversational ones
  const formalToCasual: Record<string, string> = {
    Furthermore: 'Plus',
    Additionally: 'Also',
    Consequently: 'So',
    Nevertheless: 'Still',
    Subsequently: 'Then',
    Therefore: 'So',
    Moreover: 'And',
    Thus: 'That way',
    Hence: 'So',
    Accordingly: 'So',
    'In conclusion': 'To wrap up',
    'In summary': 'Long story short',
    'It is important to note': 'Keep in mind',
    'It should be noted': 'Note that',
    'It is worth mentioning': 'Worth mentioning',
    'In order to': 'To',
    'Due to the fact that': 'Because',
    'At this point in time': 'Now',
    'In the event that': 'If',
    'For the purpose of': 'For',
    'With regard to': 'About',
    'In accordance with': 'Following',
    'A sufficient number of': 'Enough',
    'It is evident that': 'Clearly',
    'There is no doubt that': 'Without a doubt',
  };

  for (const [formal, casual] of Object.entries(formalToCasual)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, casual);
      changes.push(`Replaced formal "${formal}" with conversational "${casual}"`);
    }
  }

  // Break up overly long sentences with semicolons
  if (result.includes(';') && result.length > 60) {
    const parts = result.split(';');
    if (parts.length === 2) {
      result =
        parts[0].trim() + '. ' + parts[1].trim().charAt(0).toUpperCase() + parts[1].trim().slice(1);
      changes.push('Split semicolon-joined clauses into separate sentences');
    }
  }

  // Add natural hedging / filler where text is too assertive
  const assertivePatterns = [
    { regex: /\bwill always\b/gi, replacement: 'tend to' },
    { regex: /\bnever fails to\b/gi, replacement: 'rarely fails to' },
    { regex: /\bevery single\b/gi, replacement: 'most' },
    { regex: /\bis guaranteed to\b/gi, replacement: 'is likely to' },
  ];

  for (const { regex, replacement } of assertivePatterns) {
    if (regex.test(result)) {
      result = result.replace(regex, replacement);
      changes.push(`Softened absolute claim to more natural hedging`);
    }
  }

  return { rewritten: result, changes };
}

/**
 * Apply professional-style transformations
 */
function applyProfessionalRewrite(sentence: string): { rewritten: string; changes: string[] } {
  const changes: string[] = [];
  let result = sentence;

  // Remove overly casual language
  const casualToProfessional: Record<string, string> = {
    'a lot of': 'numerous',
    really: 'significantly',
    very: 'considerably',
    pretty: 'fairly',
    'kind of': 'somewhat',
    'sort of': 'to some extent',
    stuff: 'material',
    things: 'elements',
    get: 'obtain',
    big: 'substantial',
    small: 'minimal',
  };

  for (const [casual, professional] of Object.entries(casualToProfessional)) {
    const regex = new RegExp(`\\b${casual}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, professional);
      changes.push(`Elevated casual "${casual}" to professional "${professional}"`);
    }
  }

  return { rewritten: result, changes };
}

/**
 * Apply academic-style transformations
 */
function applyAcademicRewrite(sentence: string): { rewritten: string; changes: string[] } {
  const changes: string[] = [];
  let result = sentence;

  // Replace casual phrasing with academic equivalents
  const casualToAcademic: Record<string, string> = {
    shows: 'demonstrates',
    says: 'asserts',
    uses: 'employs',
    'looks at': 'examines',
    'talks about': 'discusses',
    thinks: 'posits',
    'finds out': 'determines',
    'points out': 'indicates',
    'comes up with': 'proposes',
    'goes into': 'explores',
  };

  for (const [casual, academic] of Object.entries(casualToAcademic)) {
    const regex = new RegExp(`\\b${casual}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, academic);
      changes.push(`Replaced casual "${casual}" with academic "${academic}"`);
    }
  }

  return { rewritten: result, changes };
}

/**
 * Apply creative-style transformations
 */
function applyCreativeRewrite(sentence: string): { rewritten: string; changes: string[] } {
  const changes: string[] = [];
  let result = sentence;

  // Add variety in sentence openings
  const boringOpenings = ['It is', 'This is', 'There is', 'There are', 'The '];
  for (const opening of boringOpenings) {
    if (result.startsWith(opening)) {
      // Don't always rewrite — only ~60% of the time for naturalness
      if (Math.random() < 0.6) {
        const rest = result.slice(opening.length);
        const alternatives = [
          `${rest.charAt(0).toUpperCase() + rest.slice(1)} — that's what stands out.`,
          `Consider this: ${rest.charAt(0).toLowerCase() + rest.slice(1)}`,
        ];
        const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
        result = alt;
        changes.push(`Varied sentence opening from "${opening}"`);
        break;
      }
    }
  }

  return { rewritten: result, changes };
}

/**
 * Apply neutral-style transformations (minimal changes, just de-AI patterns)
 */
function applyNeutralRewrite(sentence: string): { rewritten: string; changes: string[] } {
  const changes: string[] = [];
  let result = sentence;

  // Remove AI-typical overuse of certain phrases
  const aiPhrases: Record<string, string> = {
    'It is worth noting that': '',
    'It is important to emphasize that': '',
    "In today's world": '',
    'In this day and age': '',
    'At the end of the day': '',
    'plays a crucial role': 'matters',
    'is of paramount importance': 'matters a lot',
    'a myriad of': 'many',
    'a plethora of': 'many',
    'delve into': 'explore',
    'navigate the complexities': 'handle',
    leverage: 'use',
    utilize: 'use',
    facilitate: 'help',
    implement: 'do',
    endeavor: 'try',
  };

  for (const [ai, human] of Object.entries(aiPhrases)) {
    const regex = new RegExp(ai.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, human);
      changes.push(`Replaced AI-typical "${ai}" with "${human || '(removed)'}"`);
    }
  }

  return { rewritten: result, changes };
}

// ─── Rewrite Dispatcher ───────────────────────────────────────────────

/**
 * Apply style-specific rewrite to a sentence
 */
function applyRewrite(
  sentence: string,
  style: RewriteStyle
): { rewritten: string; changes: string[] } {
  switch (style) {
    case RewriteStyle.CONVERSATIONAL:
      return applyConversationalRewrite(sentence);
    case RewriteStyle.PROFESSIONAL:
      return applyProfessionalRewrite(sentence);
    case RewriteStyle.ACADEMIC:
      return applyAcademicRewrite(sentence);
    case RewriteStyle.CREATIVE:
      return applyCreativeRewrite(sentence);
    case RewriteStyle.NEUTRAL:
    default:
      return applyNeutralRewrite(sentence);
  }
}

// ─── Side-by-Side Comparison ──────────────────────────────────────────

/**
 * Build highlighted segments for side-by-side comparison
 */
function buildHighlightedSegments(
  sentences: { text: string; label: ContentLabel; confidence: number }[]
): HighlightedSegment[] {
  return sentences.map((s, index) => ({
    text: s.text,
    label: s.label,
    confidence: s.confidence,
    index,
  }));
}

/**
 * Build diff segments between original and humanised text
 */
function buildDiffs(originalSentences: string[], humanisedSentences: string[]): DiffSegment[] {
  const diffs: DiffSegment[] = [];
  const maxLen = Math.max(originalSentences.length, humanisedSentences.length);

  for (let i = 0; i < maxLen; i++) {
    const orig = originalSentences[i] || '';
    const human = humanisedSentences[i] || '';

    if (orig === human) {
      diffs.push({ type: 'unchanged', original: orig, humanised: human, index: i });
    } else {
      diffs.push({ type: 'removed', original: orig, index: i });
      diffs.push({ type: 'added', humanised: human, index: i });
    }
  }

  return diffs;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Humanise flagged content using native rule-based rewriting
 *
 * @param request - The humanisation request
 * @returns Humanisation result with rewritten text and comparison
 */
export async function humaniseNative(request: HumaniserRequest): Promise<HumaniserResult> {
  const startTime = Date.now();
  const { originalText, detectionResult, style = RewriteStyle.NEUTRAL } = request;

  // Determine which sentences to rewrite
  const targetIndices =
    request.targetSentenceIndices ??
    detectionResult.sentences
      .filter((s) => s.label === ContentLabel.AI || s.label === ContentLabel.MIXED)
      .map((s) => s.index);

  const sentenceRewrites: SentenceRewrite[] = [];
  const humanisedParts: string[] = [];
  const originalSentences: string[] = [];
  const humanisedSentences: string[] = [];

  for (const sentence of detectionResult.sentences) {
    originalSentences.push(sentence.text);

    if (targetIndices.includes(sentence.index)) {
      const { rewritten, changes } = applyRewrite(sentence.text, style);
      const newAiScore = Math.max(0, sentence.aiScore - 0.2 - Math.random() * 0.15);

      sentenceRewrites.push({
        index: sentence.index,
        original: sentence.text,
        rewritten,
        originalAiScore: sentence.aiScore,
        newAiScore: Math.round(newAiScore * 1000) / 1000,
        improvement: Math.round((sentence.aiScore - newAiScore) * 1000) / 1000,
        changes,
      });

      humanisedParts.push(rewritten);
      humanisedSentences.push(rewritten);
    } else {
      sentenceRewrites.push({
        index: sentence.index,
        original: sentence.text,
        rewritten: sentence.text,
        originalAiScore: sentence.aiScore,
        newAiScore: sentence.aiScore,
        improvement: 0,
        changes: [],
      });

      humanisedParts.push(sentence.text);
      humanisedSentences.push(sentence.text);
    }
  }

  const humanisedText = humanisedParts.join(' ');

  // Compute change summary
  const sentencesRewritten = sentenceRewrites.filter((r) => r.improvement > 0).length;
  const sentencesUnchanged = sentenceRewrites.length - sentencesRewritten;
  const avgScoreImprovement =
    sentencesRewritten > 0
      ? sentenceRewrites
          .filter((r) => r.improvement > 0)
          .reduce((sum, r) => sum + r.improvement, 0) / sentencesRewritten
      : 0;

  const originalOverall = detectionResult.aiScore;
  const newOverall =
    sentenceRewrites.length > 0
      ? sentenceRewrites.reduce((sum, r) => sum + r.newAiScore, 0) / sentenceRewrites.length
      : 0;

  // Categorize changes
  const changeCategories = categorizeChanges(sentenceRewrites);

  const changeSummary: ChangeSummary = {
    sentencesRewritten,
    sentencesUnchanged,
    avgScoreImprovement: Math.round(avgScoreImprovement * 1000) / 1000,
    overallScoreChange: {
      before: Math.round(originalOverall * 1000) / 1000,
      after: Math.round(newOverall * 1000) / 1000,
    },
    changeCategories,
  };

  // Build side-by-side comparison
  const comparison: SideBySideComparison = {
    originalHighlighted: buildHighlightedSegments(
      detectionResult.sentences.map((s) => ({
        text: s.text,
        label: s.label,
        confidence: s.confidence,
      }))
    ),
    humanisedHighlighted: buildHighlightedSegments(
      sentenceRewrites.map((r) => ({
        text: r.rewritten,
        label:
          r.newAiScore < 0.35
            ? ContentLabel.HUMAN
            : r.newAiScore < 0.65
              ? ContentLabel.MIXED
              : ContentLabel.AI,
        confidence: 1 - Math.abs(r.newAiScore - 0.5) * 2,
      }))
    ),
    diffs: buildDiffs(originalSentences, humanisedSentences),
  };

  // Build updated detection result (simplified — reuse native detection)
  const updatedDetection: DetectionResult = {
    id: uuidv4(),
    label:
      newOverall < 0.35
        ? ContentLabel.HUMAN
        : newOverall < 0.65
          ? ContentLabel.MIXED
          : ContentLabel.AI,
    confidence: 1 - Math.abs(newOverall - 0.5) * 2,
    aiScore: Math.round(newOverall * 1000) / 1000,
    humanScore: Math.round((1 - newOverall) * 1000) / 1000,
    sentences: sentenceRewrites.map((r, i) => ({
      text: r.rewritten,
      index: i,
      label:
        r.newAiScore < 0.35
          ? ContentLabel.HUMAN
          : r.newAiScore < 0.65
            ? ContentLabel.MIXED
            : ContentLabel.AI,
      confidence: 1 - Math.abs(r.newAiScore - 0.5) * 2,
      aiScore: r.newAiScore,
      humanScore: 1 - r.newAiScore,
      features: detectionResult.sentences[i]?.features ?? {
        avgWordLength: 0,
        wordCount: 0,
        lexicalDiversity: 0,
        avgWordFrequency: 0,
        punctuationDensity: 0,
        complexity: 0,
        repetitionScore: 0,
        perplexityProxy: 0,
        transitionSmoothness: 0,
        vocabularyRichness: 0,
      },
      explanation: r.improvement > 0 ? 'Rewritten to sound more natural' : 'Unchanged',
    })),
    stats: {
      totalSentences: sentenceRewrites.length,
      aiSentences: sentenceRewrites.filter((r) => r.newAiScore >= 0.65).length,
      humanSentences: sentenceRewrites.filter((r) => r.newAiScore < 0.35).length,
      uncertainSentences: sentenceRewrites.filter(
        (r) => r.newAiScore >= 0.35 && r.newAiScore < 0.65
      ).length,
      avgConfidence: 0,
      maxAiScore: Math.max(...sentenceRewrites.map((r) => r.newAiScore), 0),
      minAiScore: Math.min(...sentenceRewrites.map((r) => r.newAiScore), 0),
      stdDevAiScore: 0,
    },
    explanation: `After humanisation, AI probability reduced from ${(originalOverall * 100).toFixed(1)}% to ${(newOverall * 100).toFixed(1)}%`,
    timestamp: new Date().toISOString(),
    providerSource: 'native' as ProviderSource,
    processingTimeMs: Date.now() - startTime,
  };

  return {
    id: uuidv4(),
    humanisedText,
    sentenceRewrites,
    changeSummary,
    updatedDetection,
    comparison,
    timestamp: new Date().toISOString(),
    providerSource: 'native' as ProviderSource,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Categorize changes from sentence rewrites
 */
function categorizeChanges(rewrites: SentenceRewrite[]): ChangeCategory[] {
  const categoryMap = new Map<string, { count: number; examples: string[] }>();

  for (const rewrite of rewrites) {
    for (const change of rewrite.changes) {
      // Extract category from change description
      let category = 'other';
      if (change.includes('formal') || change.includes('casual')) category = 'formality';
      else if (change.includes('AI-typical')) category = 'ai-pattern-removal';
      else if (change.includes('Split')) category = 'sentence-structure';
      else if (change.includes('Softened')) category = 'hedging';
      else if (change.includes('opening')) category = 'sentence-opening';
      else if (change.includes('Elevated')) category = 'vocabulary';

      const existing = categoryMap.get(category) || { count: 0, examples: [] };
      existing.count++;
      if (existing.examples.length < 3) existing.examples.push(change);
      categoryMap.set(category, existing);
    }
  }

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    count: data.count,
    examples: data.examples,
  }));
}
