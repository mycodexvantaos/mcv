/**
 * 🔒 MyCodeXvantaOS - Google Cloud Storage Provider
 *
 * Google Cloud Storage integration with R2 fallback.
 *
 * @module providers/storage/storage-gcs
 * @version 1.0.0
 */

export { GCSStorageProvider } from './gcs-storage-provider-cb';
export type { GCSStorageConfig, FileMetadata, UploadResult, DownloadResult, ListResult, DeleteResult } from './gcs-storage-provider-cb';

/**
 * Factory function to create GCS storage provider
 */
export function createGCSStorageProvider(config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}): GCSStorageProvider {
  return new GCSStorageProvider({
    id: config.id || 'gcs-storage',
    name: config.name || 'Google Cloud Storage',
    mode: config.mode || 'hybrid',
    providerMode: config.providerMode || 'external',
    config: config.config || {},
    fallback: config.fallback,
  });
}

/**
 * Initialize GCS storage provider
 */
export async function initializeGCSStorageProvider(
  config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}
): Promise<GCSStorageProvider> {
  const provider = createGCSStorageProvider(config);
  await provider.initialize();
  return provider;
}

/**
 * Default export
 */
export { GCSStorageProvider as default };
