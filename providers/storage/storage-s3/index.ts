/**
 * Factory function for S3StorageProvider
 */

import { S3StorageProvider } from './s3-storage-provider-cb';
import type { S3StorageConfig } from './s3-storage-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { S3StorageProvider } from './s3-storage-provider-cb';
export type { S3StorageConfig } from './s3-storage-provider-cb';

/**
 * Create a S3StorageProvider instance with the given configuration.
 */
export function createS3StorageProvider(config: Partial<ProviderConfig<S3StorageConfig>> = {}): S3StorageProvider {
  const providerConfig: ProviderConfig<S3StorageConfig> = {
    id: config.id || 's3-storage-provider-cb',
    name: config.name || 'S3StorageProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as S3StorageConfig,
    fallback: config.fallback,
  };

  return new S3StorageProvider(providerConfig);
}

export default createS3StorageProvider;
