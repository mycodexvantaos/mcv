/**
 * 📦 Native Memory Cache Provider Exports
 *
 * @module providers/native/memory-cache
 * @version 1.0.0
 */

export { MemoryCache } from './memory-cache-cb';
export type { MemoryCacheConfig } from './memory-cache-cb';

/**
 * Create a native memory cache provider instance
 */
export function createNativeMemoryCacheProvider(
  id: string = 'native-memory-cache',
  config?: Partial<import('./memory-cache-cb').MemoryCacheConfig>
) {
  const { MemoryCache } = require('./memory-cache-cb');

  return new MemoryCache(id, 'Native Memory Cache', {
    mode: 'native' as any,
    providerMode: 'native' as any,
    config: config || {},
  });
}

/**
 * Initialize and return a native memory cache provider
 */
export async function initializeNativeMemoryCacheProvider(
  id: string = 'native-memory-cache',
  config?: Partial<import('./memory-cache-cb').MemoryCacheConfig>
) {
  const provider = createNativeMemoryCacheProvider(id, config);
  await provider.initialize();
  return provider;
}
