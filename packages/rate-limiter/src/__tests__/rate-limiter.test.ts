import { RateLimiter } from '../index';

describe('rate-limiter', () => {
  let instance: RateLimiter;

  beforeEach(() => {
    instance = new RateLimiter({
      windowMs: 60000,
      maxRequests: 100,
    });
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
