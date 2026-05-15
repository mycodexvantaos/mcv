/**
 * Factory function for ReplicateLLMProvider
 */

import { ReplicateLLMProvider } from './replicate-provider-cb';
import type { ReplicateConfig } from './replicate-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { ReplicateLLMProvider } from './replicate-provider-cb';
export type { ReplicateConfig } from './replicate-provider-cb';

/**
 * Create a ReplicateLLMProvider instance with the given configuration.
 */
export function createReplicateLLMProvider(config: Partial<ProviderConfig<ReplicateConfig>> = {}): ReplicateLLMProvider {
  const providerConfig: ProviderConfig<ReplicateConfig> = {
    id: config.id || 'replicate-provider-cb',
    name: config.name || 'ReplicateLLMProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as ReplicateConfig,
    fallback: config.fallback,
  };

  return new ReplicateLLMProvider(providerConfig);
}

export default createReplicateLLMProvider;
