/**
 * Factory function for AIFairness360Provider
 */

import { AIFairness360Provider } from './ai-fairness-360-provider-cb';
import type { AIFairness360Config } from './ai-fairness-360-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { AIFairness360Provider } from './ai-fairness-360-provider-cb';
export type { AIFairness360Config } from './ai-fairness-360-provider-cb';

/**
 * Create a AIFairness360Provider instance with the given configuration.
 */
export function createAIFairness360Provider(
  config: Partial<ProviderConfig<AIFairness360Config>> = {}
): AIFairness360Provider {
  const providerConfig: ProviderConfig<AIFairness360Config> = {
    id: config.id || 'ai-fairness-360-provider-cb',
    name: config.name || 'AIFairness360Provider',
    mode: config.mode || RuntimeMode.NATIVE,
    providerMode: config.providerMode || ProviderMode.NATIVE,
    config: (config.config || {}) as AIFairness360Config,
    fallback: config.fallback,
  };

  return new AIFairness360Provider(providerConfig);
}

export default createAIFairness360Provider;
