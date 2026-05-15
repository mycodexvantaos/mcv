/**
 * Factory function for CohereHybridEmbeddingProvider
 */

import { CohereHybridEmbeddingProvider } from './cohere-hybrid-embedding-provider-cb';
import type { CohereHybridEmbeddingConfig } from './cohere-hybrid-embedding-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../../packages/capabilities/types';

export { CohereHybridEmbeddingProvider } from './cohere-hybrid-embedding-provider-cb';
export type { CohereHybridEmbeddingConfig } from './cohere-hybrid-embedding-provider-cb';

/**
 * Create a CohereHybridEmbeddingProvider instance with the given configuration.
 */
export function createCohereHybridEmbeddingProvider(
  config: Partial<ProviderConfig<CohereHybridEmbeddingConfig>> = {}
): CohereHybridEmbeddingProvider {
  const providerConfig: ProviderConfig<CohereHybridEmbeddingConfig> = {
    id: config.id || 'cohere-hybrid-embedding-provider-cb',
    name: config.name || 'CohereHybridEmbeddingProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as CohereHybridEmbeddingConfig,
    fallback: config.fallback,
  };

  return new CohereHybridEmbeddingProvider(providerConfig);
}

export default createCohereHybridEmbeddingProvider;
