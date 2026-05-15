/**
 * Factory function for MinIOStorageProvider
 */

import { MinIOStorageProvider } from './minio-storage-provider-cb';
import type { MinIOStorageConfig } from './minio-storage-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { MinIOStorageProvider } from './minio-storage-provider-cb';
export type { MinIOStorageConfig } from './minio-storage-provider-cb';

/**
 * Create a MinIOStorageProvider instance with the given configuration.
 */
export function createMinIOStorageProvider(
  config: Partial<ProviderConfig<MinIOStorageConfig>> = {}
): MinIOStorageProvider {
  const providerConfig: ProviderConfig<MinIOStorageConfig> = {
    id: config.id || 'minio-storage-provider-cb',
    name: config.name || 'MinIOStorageProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as MinIOStorageConfig,
    fallback: config.fallback,
  };

  return new MinIOStorageProvider(providerConfig);
}

export default createMinIOStorageProvider;
