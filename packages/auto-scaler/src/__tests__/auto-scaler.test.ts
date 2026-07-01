import { AutoScaler } from '../index';

describe('auto-scaler', () => {
  let instance: AutoScaler;

  beforeEach(() => {
    instance = new AutoScaler();
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
