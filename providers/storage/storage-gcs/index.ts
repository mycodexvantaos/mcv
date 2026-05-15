/**
 * Factory function for GCSStorageProvider
 */

import { GCSStorageProvider } from './gcs-storage-provider-cb';
import type { GCSStorageConfig } from './gcs-storage-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { GCSStorageProvider } from './gcs-storage-provider-cb';
export type { GCSStorageConfig } from './gcs-storage-provider-cb';

/**
 * Create a GCSStorageProvider instance with the given configuration.
 */
export function createGCSStorageProvider(
  config: Partial<ProviderConfig<GCSStorageConfig>> = {}
): GCSStorageProvider {
  const providerConfig: ProviderConfig<GCSStorageConfig> = {
    id: config.id || 'gcs-storage-provider-cb',
    name: config.name || 'GCSStorageProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as GCSStorageConfig,
    fallback: config.fallback,
  };

  return new GCSStorageProvider(providerConfig);
}

export default createGCSStorageProvider;
