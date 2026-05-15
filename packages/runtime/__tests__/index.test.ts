/**
 * @jest-environment node
 */

import { Runtime, runtime } from '../src/index';

describe('Runtime Package', () => {
  let rt: Runtime;

  beforeEach(() => {
    rt = new Runtime();
  });

  afterEach(async () => {
    await rt.cleanup();
  });

  describe('initialize', () => {
    it('should initialize the runtime', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await rt.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Runtime initialized in native mode');
      consoleSpy.mockRestore();
    });

    it('should emit initialized event', async () => {
      const eventHandler = jest.fn();
      rt.on('initialized', eventHandler);

      await rt.initialize();

      expect(eventHandler).toHaveBeenCalledWith({ environment: 'native' });
    });
  });

  describe('execute', () => {
    it('should execute an application', async () => {
      await rt.initialize();

      const result = await rt.execute({
        application: { id: 'app-1', name: 'test-app' },
      });

      expect(result.output).toBeDefined();
      expect(result.output.message).toBe('Application executed successfully');
      expect(result.output.application).toBe('test-app');
      expect(result.metrics).toBeDefined();
      expect(result.errors).toEqual([]);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should emit executed event', async () => {
      await rt.initialize();

      const eventHandler = jest.fn();
      rt.on('executed', eventHandler);

      await rt.execute({
        application: { id: 'app-1', name: 'test-app' },
      });

      expect(eventHandler).toHaveBeenCalledWith({
        appId: 'app-1',
        result: expect.objectContaining({
          output: expect.any(Object),
          metrics: expect.any(Object),
          errors: [],
        }),
      });
    });

    it('should register application if not already registered', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await rt.initialize();

      await rt.execute({
        application: { id: 'app-1', name: 'test-app' },
      });

      expect(consoleSpy).toHaveBeenCalledWith('Application registered: app-1');
      consoleSpy.mockRestore();
    });

    it('should not register application if already registered', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await rt.initialize();

      await rt.execute({
        application: { id: 'app-1', name: 'test-app' },
      });

      // Clear the mock to reset call count
      consoleSpy.mockClear();

      // Execute again with same app
      await rt.execute({
        application: { id: 'app-1', name: 'test-app' },
      });

      // Should not register again
      expect(consoleSpy).not.toHaveBeenCalledWith('Application registered: app-1');
      consoleSpy.mockRestore();
    });

    it('should include input in execution', async () => {
      await rt.initialize();

      const result = await rt.execute({
        application: { id: 'app-1', name: 'test-app' },
        input: { data: 'test-data' },
      });

      expect(result.output).toBeDefined();
    });

    it('should include context in execution', async () => {
      await rt.initialize();

      const result = await rt.execute({
        application: { id: 'app-1', name: 'test-app' },
        context: { userId: 'user-1' },
      });

      expect(result.output).toBeDefined();
    });

    it('should return error when application is missing', async () => {
      await rt.initialize();

      // Add error listener to prevent unhandled error
      rt.on('error', () => {});

      // The runtime catches errors and returns them in the errors array
      const result = await rt.execute({
        application: null,
      } as any);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Invalid request: application.id is required');
      expect(result.output).toBeNull();
    });

    it('should return error when application.id is missing', async () => {
      await rt.initialize();

      // Add error listener to prevent unhandled error
      rt.on('error', () => {});

      const result = await rt.execute({
        application: { name: 'test-app' },
      } as any);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Invalid request: application.id is required');
    });

    it('should emit error event on failure', async () => {
      await rt.initialize();

      const eventHandler = jest.fn();
      rt.on('error', eventHandler);

      await rt.execute({
        application: null,
      } as any);

      expect(eventHandler).toHaveBeenCalled();
    });

    it('should collect metrics', async () => {
      await rt.initialize();

      const result = await rt.execute({
        application: { id: 'app-1', name: 'test-app' },
      });

      expect(result.metrics.appId).toBe('app-1');
      expect(result.metrics.executionTime).toBeDefined();
      expect(result.metrics.memoryUsage).toBeDefined();
      expect(result.metrics.environment).toBe('native');
    });
  });

  describe('getMetrics', () => {
    it('should return runtime metrics', async () => {
      await rt.initialize();

      await rt.execute({
        application: { id: 'app-1', name: 'test-app' },
      });

      const metrics = rt.getMetrics();

      expect(metrics.runningApplications).toBe(1);
      expect(metrics.metrics).toBeDefined();
    });

    it('should return empty metrics initially', () => {
      const metrics = rt.getMetrics();

      expect(metrics.runningApplications).toBe(0);
      expect(metrics.metrics).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('should clear all resources', async () => {
      await rt.initialize();

      await rt.execute({
        application: { id: 'app-1', name: 'test-app' },
      });

      await rt.cleanup();

      const metrics = rt.getMetrics();
      expect(metrics.runningApplications).toBe(0);
    });

    it('should log cleanup message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await rt.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith('Runtime cleaned up');
      consoleSpy.mockRestore();
    });
  });

  describe('EventEmitter functionality', () => {
    it('should be an EventEmitter', () => {
      const EventEmitter = require('events').EventEmitter;
      expect(rt).toBeInstanceOf(EventEmitter);
    });

    it('should emit and receive events', () => {
      const handler = jest.fn();
      rt.on('test-event', handler);
      rt.emit('test-event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  describe('default export', () => {
    it('should export a default Runtime instance', () => {
      expect(runtime).toBeInstanceOf(Runtime);
    });
  });
});
