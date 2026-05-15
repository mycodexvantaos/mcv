/**
 * Factory function for ElasticsearchProvider
 */

import { ElasticsearchProvider } from './elasticsearch-provider-cb';
import type { ElasticsearchConfig } from './elasticsearch-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { ElasticsearchProvider } from './elasticsearch-provider-cb';
export type { ElasticsearchConfig } from './elasticsearch-provider-cb';

/**
 * Create a ElasticsearchProvider instance with the given configuration.
 */
export function createElasticsearchProvider(config: Partial<ProviderConfig<ElasticsearchConfig>> = {}): ElasticsearchProvider {
  const providerConfig: ProviderConfig<ElasticsearchConfig> = {
    id: config.id || 'elasticsearch-provider-cb',
    name: config.name || 'ElasticsearchProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as ElasticsearchConfig,
    fallback: config.fallback,
  };

  return new ElasticsearchProvider(providerConfig);
}

export default createElasticsearchProvider;
