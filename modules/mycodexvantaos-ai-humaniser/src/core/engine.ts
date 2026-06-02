/**
 * @fileoverview Humaniser Engine — Unified detection + humanisation engine
 *
 * Implements IHumaniserEngine with runtime mode support:
 * - native: Zero external dependencies, rule-based detection and rewriting
 * - connected: LLM-powered detection and rewriting via external API
 * - hybrid: Native with LLM enhancement when available
 * - auto: Runtime mode detection based on environment
 *
 * Follows MyCodeXvantaOS Local-first principle:
 * The engine always works in native mode, and optionally enhances
 * with external providers when available.
 */

import {
  type IHumaniserEngine,
  type IDetectionProvider,
  type IRewriteProvider,
  type DetectionResult,
  type HumaniserResult,
  type HumaniserRequest,
  type HumaniserConfig,
  type HumaniserRuntimeMode,
  type InputSource,
  type ProviderSource,
} from '../types';
import { NativeDetectionProvider } from './providers/native/native-detection-provider';
import { NativeRewriteProvider } from './providers/native/native-rewrite-provider';
import { ExternalDetectionProvider } from './providers/external/external-detection-provider';
import { ExternalRewriteProvider } from './providers/external/external-rewrite-provider';

/** Default configuration */
const DEFAULT_CONFIG: HumaniserConfig = {
  mode: 'auto',
  detectionThreshold: 0.65,
  minSentenceLength: 3,
  nativeOnly: false,
  defaultStyle: 'neutral' as any,
  preserveTechnicalTerms: true,
  defaultFormality: 'semi-formal' as any,
  cacheTtlSeconds: 300,
  maxTextLength: 100000,
};

export class HumaniserEngine implements IHumaniserEngine {
  readonly capability = 'humaniser';
  readonly source: ProviderSource = 'native';

  private detectionProvider: IDetectionProvider;
  private rewriteProvider: IRewriteProvider;
  private config: HumaniserConfig;
  private resolvedMode: HumaniserRuntimeMode;
  private initialized = false;

  constructor(config?: Partial<HumaniserConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.resolvedMode = this.config.mode;

    // Initialize with native providers by default
    this.detectionProvider = new NativeDetectionProvider();
    this.rewriteProvider = new NativeRewriteProvider();
  }

  /**
   * Initialize the engine and resolve runtime mode
   */
  async initialize(config?: Partial<HumaniserConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Resolve runtime mode
    this.resolvedMode = await this.resolveMode();

    // Set up providers based on resolved mode
    if (this.resolvedMode === 'connected' || this.resolvedMode === 'hybrid') {
      if (this.config.externalEndpoint && this.config.apiKey) {
        const extConfig = {
          endpoint: this.config.externalEndpoint,
          apiKey: this.config.apiKey,
        };

        const externalDetection = new ExternalDetectionProvider();
        await externalDetection.initialize(extConfig);

        const externalRewrite = new ExternalRewriteProvider();
        await externalRewrite.initialize(extConfig);

        if (this.resolvedMode === 'connected') {
          this.detectionProvider = externalDetection;
          this.rewriteProvider = externalRewrite;
        }
        // In hybrid mode, we keep native as primary and use external as enhancement
      }
    }

    // Initialize native providers
    await this.detectionProvider.initialize();
    await this.rewriteProvider.initialize();

    this.initialized = true;
  }

  /**
   * Detect AI-generated content in text
   */
  async detect(text: string, source?: InputSource): Promise<DetectionResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text input cannot be empty');
    }

    if (text.length > this.config.maxTextLength) {
      throw new Error(`Text exceeds maximum length of ${this.config.maxTextLength} characters`);
    }

    return this.detectionProvider.detect(text, source);
  }

  /**
   * Humanise flagged content
   */
  async humanise(request: HumaniserRequest): Promise<HumaniserResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.rewriteProvider.humanise(request);
  }

  /**
   * Convenience method: detect then humanise in one call
   */
  async detectAndHumanise(
    text: string,
    source?: InputSource,
    style?: any,
    formality?: any
  ): Promise<{ detection: DetectionResult; humanisation: HumaniserResult }> {
    const detection = await this.detect(text, source);

    if (detection.label === 'human') {
      // No need to humanise
      return { detection, humanisation: null as any };
    }

    const humanisation = await this.humanise({
      originalText: text,
      detectionResult: detection,
      style: style || this.config.defaultStyle,
      preserveTechnicalTerms: this.config.preserveTechnicalTerms,
      formalityLevel: formality || this.config.defaultFormality,
    });

    return { detection, humanisation };
  }

  /**
   * Resolve the runtime mode based on configuration and environment
   */
  private async resolveMode(): Promise<HumaniserRuntimeMode> {
    if (this.config.mode !== 'auto') {
      return this.config.mode;
    }

    // Auto mode: check if external providers are available
    if (this.config.nativeOnly) {
      return 'native';
    }

    if (this.config.externalEndpoint && this.config.apiKey) {
      // Test connectivity
      try {
        const testProvider = new ExternalDetectionProvider();
        await testProvider.initialize({
          endpoint: this.config.externalEndpoint,
          apiKey: this.config.apiKey,
        });
        const healthy = await testProvider.healthCheck();
        await testProvider.shutdown();
        return healthy ? 'hybrid' : 'native';
      } catch {
        return 'native';
      }
    }

    return 'native';
  }

  /**
   * Check engine health
   */
  async healthCheck(): Promise<boolean> {
    if (!this.initialized) return false;
    return this.detectionProvider.healthCheck() && this.rewriteProvider.healthCheck();
  }

  /**
   * Shut down the engine
   */
  async shutdown(): Promise<void> {
    await this.detectionProvider.shutdown?.();
    await this.rewriteProvider.shutdown?.();
    this.initialized = false;
  }

  /**
   * Get the resolved runtime mode
   */
  getRuntimeMode(): HumaniserRuntimeMode {
    return this.resolvedMode;
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<HumaniserConfig> {
    return Object.freeze({ ...this.config });
  }
}
