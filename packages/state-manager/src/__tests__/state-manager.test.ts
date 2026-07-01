import { StateManager } from '../index';

describe('state-manager', () => {
  let instance: StateManager;

  beforeEach(() => {
    instance = new StateManager();
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
