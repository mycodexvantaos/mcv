/**
 * Factory function for WeaviateVectorProvider
 */

import { WeaviateVectorProvider } from './weaviate-vector-provider-cb';
import type { WeaviateVectorConfig } from './weaviate-vector-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { WeaviateVectorProvider } from './weaviate-vector-provider-cb';
export type { WeaviateVectorConfig } from './weaviate-vector-provider-cb';

/**
 * Create a WeaviateVectorProvider instance with the given configuration.
 */
export function createWeaviateVectorProvider(
  config: Partial<ProviderConfig<WeaviateVectorConfig>> = {}
): WeaviateVectorProvider {
  const providerConfig: ProviderConfig<WeaviateVectorConfig> = {
    id: config.id || 'weaviate-vector-provider-cb',
    name: config.name || 'WeaviateVectorProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as WeaviateVectorConfig,
    fallback: config.fallback,
  };

  return new WeaviateVectorProvider(providerConfig);
}

export default createWeaviateVectorProvider;
