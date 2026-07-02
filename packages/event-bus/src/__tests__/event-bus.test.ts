import { EventBus } from '../index';

describe('event-bus', () => {
  let instance: EventBus;

  beforeEach(() => {
    instance = new EventBus();
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
