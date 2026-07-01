import { MessageQueue } from '../index';

describe('message-queue', () => {
  let instance: MessageQueue;

  beforeEach(() => {
    instance = new MessageQueue();
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
