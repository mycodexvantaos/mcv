import { Analytics } from '../index';

describe('analytics', () => {
  let instance: Analytics;

  beforeEach(() => {
    instance = new Analytics();
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
