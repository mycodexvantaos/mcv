/**
 * @fileoverview MyCodexVantaOS AI Humaniser — Type Definitions
 *
 * Core types for AI content detection, confidence scoring,
 * sentence-level analysis, and humanisation rewriting.
 */

// ─── Enums ────────────────────────────────────────────────────────────

/** Classification label for a sentence or text segment */
export enum ContentLabel {
  AI = 'ai',
  HUMAN = 'human',
  MIXED = 'mixed',
  UNCERTAIN = 'uncertain',
}

/** Source input method */
export enum InputSource {
  TEXT = 'text',
  FILE = 'file',
  URL = 'url',
}

/** Provider source type */
export type ProviderSource = 'native' | 'external' | 'hybrid';

/** Runtime mode for the humaniser engine */
export type HumaniserRuntimeMode = 'native' | 'connected' | 'hybrid' | 'auto';

// ─── Core Data Models ─────────────────────────────────────────────────

/** A single sentence with its detection result */
export interface SentenceAnalysis {
  /** The original sentence text */
  text: string;
  /** Index of the sentence in the original text */
  index: number;
  /** Detected label */
  label: ContentLabel;
  /** Confidence score 0–1 for the assigned label */
  confidence: number;
  /** AI probability score 0–1 (higher = more AI-like) */
  aiScore: number;
  /** Human probability score 0–1 (higher = more human-like) */
  humanScore: number;
  /** Feature vector used for classification */
  features: SentenceFeatures;
  /** Explanation of why this label was assigned */
  explanation: string;
}

/** Linguistic and statistical features extracted from a sentence */
export interface SentenceFeatures {
  /** Average word length */
  avgWordLength: number;
  /** Sentence length in words */
  wordCount: number;
  /** Lexical diversity (unique words / total words) */
  lexicalDiversity: number;
  /** Average word frequency rank (lower = more common words) */
  avgWordFrequency: number;
  /** Punctuation density */
  punctuationDensity: number;
  /** Sentence complexity (clauses / words) */
  complexity: number;
  /** Repetition score (n-gram overlap) */
  repetitionScore: number;
  /** Perplexity proxy (pattern uniformity) */
  perplexityProxy: number;
  /** Transition smoothness score */
  transitionSmoothness: number;
  /** Vocabulary richness indicator */
  vocabularyRichness: number;
}

/** Overall detection result for a full text */
export interface DetectionResult {
  /** Unique result identifier */
  id: string;
  /** Overall label for the entire text */
  label: ContentLabel;
  /** Overall confidence 0–1 */
  confidence: number;
  /** Overall AI probability 0–1 */
  aiScore: number;
  /** Overall human probability 0–1 */
  humanScore: number;
  /** Per-sentence analysis results */
  sentences: SentenceAnalysis[];
  /** Summary statistics */
  stats: DetectionStats;
  /** Simple explanation of the overall result */
  explanation: string;
  /** Timestamp of the analysis */
  timestamp: string;
  /** Provider source used */
  providerSource: ProviderSource;
  /** Processing time in ms */
  processingTimeMs: number;
}

/** Aggregate statistics from detection */
export interface DetectionStats {
  /** Total sentence count */
  totalSentences: number;
  /** Number of AI-flagged sentences */
  aiSentences: number;
  /** Number of human-flagged sentences */
  humanSentences: number;
  /** Number of uncertain sentences */
  uncertainSentences: number;
  /** Average confidence across all sentences */
  avgConfidence: number;
  /** Maximum AI score among all sentences */
  maxAiScore: number;
  /** Minimum AI score among all sentences */
  minAiScore: number;
  /** Standard deviation of AI scores */
  stdDevAiScore: number;
}

// ─── Humanisation (Rewrite) Models ────────────────────────────────────

/** Request to humanise flagged content */
export interface HumaniserRequest {
  /** The original text to humanise */
  originalText: string;
  /** The detection result that flagged the content */
  detectionResult: DetectionResult;
  /** Which sentences to rewrite (by index) */
  targetSentenceIndices?: number[];
  /** Rewrite style preference */
  style?: RewriteStyle;
  /** Whether to preserve technical terms */
  preserveTechnicalTerms?: boolean;
  /** Target formality level */
  formalityLevel?: FormalityLevel;
}

/** Rewrite style options */
export enum RewriteStyle {
  CONVERSATIONAL = 'conversational',
  PROFESSIONAL = 'professional',
  ACADEMIC = 'academic',
  CREATIVE = 'creative',
  NEUTRAL = 'neutral',
}

/** Formality level */
export enum FormalityLevel {
  CASUAL = 'casual',
  SEMI_FORMAL = 'semi-formal',
  FORMAL = 'formal',
}

