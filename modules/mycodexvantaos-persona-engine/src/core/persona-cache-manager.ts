/**
 * Persona Cache Manager for MyCodeXvantaOS Persona Engine
 *
 * Provides intelligent caching for persona profiles, processed responses,
 * and analysis results to improve performance and reduce redundant computation.
 *
 * @module mycodexvantaos-persona-engine/core/persona-cache-manager
 */

import { PersonaProfile, PersonaArchetype } from '../types';

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  /** The cached value */
  value: T;
  /** Timestamp when cached */
  cachedAt: number;
  /** Time-to-live in milliseconds */
  ttl: number;
  /** Access count */
  accessCount: number;
  /** Last access timestamp */
  lastAccessed: number;
  /** Entry tags for filtering */
  tags: string[];
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  /** Total entries in cache */
  totalEntries: number;
  /** Cache hit count */
  hits: number;
  /** Cache miss count */
  misses: number;
  /** Hit ratio (0-1) */
  hitRatio: number;
  /** Total memory usage estimate in bytes */
  memoryUsage: number;
  /** Oldest entry timestamp */
  oldestEntry: number | null;
  /** Newest entry timestamp */
  newestEntry: number | null;
}

/**
 * Cache configuration options
 */
export interface CacheManagerConfig {
  /** Maximum number of entries */
  maxEntries: number;
  /** Default time-to-live in milliseconds */
  defaultTTL: number;
  /** Enable LRU (Least Recently Used) eviction */
  enableLRU: boolean;
  /** Enable statistics tracking */
  enableStats: boolean;
  /** Cleanup interval in milliseconds */
  cleanupInterval: number;
}

/**
 * Events emitted by the cache manager
 */
export interface CacheEvent {
  type: 'hit' | 'miss' | 'set' | 'delete' | 'evict' | 'expire' | 'clear';
  key: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

/**
 * Event listener type
 */
export type CacheEventListener = (event: CacheEvent) => void;

/**
 * PersonaCacheManager provides intelligent caching for the persona engine
 *
 * @example
 * ```typescript
 * const cache = new PersonaCacheManager({
 *   maxEntries: 1000,
 *   defaultTTL: 300000 // 5 minutes
 * });
 *
 * cache.setProfile('disrupter', profile);
 * const cached = cache.getProfile('disrupter');
 * ```
 */
export class PersonaCacheManager {
  private config: CacheManagerConfig;
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private profileCache: Map<PersonaArchetype, CacheEntry<PersonaProfile>> = new Map();
  private stats = { hits: 0, misses: 0 };
  private eventListeners: CacheEventListener[] = [];
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(config: Partial<CacheManagerConfig> = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 1000,
      defaultTTL: config.defaultTTL ?? 300000, // 5 minutes default
      enableLRU: config.enableLRU ?? true,
      enableStats: config.enableStats ?? true,
      cleanupInterval: config.cleanupInterval ?? 60000, // 1 minute
    };

    this.startCleanupTimer();
  }

