/**
 * @fileoverview MyCodeXvantaOS AI Humaniser — Module Entry Point
 *
 * Public API for the Humaniser module. Exports the engine,
 * types, and provider implementations.
 *
 * Usage:
 * ```typescript
 * import { HumaniserEngine } from '@mycodexvantaos/ai-humaniser';
 *
 * const engine = new HumaniserEngine({ mode: 'auto' });
 * await engine.initialize();
 *
 * const result = await engine.detect(someText);
 * console.log(result.label, result.confidence);
 *
 * const humanised = await engine.humanise({
 *   originalText: someText,
 *   detectionResult: result,
 * });
 * ```
 */

// Core engine
export { HumaniserEngine } from './core/engine';

// Core utilities
export { extractFeatures, extractFeaturesBatch, splitIntoSentences } from './core/feature-extractor';
export { detectNative } from './core/detector';
export { humaniseNative } from './core/rewriter';
export { computeWeightedAiScore, computeImprovement, computeNaturalnessScore, computeGrade, generateReport } from './core/scorer';
export { extractFromUrl, extractFromFile } from './core/url-extractor';

// Providers
export { NativeDetectionProvider, NativeRewriteProvider } from './providers/native';
export { ExternalDetectionProvider, ExternalRewriteProvider } from './providers/external';

// Types (re-export all)
export {
  ContentLabel,
  InputSource,
  RewriteStyle,
  FormalityLevel,
} from './types';

export type {
  SentenceAnalysis,
  SentenceFeatures,
  DetectionResult,
  DetectionStats,
  HumaniserRequest,
  HumaniserResult,
  SentenceRewrite,
  ChangeSummary,
  ChangeCategory,
  SideBySideComparison,
  HighlightedSegment,
  DiffSegment,
  IHumaniserProvider,
  IDetectionProvider,
  IRewriteProvider,
  IHumaniserEngine,
  HumaniserInput,
  FileInput,
  HumaniserConfig,
  HumaniserRuntimeMode,
  ProviderSource,
} from './types';
