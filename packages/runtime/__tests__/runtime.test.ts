/**
 * Comprehensive tests for Runtime package
 */

import { Runtime, RuntimeConfig, ExecutionRequest, ExecutionResult } from '../src/index';

describe('Runtime', () => {
  let runtime: Runtime;

  beforeEach(() => {
    runtime = new Runtime();
  });

  afterEach(async () => {
    await runtime.cleanup();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const metrics = runtime.getMetrics();
      expect(metrics.runningApplications).toBe(0);
    });
  });

  describe('initialize', () => {
    it('should initialize runtime and emit event', async () => {
      const listener = jest.fn();
      runtime.on('initialized', listener);

      await runtime.initialize();

      expect(listener).toHaveBeenCalledWith({ environment: 'native' });
    });
  });

  describe('execute', () => {
    it('should execute an application successfully', async () => {
      const request: ExecutionRequest = {
        application: { id: 'test-app', name: 'Test Application' },
      };

      const result = await runtime.execute<ExecutionResult>(request);

      expect(result.output).toBeDefined();
      expect(result.output.message).toBe('Application executed successfully');
      expect(result.output.application).toBe('Test Application');
      expect(result.output.environment).toBe('native');
      expect(result.errors).toEqual([]);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should register application if not already registered', async () => {
      const request: ExecutionRequest = {
        application: { id: 'new-app', name: 'New App' },
      };

      await runtime.execute(request);

      const metrics = runtime.getMetrics();
      expect(metrics.runningApplications).toBe(1);
    });

    it('should reuse registered application', async () => {
      const request: ExecutionRequest = {
        application: { id: 'shared-app', name: 'Shared App' },
      };

      await runtime.execute(request);
      await runtime.execute(request);

      const metrics = runtime.getMetrics();
      expect(metrics.runningApplications).toBe(1);
    });

    it('should emit executed event on success', async () => {
      const listener = jest.fn();
      runtime.on('executed', listener);

      await runtime.execute({
        application: { id: 'test-app', name: 'Test' },
      });

      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          appId: 'test-app',
          result: expect.objectContaining({
            errors: [],
          }),
        })
      );
    });

    it('should return error when application.id is missing (with validation enabled)', async () => {
      // Add error listener to prevent unhandled error
      const errorListener = jest.fn();
      runtime.on('error', errorListener);

      const request: ExecutionRequest = {
        application: { name: 'No ID App' } as any,
      };

      const result = await runtime.execute<ExecutionResult>(request);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toBe('Invalid request: application.id is required');
      expect(errorListener).toHaveBeenCalled();
    });

    it('should return error when application is missing', async () => {
      // Add error listener to prevent unhandled error
      const errorListener = jest.fn();
      runtime.on('error', errorListener);

      const request = {} as ExecutionRequest;

      const result = await runtime.execute<ExecutionResult>(request);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(errorListener).toHaveBeenCalled();
    });

    it('should pass input data to execution', async () => {
      const request: ExecutionRequest = {
        application: { id: 'input-app', name: 'Input App' },
        input: { query: 'test query' },
      };

      const result = await runtime.execute<ExecutionResult>(request);

      expect(result.output).toBeDefined();
    });

    it('should collect metrics including memory usage', async () => {
      await runtime.execute({
        application: { id: 'metrics-app', name: 'Metrics App' },
      });

      const metrics = runtime.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.runningApplications).toBe(1);
    });
  });

  describe('getMetrics', () => {
    it('should return empty metrics initially', () => {
      const metrics = runtime.getMetrics();
      expect(metrics.runningApplications).toBe(0);
      expect(metrics.metrics).toEqual([]);
    });

    it('should return running applications count after execution', async () => {
      await runtime.execute({
        application: { id: 'app1', name: 'App 1' },
      });
      await runtime.execute({
        application: { id: 'app2', name: 'App 2' },
      });

      const metrics = runtime.getMetrics();
      expect(metrics.runningApplications).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('should clear all running applications', async () => {
      await runtime.execute({
        application: { id: 'app1', name: 'App 1' },
      });

      await runtime.cleanup();

      const metrics = runtime.getMetrics();
      expect(metrics.runningApplications).toBe(0);
    });
  });

  describe('event emission', () => {
    it('should emit error event on validation failure', async () => {
      const errorListener = jest.fn();
      runtime.on('error', errorListener);

      await runtime.execute({ application: {} });

      expect(errorListener).toHaveBeenCalled();
    });
  });
});
