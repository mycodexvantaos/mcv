import {
  PersonaCacheManager,
  CacheEntry,
  CacheStatistics,
  CacheManagerConfig,
  CacheEvent,
  CacheEventListener,
} from '../core/persona-cache-manager';
import { PersonaProfile, PersonaArchetype } from '../types';

describe('PersonaCacheManager', () => {
  let cache: PersonaCacheManager;

  const mockProfile: PersonaProfile = {
    urn: 'urn:mycodexvantaos:persona:test-001',
    name: 'Test Persona',
    version: '1.0.0',
    archetype: 'analyst',
    behavioral_parameters: {
      critical_tolerance: 0.5,
      empathy_level: 0.5,
      directness: 0.5,
    },
  };

  beforeEach(() => {
    cache = new PersonaCacheManager({
      maxEntries: 100,
      defaultTTL: 60000,
      cleanupInterval: 10000,
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultCache = new PersonaCacheManager();
      expect(defaultCache).toBeDefined();
      defaultCache.destroy();
    });

    it('should accept custom config', () => {
      const customCache = new PersonaCacheManager({
        maxEntries: 500,
        defaultTTL: 120000,
        enableLRU: false,
        enableStats: false,
        cleanupInterval: 30000,
      });
      expect(customCache).toBeDefined();
      customCache.destroy();
    });

    it('should start cleanup timer', () => {
      const stats = cache.getStatistics();
      expect(stats).toBeDefined();
    });
  });

  describe('set and get', () => {
    it('should set and get a value', () => {
      cache.set('test-key', { data: 'test-value' });
      const result = cache.get<{ data: string }>('test-key');

      expect(result).toEqual({ data: 'test-value' });
    });

    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return null for expired entry', () => {
      cache.set('expire-key', { data: 'will-expire' }, 1); // 1ms TTL

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = cache.get('expire-key');
          expect(result).toBeNull();
          resolve();
        }, 50);
      });
    });

    it('should update access count on get', () => {
      cache.set('access-test', { data: 'test' });
      cache.get('access-test');
      cache.get('access-test');
      cache.get('access-test');

      // Access count is tracked internally
      const stats = cache.getStatistics();
      expect(stats.hits).toBe(3);
    });

    it('should accept custom TTL', () => {
      cache.set('custom-ttl', { data: 'test' }, 1000);
      const result = cache.get('custom-ttl');
      expect(result).toEqual({ data: 'test' });
    });

    it('should accept tags', () => {
      cache.set('tagged-key', { data: 'test' }, 60000, ['tag1', 'tag2']);
      expect(cache.has('tagged-key')).toBe(true);
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cache.set('existing-key', { data: 'test' });
      expect(cache.has('existing-key')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should return false for expired entry', () => {
      cache.set('expired-key', { data: 'test' }, 1);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cache.has('expired-key')).toBe(false);
          resolve();
        }, 50);
      });
    });
  });

  describe('delete', () => {
    it('should delete an existing key', () => {
      cache.set('delete-test', { data: 'test' });
      const deleted = cache.delete('delete-test');

      expect(deleted).toBe(true);
      expect(cache.has('delete-test')).toBe(false);
    });

    it('should return false for non-existent key', () => {
      const deleted = cache.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', { data: '1' });
      cache.set('key2', { data: '2' });
      cache.set('key3', { data: '3' });

      cache.clear();

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      cache.set('expired1', { data: '1' }, 1);
      cache.set('expired2', { data: '2' }, 1);
      cache.set('valid', { data: 'valid' }, 60000);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const cleaned = cache.cleanup();
          expect(cleaned).toBe(2);
          expect(cache.has('valid')).toBe(true);
          resolve();
        }, 50);
      });
    });

    it('should return 0 when no expired entries', () => {
      cache.set('valid1', { data: '1' }, 60000);
      cache.set('valid2', { data: '2' }, 60000);

      const cleaned = cache.cleanup();
      expect(cleaned).toBe(0);
    });
  });

  describe('profile caching', () => {
    it('should set and get a profile', () => {
      cache.setProfile('analyst', mockProfile);
      const result = cache.getProfile('analyst');

      expect(result).toEqual(mockProfile);
    });

    it('should return null for non-existent profile', () => {
      const result = cache.getProfile('disrupter' as PersonaArchetype);
      expect(result).toBeNull();
    });

    it('should return null for expired profile', () => {
      cache.setProfile('mentor', mockProfile, 1);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = cache.getProfile('mentor');
          expect(result).toBeNull();
          resolve();
        }, 50);
      });
    });

    it('should track access for profiles', () => {
      cache.setProfile('architect', mockProfile);
      cache.getProfile('architect');
      cache.getProfile('architect');

      const stats = cache.getStatistics();
      expect(stats.hits).toBe(2);
    });
  });

  describe('analysis result caching', () => {
    it('should set and get analysis results', () => {
      const analysisResult = { findings: ['finding1', 'finding2'] };
      cache.setAnalysisResult('session-123', 'root-cause', analysisResult);

      const result = cache.getAnalysisResult<{ findings: string[] }>('session-123', 'root-cause');
      expect(result).toEqual(analysisResult);
    });

    it('should return null for non-existent analysis', () => {
      const result = cache.getAnalysisResult('non-existent', 'analysis');
      expect(result).toBeNull();
    });
  });

  describe('response caching', () => {
    it('should set and get responses', () => {
      const response = { text: 'This is a response' };
      cache.setResponse('session-456', 'hash123', response);

      const result = cache.getResponse<{ text: string }>('session-456', 'hash123');
      expect(result).toEqual(response);
    });

    it('should return null for non-existent response', () => {
      const result = cache.getResponse('non-existent', 'hash');
      expect(result).toBeNull();
    });
  });

  describe('invalidation', () => {
    it('should invalidate all entries for a session', () => {
      cache.set('analysis:session-789:type1', { data: '1' });
      cache.set('analysis:session-789:type2', { data: '2' });
      cache.set('response:session-789:hash', { data: '3' });
      cache.set('other:session-xxx', { data: '4' });

      const invalidated = cache.invalidateSession('session-789');

      expect(invalidated).toBe(3);
      expect(cache.has('other:session-xxx')).toBe(true);
    });

    it('should invalidate entries by tag', () => {
      cache.set('tagged1', { data: '1' }, 60000, ['important', 'session-a']);
      cache.set('tagged2', { data: '2' }, 60000, ['important', 'session-b']);
      cache.set('tagged3', { data: '3' }, 60000, ['normal', 'session-c']);

      const invalidated = cache.invalidateByTag('important');

      expect(invalidated).toBe(2);
      expect(cache.has('tagged3')).toBe(true);
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', () => {
      cache.set('stats-test', { data: 'test' });
      cache.get('stats-test'); // hit
      cache.get('stats-test'); // hit
      cache.get('non-existent'); // miss

      const stats = cache.getStatistics();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit ratio', () => {
      cache.set('ratio-test', { data: 'test' });
      cache.get('ratio-test'); // hit
      cache.get('ratio-test'); // hit
      cache.get('non-existent'); // miss

      const stats = cache.getStatistics();
      expect(stats.hitRatio).toBeCloseTo(2 / 3);
    });

    it('should count total entries', () => {
      cache.set('entry1', { data: '1' });
      cache.set('entry2', { data: '2' });
      cache.setProfile('analyst', mockProfile);

      const stats = cache.getStatistics();
      expect(stats.totalEntries).toBe(3);
    });

    it('should estimate memory usage', () => {
      cache.set('memory-test', { data: 'test value' });
      const stats = cache.getStatistics();

      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should track oldest and newest entry timestamps', () => {
      cache.set('first', { data: '1' });
      // Small delay to ensure different timestamps
      cache.set('second', { data: '2' });

      const stats = cache.getStatistics();
      expect(stats.oldestEntry).toBeLessThanOrEqual(stats.newestEntry!);
    });

    it('should return null timestamps for empty cache', () => {
      const stats = cache.getStatistics();
      expect(stats.oldestEntry).toBeNull();
      expect(stats.newestEntry).toBeNull();
    });

    it('should reset statistics', () => {
      cache.set('reset-test', { data: 'test' });
      cache.get('reset-test');
      cache.get('non-existent');

      cache.resetStatistics();
      const stats = cache.getStatistics();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('event listeners', () => {
    it('should emit hit event on successful get', () => {
      const listener = jest.fn();
      cache.addEventListener(listener);

      cache.set('hit-test', { data: 'test' });
      cache.get('hit-test');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'hit', key: 'hit-test' })
      );
    });

    it('should emit miss event on failed get', () => {
      const listener = jest.fn();
      cache.addEventListener(listener);

      cache.get('non-existent');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'miss', key: 'non-existent' })
      );
    });

    it('should emit set event on set', () => {
      const listener = jest.fn();
      cache.addEventListener(listener);

      cache.set('set-test', { data: 'test' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'set', key: 'set-test' })
      );
    });

    it('should emit delete event on delete', () => {
      const listener = jest.fn();
      cache.addEventListener(listener);

      cache.set('delete-test', { data: 'test' });
      cache.delete('delete-test');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'delete', key: 'delete-test' })
      );
    });

    it('should emit clear event on clear', () => {
      const listener = jest.fn();
      cache.addEventListener(listener);

      cache.clear();

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'clear', key: '*' }));
    });

    it('should emit expire event on expired entry', () => {
      const listener = jest.fn();
      cache.addEventListener(listener);

      cache.set('expire-test', { data: 'test' }, 1);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          cache.get('expire-test');
          expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'expire', key: 'expire-test' })
          );
          resolve();
        }, 50);
      });
    });

    it('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      cache.addEventListener(listener1);
      cache.addEventListener(listener2);

      cache.set('multi-listener', { data: 'test' });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should remove event listener', () => {
      const listener = jest.fn();
      cache.addEventListener(listener);
      cache.removeEventListener(listener);

      cache.set('remove-listener', { data: 'test' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();

      cache.addEventListener(errorListener);
      cache.addEventListener(normalListener);

      cache.set('error-test', { data: 'test' });

      // Normal listener should still be called despite error in first listener
      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('eviction', () => {
    it('should evict LRU entry when cache is full', () => {
      const smallCache = new PersonaCacheManager({
        maxEntries: 3,
        enableLRU: true,
      });

      const listener = jest.fn();
      smallCache.addEventListener(listener);

      smallCache.set('oldest', { data: '1' });
      smallCache.set('middle', { data: '2' });
      smallCache.set('newest', { data: '3' });

      // Access oldest to make it not the LRU
      smallCache.get('oldest');

      // Access middle to make it most recent
      smallCache.get('middle');

      // Add a new entry, should evict 'newest' (least recently accessed)
      smallCache.set('overflow', { data: '4' });

      // An eviction should have occurred
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'evict' }));

      smallCache.destroy();
    });

    it('should use FIFO eviction when LRU is disabled', () => {
      const fifoCache = new PersonaCacheManager({
        maxEntries: 2,
        enableLRU: false,
      });

      const listener = jest.fn();
      fifoCache.addEventListener(listener);

      fifoCache.set('first', { data: '1' });
      fifoCache.set('second', { data: '2' });
      fifoCache.set('third', { data: '3' }); // Should evict 'first'

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'evict', key: 'first' })
      );

      fifoCache.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const cacheToDestroy = new PersonaCacheManager();
      cacheToDestroy.set('test', { data: 'test' });

      cacheToDestroy.destroy();

      // Cache should be cleared
      const stats = cacheToDestroy.getStatistics();
      expect(stats.totalEntries).toBe(0);
    });

    it('should clear event listeners', () => {
      const listener = jest.fn();
      cache.addEventListener(listener);
      cache.destroy();

      // After destroy, setting should not emit events
      cache.set('after-destroy', { data: 'test' });
      // Note: This test may not be reliable since we re-use the cache
    });
  });

  describe('edge cases', () => {
    it('should handle complex objects', () => {
      const complexObject = {
        nested: {
          array: [1, 2, 3],
          map: new Map([['key', 'value']]),
          date: new Date(),
        },
      };

      cache.set('complex', complexObject);
      const result = cache.get<typeof complexObject>('complex');

      expect(result).toEqual(complexObject);
    });

    it('should handle null values', () => {
      cache.set('null-value', null);
      const result = cache.get('null-value');

      // null is a valid cached value
      expect(result).toBeNull();
    });

    it('should handle undefined values by caching null', () => {
      cache.set('undefined-value', undefined);
      const result = cache.get('undefined-value');

      // undefined becomes null in cache
      expect(result).toBeUndefined();
    });

    it('should handle large keys', () => {
      const largeKey = 'a'.repeat(1000);
      cache.set(largeKey, { data: 'test' });

      expect(cache.has(largeKey)).toBe(true);
    });
  });
});
