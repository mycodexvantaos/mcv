/**
 * 🔒 MyCodeXvantaOS - Cloudflare R2 Storage Provider
 *
 * Cloudflare R2 storage integration with S3 fallback.
 *
 * @module providers/storage/storage-r2
 * @version 1.0.0
 */

export { R2StorageProvider } from './r2-storage-provider-cb';
export type { R2StorageConfig, FileMetadata, UploadResult, DownloadResult, ListResult, DeleteResult } from './r2-storage-provider-cb';

/**
 * Factory function to create R2 storage provider
 */
export function createR2StorageProvider(config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}): R2StorageProvider {
  return new R2StorageProvider({
    id: config.id || 'r2-storage',
    name: config.name || 'Cloudflare R2 Storage',
    mode: config.mode || 'hybrid',
    providerMode: config.providerMode || 'external',
    config: config.config || {},
    fallback: config.fallback,
  });
}

/**
 * Initialize R2 storage provider
 */
export async function initializeR2StorageProvider(
  config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}
): Promise<R2StorageProvider> {
  const provider = createR2StorageProvider(config);
  await provider.initialize();
  return provider;
}

/**
 * Default export
 */
export { R2StorageProvider as default };