  /**
   * Starts the automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Emits a cache event to all listeners
   */
  private emitEvent(
    type: CacheEvent['type'],
    key: string,
    details?: Record<string, unknown>
  ): void {
    const event: CacheEvent = {
      type,
      key,
      timestamp: Date.now(),
      details,
    };

    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in cache event listener:', error);
      }
    });
  }

  /**
   * Generates a cache key with optional namespace
   */
  private generateKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  /**
   * Checks if an entry is expired
   */
  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.cachedAt > entry.ttl;
  }

  /**
   * Evicts entries if cache is full
   */
  private evictIfNeeded(): void {
    if (this.cache.size >= this.config.maxEntries) {
      if (this.config.enableLRU) {
        // Find and remove the least recently used entry
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
          if (entry.lastAccessed < oldestTime) {
            oldestTime = entry.lastAccessed;
            oldestKey = key;
          }
        }

        if (oldestKey) {
          this.cache.delete(oldestKey);
          this.emitEvent('evict', oldestKey, { reason: 'lru' });
        }
      } else {
        // Remove the first entry (FIFO)
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
          this.emitEvent('evict', firstKey, { reason: 'fifo' });
        }
      }
    }
  }

  /**
   * Sets a value in the cache
   */
  set<T>(key: string, value: T, ttl: number = this.config.defaultTTL, tags: string[] = []): void {
    this.evictIfNeeded();

    const entry: CacheEntry<T> = {
      value,
      cachedAt: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags,
    };

    this.cache.set(key, entry);
    this.emitEvent('set', key, { ttl, tags });
  }

  /**
   * Gets a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      if (this.config.enableStats) this.stats.misses++;
      this.emitEvent('miss', key);
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.config.enableStats) this.stats.misses++;
      this.emitEvent('expire', key);
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    if (this.config.enableStats) this.stats.hits++;
    this.emitEvent('hit', key, { accessCount: entry.accessCount });

    return entry.value;
  }

  /**
   * Checks if a key exists in the cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Deletes a key from the cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.emitEvent('delete', key);
    }
    return deleted;
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.profileCache.clear();
    this.emitEvent('clear', '*');
  }

  /**
   * Cleans up expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.cachedAt > entry.ttl) {
        this.cache.delete(key);
        this.emitEvent('expire', key);
        cleaned++;
      }
    }

    return cleaned;
  }

  // ============================================
  // Persona-specific caching methods
  // ============================================

  /**
   * Caches a persona profile
   */
  setProfile(archetype: PersonaArchetype, profile: PersonaProfile, ttl?: number): void {
    const entry: CacheEntry<PersonaProfile> = {
      value: profile,
      cachedAt: Date.now(),
      ttl: ttl ?? this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags: ['profile', archetype],
    };

    this.profileCache.set(archetype, entry);
    this.emitEvent('set', `profile:${archetype}`, { archetype });
  }

  /**
   * Gets a cached persona profile
   */
  getProfile(archetype: PersonaArchetype): PersonaProfile | null {
    const entry = this.profileCache.get(archetype);

    if (!entry) {
      if (this.config.enableStats) this.stats.misses++;
      this.emitEvent('miss', `profile:${archetype}`);
      return null;
    }

    if (this.isExpired(entry)) {
      this.profileCache.delete(archetype);
      if (this.config.enableStats) this.stats.misses++;
      this.emitEvent('expire', `profile:${archetype}`);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();

    if (this.config.enableStats) this.stats.hits++;
    this.emitEvent('hit', `profile:${archetype}`);

    return entry.value;
  }

  /**
   * Caches an analysis result
   */
  setAnalysisResult(sessionId: string, analysisType: string, result: unknown, ttl?: number): void {
    const key = this.generateKey('analysis', `${sessionId}:${analysisType}`);
    this.set(key, result, ttl, ['analysis', analysisType]);
  }

  /**
   * Gets a cached analysis result
   */
  getAnalysisResult<T>(sessionId: string, analysisType: string): T | null {
    const key = this.generateKey('analysis', `${sessionId}:${analysisType}`);
    return this.get<T>(key);
  }

  /**
   * Caches a processed response
   */
  setResponse(sessionId: string, inputHash: string, response: unknown, ttl?: number): void {
    const key = this.generateKey('response', `${sessionId}:${inputHash}`);
    this.set(key, response, ttl, ['response', sessionId]);
  }

  /**
   * Gets a cached response
   */
  getResponse<T>(sessionId: string, inputHash: string): T | null {
    const key = this.generateKey('response', `${sessionId}:${inputHash}`);
    return this.get<T>(key);
  }

  /**
   * Invalidates all cache entries for a session
   */
  invalidateSession(sessionId: string): number {
    let invalidated = 0;

    for (const [key] of this.cache.entries()) {
      if (key.includes(sessionId)) {
        this.cache.delete(key);
        this.emitEvent('delete', key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Invalidates all entries with a specific tag
   */
  invalidateByTag(tag: string): number {
    let invalidated = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        this.emitEvent('delete', key);
        invalidated++;
      }
    }

    return invalidated;
  }

  // ============================================
  // Statistics and monitoring
  // ============================================

  /**
   * Gets cache statistics
   */
  getStatistics(): CacheStatistics {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map((e) => e.cachedAt);

    let memoryUsage = 0;
    try {
      memoryUsage = JSON.stringify(entries).length * 2; // Rough estimate
    } catch {
      memoryUsage = 0;
    }

    return {
      totalEntries: this.cache.size + this.profileCache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRatio:
        this.stats.hits + this.stats.misses > 0
          ? this.stats.hits / (this.stats.hits + this.stats.misses)
          : 0,
      memoryUsage,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }

  /**
   * Resets statistics
   */
  resetStatistics(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Adds an event listener
   */
  addEventListener(listener: CacheEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Removes an event listener
   */
  removeEventListener(listener: CacheEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Destroys the cache manager and cleans up resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
    this.eventListeners = [];
  }
}

export default PersonaCacheManager;
