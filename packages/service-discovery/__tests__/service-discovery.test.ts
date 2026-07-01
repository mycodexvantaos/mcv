/**
 * Comprehensive tests for Service Discovery package
 */

import { ServiceDiscovery, ServiceRegistration, ServiceQuery } from '../src/index';

describe('ServiceDiscovery', () => {
  let serviceDiscovery: ServiceDiscovery;

  beforeEach(() => {
    serviceDiscovery = new ServiceDiscovery();
  });

  afterEach(async () => {
    await serviceDiscovery.cleanup();
  });

  describe('initialize', () => {
    it('should initialize service discovery', async () => {
      await serviceDiscovery.initialize();
      const stats = serviceDiscovery.getStats();
      expect(stats.total).toBe(0);
    });
  });

  describe('execute (register)', () => {
    it('should register a service successfully', async () => {
      const registration: ServiceRegistration = {
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      };

      const result = await serviceDiscovery.execute<ServiceRegistration>(registration);

      expect(result).toBeDefined();
      expect(result.id).toBe('service-1');
      expect(result.name).toBe('test-service');
    });

    it('should throw error when id is missing', async () => {
      const registration = {
        name: 'test-service',
        endpoint: 'http://localhost:3000',
      } as ServiceRegistration;

      await expect(serviceDiscovery.execute(registration)).rejects.toThrow(
        'Invalid service registration: id, name, and endpoint required'
      );
    });

    it('should throw error when name is missing', async () => {
      const registration = {
        id: 'service-1',
        endpoint: 'http://localhost:3000',
      } as ServiceRegistration;

      await expect(serviceDiscovery.execute(registration)).rejects.toThrow(
        'Invalid service registration: id, name, and endpoint required'
      );
    });

    it('should throw error when endpoint is missing', async () => {
      const registration = {
        id: 'service-1',
        name: 'test-service',
      } as ServiceRegistration;

      await expect(serviceDiscovery.execute(registration)).rejects.toThrow(
        'Invalid service registration: id, name, and endpoint required'
      );
    });

    it('should emit service-registered event', async () => {
      const listener = jest.fn();
      serviceDiscovery.on('service-registered', listener);

      await serviceDiscovery.execute({
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'service-1',
          name: 'test-service',
        })
      );
    });

    it('should setup health check when URL provided', async () => {
      await serviceDiscovery.execute({
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
        healthCheckUrl: 'http://localhost:3000/health',
      });

      const service = serviceDiscovery.getService('service-1');
      expect(service).toBeDefined();
    });
  });

  describe('discover', () => {
    beforeEach(async () => {
      await serviceDiscovery.execute({
        id: 'api-1',
        name: 'api-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });
      await serviceDiscovery.execute({
        id: 'api-2',
        name: 'api-service',
        type: 'api',
        version: '2.0.0',
        endpoint: 'http://localhost:3001',
      });
      await serviceDiscovery.execute({
        id: 'worker-1',
        name: 'worker-service',
        type: 'worker',
        version: '1.0.0',
        endpoint: 'http://localhost:4000',
      });
    });

    it('should return all services when no query', () => {
      const results = serviceDiscovery.discover({});
      expect(results.length).toBe(3);
    });

    it('should filter by name', () => {
      const results = serviceDiscovery.discover({ name: 'api-service' });
      expect(results.length).toBe(2);
      expect(results.every((s) => s.name === 'api-service')).toBe(true);
    });

    it('should filter by type', () => {
      const results = serviceDiscovery.discover({ type: 'worker' });
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('worker');
    });

    it('should filter by version', () => {
      const results = serviceDiscovery.discover({ version: '1.0.0' });
      expect(results.length).toBe(2);
    });

    it('should filter by healthy status', () => {
      const results = serviceDiscovery.discover({ healthyOnly: true });
      expect(results.length).toBe(3);
    });

    it('should combine multiple filters', () => {
      const results = serviceDiscovery.discover({
        name: 'api-service',
        version: '1.0.0',
      });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('api-1');
    });
  });

  describe('getService', () => {
    it('should return service by ID', async () => {
      await serviceDiscovery.execute({
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      const service = serviceDiscovery.getService('service-1');
      expect(service).toBeDefined();
      expect(service?.name).toBe('test-service');
    });

    it('should return undefined for non-existent service', () => {
      const service = serviceDiscovery.getService('non-existent');
      expect(service).toBeUndefined();
    });
  });

  describe('unregister', () => {
    it('should unregister a service and return true', async () => {
      await serviceDiscovery.execute({
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      const result = serviceDiscovery.unregister('service-1');
      expect(result).toBe(true);
      expect(serviceDiscovery.getService('service-1')).toBeUndefined();
    });

    it('should return false for non-existent service', () => {
      const result = serviceDiscovery.unregister('non-existent');
      expect(result).toBe(false);
    });

    it('should emit service-unregistered event', async () => {
      const listener = jest.fn();
      serviceDiscovery.on('service-unregistered', listener);

      await serviceDiscovery.execute({
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      serviceDiscovery.unregister('service-1');

      expect(listener).toHaveBeenCalledWith({ serviceId: 'service-1' });
    });
  });

  describe('getAllServices', () => {
    it('should return empty array initially', () => {
      const services = serviceDiscovery.getAllServices();
      expect(services).toEqual([]);
    });

    it('should return all registered services', async () => {
      await serviceDiscovery.execute({
        id: 'service-1',
        name: 'test-service-1',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });
      await serviceDiscovery.execute({
        id: 'service-2',
        name: 'test-service-2',
        type: 'worker',
        version: '1.0.0',
        endpoint: 'http://localhost:4000',
      });

      const services = serviceDiscovery.getAllServices();
      expect(services.length).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return stats for no services', () => {
      const stats = serviceDiscovery.getStats();
      expect(stats.total).toBe(0);
      expect(stats.healthy).toBe(0);
      expect(stats.unhealthy).toBe(0);
    });

    it('should return correct stats for services', async () => {
      await serviceDiscovery.execute({
        id: 'service-1',
        name: 'api-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });
      await serviceDiscovery.execute({
        id: 'service-2',
        name: 'worker-service',
        type: 'worker',
        version: '1.0.0',
        endpoint: 'http://localhost:4000',
      });

      const stats = serviceDiscovery.getStats();
      expect(stats.total).toBe(2);
      expect(stats.healthy).toBe(2);
      expect(stats.byType.api).toBe(1);
      expect(stats.byType.worker).toBe(1);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to service events', () => {
      const callback = jest.fn();
      serviceDiscovery.subscribe('service-registered', callback);

      serviceDiscovery.emit('service-registered', { id: 'test' });
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clear all data', async () => {
      await serviceDiscovery.execute({
        id: 'service-1',
        name: 'test-service',
        type: 'api',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
      });

      await serviceDiscovery.cleanup();

      const services = serviceDiscovery.getAllServices();
      expect(services.length).toBe(0);
    });
  });
});
