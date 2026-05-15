import { MemoryCacheProvider } from './memory-cache-provider-cb';
import type { MemoryCacheConfig } from './memory-cache-provider-cb';
/**
 * 🔒 MyCodeXvantaOS - Memory Cache Provider Exports
 *
 * @module providers/cache/cache-memory
 * @version 1.0.0
 */

export { MemoryCacheProvider, default } from './memory-cache-provider-cb';
export type {
  MemoryCacheConfig,
  CacheValue,
  CacheOptions,
  CacheResult,
} from './memory-cache-provider-cb';

/**
 * Create a memory cache provider instance
 */
export function createMemoryCacheProvider(
  id: string = 'cache-memory',
  config?: Partial<MemoryCacheConfig>
) {
  const { MemoryCacheProvider } = require('./memory-cache-provider-cb');

  return new MemoryCacheProvider(id, 'Memory Cache', {
    enabled: true,
    config: config || {},
  });
}

/**
 * Initialize and return a memory cache provider
 */
export async function initializeMemoryCacheProvider(
  id: string = 'cache-memory',
  config?: Partial<MemoryCacheConfig>
) {
  const provider = createMemoryCacheProvider(id, config);
  await provider.initialize();
  return provider;
}
