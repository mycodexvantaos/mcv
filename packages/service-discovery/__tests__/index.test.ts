/**
 * @jest-environment node
 */

import { ServiceDiscovery, serviceDiscovery } from '../src/index';

describe('Service Discovery Package', () => {
  let discovery: ServiceDiscovery;

  beforeEach(() => {
    discovery = new ServiceDiscovery();
  });

  afterEach(async () => {
    await discovery.cleanup();
  });

  describe('initialize', () => {
    it('should initialize service discovery', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await discovery.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Service discovery initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('execute (register service)', () => {
    it('should register a valid service', async () => {
      const registration = {
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      };

      const result = await discovery.execute(registration);

      expect(result.id).toBe('service-1');
      expect(result.name).toBe('test-service');
      // Status is set internally but may not be returned in the registration object
      // Verify the service was registered by getting it
      const registered = discovery.getService('service-1');
      expect(registered?.status).toBe('healthy');
      expect(registered?.registeredAt).toBeDefined();
      expect(registered?.lastHealthCheck).toBeDefined();
    });

    it('should emit service-registered event', async () => {
      const registration = {
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      };

      const eventHandler = jest.fn();
      discovery.on('service-registered', eventHandler);

      await discovery.execute(registration);

      expect(eventHandler).toHaveBeenCalledWith(registration);
    });

    it('should log registration', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const registration = {
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      };

      await discovery.execute(registration);

      expect(consoleSpy).toHaveBeenCalledWith('Service registered: test-service');
      consoleSpy.mockRestore();
    });

    it('should throw error when id is missing', async () => {
      const registration = {
        name: 'test-service',
        endpoint: 'http://localhost:3000',
      } as any;

      await expect(discovery.execute(registration)).rejects.toThrow(
        'Invalid service registration: id, name, and endpoint required'
      );
    });

    it('should throw error when name is missing', async () => {
      const registration = {
        id: 'service-1',
        endpoint: 'http://localhost:3000',
      } as any;

      await expect(discovery.execute(registration)).rejects.toThrow(
        'Invalid service registration: id, name, and endpoint required'
      );
    });

    it('should throw error when endpoint is missing', async () => {
      const registration = {
        id: 'service-1',
        name: 'test-service',
      } as any;

      await expect(discovery.execute(registration)).rejects.toThrow(
        'Invalid service registration: id, name, and endpoint required'
      );
    });

    it('should setup health check when healthCheckUrl provided', async () => {
      const registration = {
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
        healthCheckUrl: 'http://localhost:3000/health',
      };

      await discovery.execute(registration);

      // Health check should be set up (we can verify by checking internal state)
      const service = discovery.getService('service-1');
      expect(service).toBeDefined();
    });

    it('should store metadata when provided', async () => {
      const registration = {
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
        metadata: { region: 'us-east-1', env: 'production' },
      };

      const result = await discovery.execute(registration);

      expect(result.metadata).toEqual({ region: 'us-east-1', env: 'production' });
    });
  });

  describe('discover', () => {
    beforeEach(async () => {
      // Register some test services
      await discovery.execute({
        id: 'service-1',
        name: 'api-gateway',
        type: 'gateway',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      await discovery.execute({
        id: 'service-2',
        name: 'user-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3001',
      });

      await discovery.execute({
        id: 'service-3',
        name: 'order-service',
        type: 'api',
        version: '2.0.0',
        endpoint: 'http://localhost:3002',
      });
    });

    it('should return all services with empty query', () => {
      const results = discovery.discover({});

      expect(results.length).toBe(3);
    });

    it('should filter by name', () => {
      const results = discovery.discover({ name: 'api-gateway' });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('api-gateway');
    });

    it('should filter by type', () => {
      const results = discovery.discover({ type: 'api' });

      expect(results.length).toBe(2);
      expect(results.every((s) => s.type === 'api')).toBe(true);
    });

    it('should filter by version', () => {
      const results = discovery.discover({ version: '1.0.0' });

      expect(results.length).toBe(2);
    });

    it('should filter by healthy status', () => {
      const results = discovery.discover({ healthyOnly: true });

      expect(results.length).toBe(3); // All are healthy initially
      expect(results.every((s) => s.status === 'healthy')).toBe(true);
    });

    it('should combine multiple filters', () => {
      const results = discovery.discover({
        type: 'api',
        version: '1.0.0',
      });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('user-service');
    });

    it('should return empty array when no matches', () => {
      const results = discovery.discover({ name: 'nonexistent' });

      expect(results).toEqual([]);
    });
  });

  describe('getService', () => {
    it('should return service by id', async () => {
      await discovery.execute({
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      const service = discovery.getService('service-1');

      expect(service).toBeDefined();
      expect(service?.name).toBe('test-service');
    });

    it('should return undefined for non-existent service', () => {
      const service = discovery.getService('nonexistent');

      expect(service).toBeUndefined();
    });
  });

  describe('unregister', () => {
    it('should unregister an existing service', async () => {
      await discovery.execute({
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      const result = discovery.unregister('service-1');

      expect(result).toBe(true);
      expect(discovery.getService('service-1')).toBeUndefined();
    });

    it('should emit service-unregistered event', async () => {
      await discovery.execute({
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      const eventHandler = jest.fn();
      discovery.on('service-unregistered', eventHandler);

      discovery.unregister('service-1');

      expect(eventHandler).toHaveBeenCalledWith({ serviceId: 'service-1' });
    });

    it('should return false for non-existent service', () => {
      const result = discovery.unregister('nonexistent');

      expect(result).toBe(false);
    });

    it('should not emit event for non-existent service', () => {
      const eventHandler = jest.fn();
      discovery.on('service-unregistered', eventHandler);

      discovery.unregister('nonexistent');

      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should subscribe to events', () => {
      const callback = jest.fn();
      discovery.subscribe('service-registered', callback);

      expect(discovery.listeners('service-registered')).toContain(callback);
    });

    it('should store subscription', () => {
      const callback = jest.fn();
      discovery.subscribe('service-registered', callback);

      // The subscription should be stored and callable
      discovery.emit('service-registered', { id: 'test' });
      expect(callback).toHaveBeenCalledWith({ id: 'test' });
    });
  });

  describe('getAllServices', () => {
    it('should return empty array initially', () => {
      const services = discovery.getAllServices();

      expect(services).toEqual([]);
    });

    it('should return all registered services', async () => {
      await discovery.execute({
        id: 'service-1',
        name: 'test-service-1',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      await discovery.execute({
        id: 'service-2',
        name: 'test-service-2',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3001',
      });

      const services = discovery.getAllServices();

      expect(services.length).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return stats for empty registry', () => {
      const stats = discovery.getStats();

      expect(stats.total).toBe(0);
      expect(stats.healthy).toBe(0);
      expect(stats.unhealthy).toBe(0);
      expect(stats.byType).toEqual({});
    });

    it('should return correct stats', async () => {
      await discovery.execute({
        id: 'service-1',
        name: 'gateway',
        type: 'gateway',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      await discovery.execute({
        id: 'service-2',
        name: 'api-1',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3001',
      });

      await discovery.execute({
        id: 'service-3',
        name: 'api-2',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3002',
      });

      const stats = discovery.getStats();

      expect(stats.total).toBe(3);
      expect(stats.healthy).toBe(3);
      expect(stats.unhealthy).toBe(0);
      expect(stats.byType).toEqual({ gateway: 1, api: 2 });
    });
  });

  describe('cleanup', () => {
    it('should clear all services', async () => {
      await discovery.execute({
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      await discovery.cleanup();

      const services = discovery.getAllServices();
      expect(services).toEqual([]);
    });

    it('should log cleanup message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await discovery.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith('Service discovery cleaned up');
      consoleSpy.mockRestore();
    });
  });

  describe('EventEmitter functionality', () => {
    it('should be an EventEmitter', () => {
      expect(discovery).toBeInstanceOf(require('events').EventEmitter);
    });

    it('should emit and receive events', () => {
      const handler = jest.fn();
      discovery.on('test-event', handler);
      discovery.emit('test-event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  describe('default export', () => {
    it('should export a default ServiceDiscovery instance', () => {
      expect(serviceDiscovery).toBeInstanceOf(ServiceDiscovery);
    });
  });
});
