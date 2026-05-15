/**
 * Factory function for RedisStateStoreProvider
 */

import { RedisStateStoreProvider } from './redis-state-store-provider-cb';
import type { RedisStateStoreConfig } from './redis-state-store-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { RedisStateStoreProvider } from './redis-state-store-provider-cb';
export type { RedisStateStoreConfig } from './redis-state-store-provider-cb';

/**
 * Create a RedisStateStoreProvider instance with the given configuration.
 */
export function createRedisStateStoreProvider(
  config: Partial<ProviderConfig<RedisStateStoreConfig>> = {}
): RedisStateStoreProvider {
  const providerConfig: ProviderConfig<RedisStateStoreConfig> = {
    id: config.id || 'redis-state-store-provider-cb',
    name: config.name || 'RedisStateStoreProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as RedisStateStoreConfig,
    fallback: config.fallback,
  };

  return new RedisStateStoreProvider(providerConfig);
}

export default createRedisStateStoreProvider;
