/**
 * Factory function for MemoryStorageProvider
 */

import { MemoryStorageProvider } from './storage-memory-provider-cb';
import type { MemoryStorageConfig } from './storage-memory-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { MemoryStorageProvider } from './storage-memory-provider-cb';
export type { MemoryStorageConfig } from './storage-memory-provider-cb';

/**
 * Create a MemoryStorageProvider instance with the given configuration.
 */
export function createMemoryStorageProvider(config: Partial<ProviderConfig<MemoryStorageConfig>> = {}): MemoryStorageProvider {
  const providerConfig: ProviderConfig<MemoryStorageConfig> = {
    id: config.id || 'storage-memory-provider-cb',
    name: config.name || 'MemoryStorageProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as MemoryStorageConfig,
    fallback: config.fallback,
  };

  return new MemoryStorageProvider(providerConfig);
}

export default createMemoryStorageProvider;
