/**
 * MyCodeXvantaOS Cache Manager
 * Provides distributed caching with TTL and eviction policies
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 3600000) {
    // 1 hour default
    this.defaultTTL = defaultTTL;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.cache.set(key, {
      key,
      value,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
      createdAt: Date.now(),
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
}

export default CacheManager;
