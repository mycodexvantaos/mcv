/**
 * Factory function for QdrantProvider
 */

import { QdrantProvider } from './qdrant-provider-cb';
import type { QdrantConfig } from './qdrant-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { QdrantProvider } from './qdrant-provider-cb';
export type { QdrantConfig } from './qdrant-provider-cb';

/**
 * Create a QdrantProvider instance with the given configuration.
 */
export function createQdrantProvider(config: Partial<ProviderConfig<QdrantConfig>> = {}): QdrantProvider {
  const providerConfig: ProviderConfig<QdrantConfig> = {
    id: config.id || 'qdrant-provider-cb',
    name: config.name || 'QdrantProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as QdrantConfig,
    fallback: config.fallback,
  };

  return new QdrantProvider(providerConfig);
}

export default createQdrantProvider;
