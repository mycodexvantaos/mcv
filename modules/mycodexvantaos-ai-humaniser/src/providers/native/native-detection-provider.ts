/**
 * @fileoverview Native Detection Provider — Local-first implementation
 *
 * Implements IDetectionProvider using native feature analysis.
 * Zero external API dependencies. Graceful degradation when no
 * LLM is available.
 */

import type { IDetectionProvider, DetectionResult, InputSource, ProviderSource } from '../types';
import { detectNative } from '../core/detector';

export class NativeDetectionProvider implements IDetectionProvider {
  readonly capability = 'detection';
  readonly source: ProviderSource = 'native';

  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
  }

  async detect(text: string, source?: InputSource): Promise<DetectionResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    return detectNative(text, source);
  }
}
