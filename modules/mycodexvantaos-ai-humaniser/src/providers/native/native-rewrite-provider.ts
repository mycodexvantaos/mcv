/**
 * @fileoverview Native Rewrite Provider — Local-first humanisation
 *
 * Implements IRewriteProvider using native rule-based rewriting.
 * Zero external API dependencies.
 */

import type {
  IRewriteProvider,
  HumaniserResult,
  HumaniserRequest,
  ProviderSource,
} from '../../types';
import { humaniseNative } from '../../core/rewriter';

export class NativeRewriteProvider implements IRewriteProvider {
  readonly capability = 'rewrite';
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

  async humanise(request: HumaniserRequest): Promise<HumaniserResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    return humaniseNative(request);
  }
}