/** Result of a humanisation rewrite */
export interface HumaniserResult {
  /** Unique result identifier */
  id: string;
  /** The humanised text */
  humanisedText: string;
  /** Per-sentence rewrite results */
  sentenceRewrites: SentenceRewrite[];
  /** Change summary */
  changeSummary: ChangeSummary;
  /** Updated detection result on the humanised text */
  updatedDetection: DetectionResult;
  /** Side-by-side comparison data */
  comparison: SideBySideComparison;
  /** Timestamp */
  timestamp: string;
  /** Provider source used */
  providerSource: ProviderSource;
  /** Processing time in ms */
  processingTimeMs: number;
}

/** A single sentence rewrite */
export interface SentenceRewrite {
  /** Original sentence index */
  index: number;
  /** Original sentence text */
  original: string;
  /** Rewritten sentence text */
  rewritten: string;
  /** Original AI score */
  originalAiScore: number;
  /** New AI score after rewrite */
  newAiScore: number;
  /** Score improvement */
  improvement: number;
  /** List of specific changes made */
  changes: string[];
}

/** Summary of all changes made during humanisation */
export interface ChangeSummary {
  /** Total sentences rewritten */
  sentencesRewritten: number;
  /** Total sentences unchanged */
  sentencesUnchanged: number;
  /** Average AI score improvement */
  avgScoreImprovement: number;
  /** Overall AI score change (before → after) */
  overallScoreChange: { before: number; after: number };
  /** Key change categories */
  changeCategories: ChangeCategory[];
}

/** A category of changes made */
export interface ChangeCategory {
  category: string;
  count: number;
  examples: string[];
}

/** Side-by-side comparison data */
export interface SideBySideComparison {
  /** Original text with highlights */
  originalHighlighted: HighlightedSegment[];
  /** Humanised text with highlights */
  humanisedHighlighted: HighlightedSegment[];
  /** Diff segments */
  diffs: DiffSegment[];
}

/** A highlighted text segment */
export interface HighlightedSegment {
  text: string;
  label: ContentLabel;
  confidence: number;
  index: number;
}

/** A diff segment between original and humanised */
export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  original?: string;
  humanised?: string;
  index: number;
}

// ─── Provider Interface ───────────────────────────────────────────────

/** Base provider interface for Humaniser capabilities */
export interface IHumaniserProvider {
  readonly capability: string;
  readonly source: ProviderSource;
  initialize?(config?: unknown): Promise<void>;
  healthCheck(): Promise<boolean>;
  shutdown?(): Promise<void>;
}

/** Provider for AI content detection */
export interface IDetectionProvider extends IHumaniserProvider {
  detect(text: string, source?: InputSource): Promise<DetectionResult>;
}

/** Provider for content humanisation/rewriting */
export interface IRewriteProvider extends IHumaniserProvider {
  humanise(request: HumaniserRequest): Promise<HumaniserResult>;
}

/** Unified Humaniser provider combining detection and rewriting */
export interface IHumaniserEngine extends IHumaniserProvider {
  detect(text: string, source?: InputSource): Promise<DetectionResult>;
  humanise(request: HumaniserRequest): Promise<HumaniserResult>;
}

// ─── URL / File Input Models ──────────────────────────────────────────

/** Input specification for the Humaniser */
export interface HumaniserInput {
  /** Direct text input */
  text?: string;
  /** File upload metadata */
  file?: FileInput;
  /** URL to extract text from */
  url?: string;
  /** Source type */
  source: InputSource;
}

/** File input metadata */
export interface FileInput {
  /** Original filename */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Extracted text content */
  content: string;
}

// ─── Configuration ────────────────────────────────────────────────────

/** Humaniser engine configuration */
export interface HumaniserConfig {
  /** Runtime mode */
  mode: HumaniserRuntimeMode;
  /** Detection sensitivity threshold (0–1, higher = stricter) */
  detectionThreshold: number;
  /** Minimum sentence length to analyze */
  minSentenceLength: number;
  /** Whether to use native detection only */
  nativeOnly: boolean;
  /** External API endpoint (for connected mode) */
  externalEndpoint?: string;
  /** API key for external provider */
  apiKey?: string;
  /** Rewrite default style */
  defaultStyle: RewriteStyle;
  /** Whether to preserve technical terms by default */
  preserveTechnicalTerms: boolean;
  /** Default formality level */
  defaultFormality: FormalityLevel;
  /** Cache TTL in seconds for detection results */
  cacheTtlSeconds: number;
  /** Maximum text length in characters */
  maxTextLength: number;
}
