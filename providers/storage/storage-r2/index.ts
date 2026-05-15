/**
 * Factory function for R2StorageProvider
 */

import { R2StorageProvider } from './r2-storage-provider-cb';
import type { R2StorageConfig } from './r2-storage-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { R2StorageProvider } from './r2-storage-provider-cb';
export type { R2StorageConfig } from './r2-storage-provider-cb';

/**
 * Create a R2StorageProvider instance with the given configuration.
 */
export function createR2StorageProvider(
  config: Partial<ProviderConfig<R2StorageConfig>> = {}
): R2StorageProvider {
  const providerConfig: ProviderConfig<R2StorageConfig> = {
    id: config.id || 'r2-storage-provider-cb',
    name: config.name || 'R2StorageProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as R2StorageConfig,
    fallback: config.fallback,
  };

  return new R2StorageProvider(providerConfig);
}

export default createR2StorageProvider;
