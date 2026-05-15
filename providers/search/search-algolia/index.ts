/**
 * Factory function for AlgoliaSearchProvider
 */

import { AlgoliaSearchProvider } from './algolia-search-provider-cb';
import type { AlgoliaSearchConfig } from './algolia-search-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { AlgoliaSearchProvider } from './algolia-search-provider-cb';
export type { AlgoliaSearchConfig } from './algolia-search-provider-cb';

/**
 * Create a AlgoliaSearchProvider instance with the given configuration.
 */
export function createAlgoliaSearchProvider(
  config: Partial<ProviderConfig<AlgoliaSearchConfig>> = {}
): AlgoliaSearchProvider {
  const providerConfig: ProviderConfig<AlgoliaSearchConfig> = {
    id: config.id || 'algolia-search-provider-cb',
    name: config.name || 'AlgoliaSearchProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as AlgoliaSearchConfig,
    fallback: config.fallback,
  };

  return new AlgoliaSearchProvider(providerConfig);
}

export default createAlgoliaSearchProvider;
