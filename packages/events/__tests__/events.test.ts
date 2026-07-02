/**
 * Comprehensive tests for Events package
 */

import { EventService, EventPayload, Subscription } from '../src/index';

describe('EventService', () => {
  let eventService: EventService;

  beforeEach(() => {
    eventService = new EventService();
  });

  afterEach(async () => {
    await eventService.cleanup();
  });

  describe('initialize', () => {
    it('should initialize the event service', async () => {
      await eventService.initialize();
      expect(eventService.getMaxListeners()).toBe(1000);
    });
  });

  describe('publish', () => {
    it('should publish an event and return event payload', async () => {
      await eventService.initialize();

      const event = {
        type: 'test-event',
        data: { message: 'Hello World' },
        source: 'test-suite',
      };

      const result = await eventService.publish(event);

      expect(result).toBeDefined();
      expect(result.type).toBe('test-event');
      expect(result.data).toEqual({ message: 'Hello World' });
      expect(result.source).toBe('test-suite');
      expect(result.id).toMatch(/^urn:mycodexvantaos:event:/);
      expect(result.timestamp).toBeDefined();
    });

    it('should use "unknown" as default source', async () => {
      const result = await eventService.publish({ type: 'test', data: {} });
      expect(result.source).toBe('unknown');
    });

    it('should add event to history', async () => {
      await eventService.publish({ type: 'event1', data: 'data1' });
      await eventService.publish({ type: 'event2', data: 'data2' });

      const history = await eventService.getHistory();
      expect(history.length).toBe(2);
    });

    it('should limit history size to 10000 events', async () => {
      for (let i = 0; i < 10005; i++) {
        await eventService.publish({ type: 'test', data: i });
      }

      const history = await eventService.getHistory();
      expect(history.length).toBe(10000);
      expect(history[0].data).toBe(5);
    });
  });

  describe('subscribe', () => {
    it('should create a subscription and return it', async () => {
      const callback = jest.fn();
      const result = await eventService.subscribe({
        eventPattern: 'test-event',
        callback,
      });

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^urn:mycodexvantaos:subscription:/);
      expect(result.eventPattern).toBe('test-event');
      expect(result.callback).toBe(callback);
    });

    it('should call callback when event is published', async () => {
      const callback = jest.fn();
      await eventService.subscribe({
        eventPattern: 'test-event',
        callback,
      });

      await eventService.publish({ type: 'test-event', data: 'test-data' });

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-event',
          data: 'test-data',
        })
      );
    });
  });

  describe('unsubscribe', () => {
    it('should remove subscription and return true', async () => {
      const callback = jest.fn();
      const subscription = await eventService.subscribe({
        eventPattern: 'test-event',
        callback,
      });

      const result = await eventService.unsubscribe(subscription.id);
      expect(result).toBe(true);

      // Verify callback is not called after unsubscribe
      await eventService.publish({ type: 'test-event', data: 'test' });
      expect(callback).not.toHaveBeenCalled();
    });

    it('should return false if subscription does not exist', async () => {
      const result = await eventService.unsubscribe('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('getHistory', () => {
    beforeEach(async () => {
      await eventService.publish({ type: 'event-a', data: 'a1' });
      await eventService.publish({ type: 'event-b', data: 'b1' });
      await eventService.publish({ type: 'event-a', data: 'a2' });
    });

    it('should return all events when no filter', async () => {
      const history = await eventService.getHistory();
      expect(history.length).toBe(3);
    });

    it('should filter by type', async () => {
      const history = await eventService.getHistory({ type: 'event-a' });
      expect(history.length).toBe(2);
      expect(history.every((e) => e.type === 'event-a')).toBe(true);
    });

    it('should limit results', async () => {
      const history = await eventService.getHistory({ limit: 2 });
      expect(history.length).toBe(2);
    });
  });

  describe('execute', () => {
    it('should execute publish action', async () => {
      const result = await eventService.execute({
        action: 'publish',
        data: { type: 'test', data: 'hello' },
      });

      expect(result.type).toBe('test');
    });

    it('should execute subscribe action', async () => {
      const callback = jest.fn();
      const result = (await eventService.execute({
        action: 'subscribe',
        data: { eventPattern: 'test', callback },
      })) as Subscription;

      expect(result.eventPattern).toBe('test');
    });

    it('should execute unsubscribe action', async () => {
      const sub = await eventService.subscribe({ eventPattern: 'test', callback: () => {} });
      const result = await eventService.execute({
        action: 'unsubscribe',
        data: sub.id,
      });

      expect(result).toBe(true);
    });

    it('should execute getHistory action', async () => {
      await eventService.publish({ type: 'test', data: 'data' });
      const result = await eventService.execute({
        action: 'getHistory',
        data: {},
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw error for unknown action', async () => {
      await expect(
        eventService.execute({
          action: 'unknown',
          data: {},
        })
      ).rejects.toThrow('Unknown event action: unknown');
    });
  });

  describe('cleanup', () => {
    it('should clear all subscriptions and history', async () => {
      await eventService.subscribe({ eventPattern: 'test', callback: () => {} });
      await eventService.publish({ type: 'test', data: 'data' });

      await eventService.cleanup();

      const history = await eventService.getHistory();
      expect(history.length).toBe(0);
    });
  });
});
