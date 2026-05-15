/**
 * 🔒 MyCodeXvantaOS - Memory Storage Provider
 *
 * In-memory storage with zero external dependencies.
 *
 * @module providers/storage/storage-memory
 * @version 1.0.0
 */

export { MemoryStorageProvider } from './storage-memory-provider-cb';
export type { MemoryStorageConfig, FileMetadata, UploadResult, DownloadResult, ListResult, DeleteResult } from './storage-memory-provider-cb';

/**
 * Factory function to create memory storage provider
 */
export function createMemoryStorageProvider(config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}): MemoryStorageProvider {
  return new MemoryStorageProvider({
    id: config.id || 'memory-storage',
    name: config.name || 'Memory Storage',
    mode: config.mode || 'native',
    providerMode: config.providerMode || 'native',
    config: config.config || {},
    fallback: config.fallback,
  });
}

/**
 * Initialize memory storage provider
 */
export async function initializeMemoryStorageProvider(
  config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}
): Promise<MemoryStorageProvider> {
  const provider = createMemoryStorageProvider(config);
  await provider.initialize();
  return provider;
}

/**
 * Default export
 */
export { MemoryStorageProvider as default };
