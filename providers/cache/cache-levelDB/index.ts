/**
 * 🔒 MyCodeXvantaOS - LevelDB Cache Provider Exports
 *
 * @module providers/cache/cache-levelDB
 * @version 1.0.0
 */

export { LevelDBCacheProvider, default } from './leveldb-cache-provider-cb';
export type {
  LevelDBCacheConfig,
  CacheValue,
  CacheOptions,
  CacheResult,
} from './leveldb-cache-provider-cb';

/**
 * Create a LevelDB cache provider instance
 */
export function createLevelDBCacheProvider(
  id: string = 'cache-levelDB',
  config?: Partial<LevelDBCacheConfig>
) {
  const { LevelDBCacheProvider } = require('./leveldb-cache-provider-cb');
  
  return new LevelDBCacheProvider(
    id,
    'LevelDB Cache',
    {
      enabled: true,
      config: config || {},
    }
  );
}

/**
 * Initialize and return a LevelDB cache provider
 */
export async function initializeLevelDBCacheProvider(
  id: string = 'cache-levelDB',
  config?: Partial<LevelDBCacheConfig>
) {
  const provider = createLevelDBCacheProvider(id, config);
  await provider.initialize();
  return provider;
}