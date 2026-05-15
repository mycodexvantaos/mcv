/**
 * Factory function for MemgraphProvider
 */

import { MemgraphProvider } from './memgraph-provider-cb';
import type { MemgraphConfig } from './memgraph-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { MemgraphProvider } from './memgraph-provider-cb';
export type { MemgraphConfig } from './memgraph-provider-cb';

/**
 * Create a MemgraphProvider instance with the given configuration.
 */
export function createMemgraphProvider(
  config: Partial<ProviderConfig<MemgraphConfig>> = {}
): MemgraphProvider {
  const providerConfig: ProviderConfig<MemgraphConfig> = {
    id: config.id || 'memgraph-provider-cb',
    name: config.name || 'MemgraphProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as MemgraphConfig,
    fallback: config.fallback,
  };

  return new MemgraphProvider(providerConfig);
}

export default createMemgraphProvider;
