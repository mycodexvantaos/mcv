/**
 * 🔒 MyCodeXvantaOS - Redis Cache Provider Exports
 *
 * @module providers/cache/cache-redis
 * @version 1.0.0
 */

export { RedisCacheProvider, default } from './redis-cache-provider-cb';
export type {
  RedisCacheConfig,
  CacheValue,
  CacheOptions,
  CacheResult,
} from './redis-cache-provider-cb';

/**
 * Create a Redis cache provider instance
 */
export function createRedisCacheProvider(
  id: string = 'cache-redis',
  config?: Partial<RedisCacheConfig>
) {
  const { RedisCacheProvider } = require('./redis-cache-provider-cb');
  
  return new RedisCacheProvider(
    id,
    'Redis Cache',
    {
      enabled: true,
      config: config || {},
    }
  );
}

/**
 * Initialize and return a Redis cache provider
 */
export async function initializeRedisCacheProvider(
  id: string = 'cache-redis',
  config?: Partial<RedisCacheConfig>
) {
  const provider = createRedisCacheProvider(id, config);
  await provider.initialize();
  return provider;
}