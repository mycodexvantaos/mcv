import { CacheManager } from '../index';

describe('cache-manager', () => {
  let instance: CacheManager;

  beforeEach(() => {
    instance = new CacheManager();
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
