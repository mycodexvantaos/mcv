/**
 * 🔒 MyCodeXvantaOS - AWS S3 Storage Provider
 *
 * AWS S3 storage integration with native fallback.
 *
 * @module providers/storage/storage-s3
 * @version 1.0.0
 */

export { S3StorageProvider } from './s3-storage-provider-cb';
export type { S3StorageConfig, FileMetadata, UploadResult, DownloadResult, ListResult, DeleteResult } from './s3-storage-provider-cb';

/**
 * Factory function to create S3 storage provider
 */
export function createS3StorageProvider(config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}): S3StorageProvider {
  return new S3StorageProvider({
    id: config.id || 's3-storage',
    name: config.name || 'AWS S3 Storage',
    mode: config.mode || 'hybrid',
    providerMode: config.providerMode || 'external',
    config: config.config || {},
    fallback: config.fallback,
  });
}

/**
 * Initialize S3 storage provider
 */
export async function initializeS3StorageProvider(
  config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}
): Promise<S3StorageProvider> {
  const provider = createS3StorageProvider(config);
  await provider.initialize();
  return provider;
}

/**
 * Default export
 */
export { S3StorageProvider as default };
