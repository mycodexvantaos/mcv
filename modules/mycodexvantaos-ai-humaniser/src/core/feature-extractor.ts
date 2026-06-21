/**
 * @fileoverview Feature Extractor — Linguistic and statistical feature extraction
 *
 * Extracts quantifiable features from text sentences that serve as
 * signals for AI-generated content detection. Operates in native mode
 * with zero external dependencies.
 */

import type { SentenceFeatures } from '../types';

/** Common English word frequency list (top 200 subset) for frequency scoring */
const COMMON_WORDS = new Set([
  'the',
  'be',
  'to',
  'of',
  'and',
  'a',
  'in',
  'that',
  'have',
  'i',
  'it',
  'for',
  'not',
  'on',
  'with',
  'he',
  'as',
  'you',
  'do',
  'at',
  'this',
  'but',
  'his',
  'by',
  'from',
  'they',
  'we',
  'say',
  'her',
  'she',
  'or',
  'an',
  'will',
  'my',
  'one',
  'all',
  'would',
  'there',
  'their',
  'what',
  'so',
  'up',
  'out',
  'if',
  'about',
  'who',
  'get',
  'which',
  'go',
  'me',
  'when',
  'make',
  'can',
  'like',
  'time',
  'no',
  'just',
  'him',
  'know',
  'take',
  'people',
  'into',
  'year',
  'your',
  'good',
  'some',
  'could',
  'them',
  'see',
  'other',
  'than',
  'then',
  'now',
  'look',
  'only',
  'come',
  'its',
  'over',
  'think',
  'also',
  'back',
  'after',
  'use',
  'two',
  'how',
  'our',
  'work',
  'first',
  'well',
  'way',
  'even',
  'new',
  'want',
  'because',
  'any',
  'these',
  'give',
  'day',
  'most',
  'us',
  'is',
  'are',
  'was',
  'were',
  'been',
  'being',
  'has',
  'had',
  'did',
  'does',
  'may',
  'might',
  'must',
  'shall',
  'should',
  'need',
  'very',
  'still',
  'much',
  'more',
  'where',
  'why',
  'while',
  'each',
  'too',
  'own',
  'such',
  'same',
  'those',
  'through',
]);

/**
 * Tokenize text into words (lowercased, stripped of punctuation)
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Compute n-gram set from tokens
 */
function ngramSet(tokens: string[], n: number): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    set.add(tokens.slice(i, i + n).join(' '));
  }
  return set;
}

/**
 * Extract features from a single sentence
 */
export function extractFeatures(sentence: string): SentenceFeatures {
  const tokens = tokenize(sentence);
  const wordCount = tokens.length;

  if (wordCount === 0) {
    return {
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
    };
  }

  // Average word length
  const avgWordLength = tokens.reduce((sum, w) => sum + w.length, 0) / wordCount;

  // Lexical diversity (type-token ratio)
  const uniqueTokens = new Set(tokens);
  const lexicalDiversity = uniqueTokens.size / wordCount;

  // Average word frequency (higher = more common words used)
  const commonCount = tokens.filter((w) => COMMON_WORDS.has(w)).length;
  const avgWordFrequency = commonCount / wordCount;

  // Punctuation density
  const punctuationCount = (sentence.match(/[.,;:!?()"'\\-]/g) || []).length;
  const punctuationDensity = punctuationCount / sentence.length;

  // Sentence complexity (approximate clause count via conjunctions and commas)
  const clauseMarkers = (
    sentence.match(
      /\b(and|but|or|however|although|because|since|while|which|that|where|when)\b/gi
    ) || []
  ).length;
  const commaCount = (sentence.match(/,/g) || []).length;
  const complexity = (clauseMarkers + commaCount) / wordCount;

  // Repetition score (bigram overlap)
  const bigrams = ngramSet(tokens, 2);
  const trigrams = ngramSet(tokens, 3);
  let repetitionCount = 0;
  tokens.forEach((t, i) => {
    if (i > 0 && tokens.slice(0, i - 1).includes(t)) repetitionCount++;
  });
  const repetitionScore = wordCount > 2 ? repetitionCount / wordCount : 0;

  // Perplexity proxy — pattern uniformity
  // AI text tends to have more uniform sentence structure
  const wordLengths = tokens.map((w) => w.length);
  const avgLen = avgWordLength;
  const lenVariance = wordLengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / wordCount;
  const perplexityProxy = Math.sqrt(lenVariance); // Lower = more uniform = more AI-like

  // Transition smoothness — how smoothly one idea flows to the next
  const transitionWords = (
    sentence.match(
      /\b(however|therefore|furthermore|moreover|consequently|nevertheless|additionally|subsequently|thus|hence|accordingly)\b/gi
    ) || []
  ).length;
  const transitionSmoothness = transitionWords / Math.max(wordCount / 20, 1);

  // Vocabulary richness — ratio of uncommon words
  const uncommonCount = tokens.filter((w) => !COMMON_WORDS.has(w) && w.length > 5).length;
  const vocabularyRichness = uncommonCount / wordCount;

  return {
    avgWordLength: Math.round(avgWordLength * 1000) / 1000,
    wordCount,
    lexicalDiversity: Math.round(lexicalDiversity * 1000) / 1000,
    avgWordFrequency: Math.round(avgWordFrequency * 1000) / 1000,
    punctuationDensity: Math.round(punctuationDensity * 1000) / 1000,
    complexity: Math.round(complexity * 1000) / 1000,
    repetitionScore: Math.round(repetitionScore * 1000) / 1000,
    perplexityProxy: Math.round(perplexityProxy * 1000) / 1000,
    transitionSmoothness: Math.round(transitionSmoothness * 1000) / 1000,
    vocabularyRichness: Math.round(vocabularyRichness * 1000) / 1000,
  };
}

/**
 * Extract features from multiple sentences
 */
export function extractFeaturesBatch(sentences: string[]): SentenceFeatures[] {
  return sentences.map(extractFeatures);
}

/**
 * Split text into sentences
 */
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
