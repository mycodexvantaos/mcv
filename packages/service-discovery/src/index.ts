/**
 * MyCodeXvantaOS Service Discovery
 * Service registration, discovery, and health monitoring
 */

import * as events from 'events';

export interface ServiceRegistration {
  id: string;
  name: string;
  type: string;
  version: string;
  endpoint: string;
  healthCheckUrl?: string;
  metadata?: Record<string, any>;
  status?: string;
  registeredAt?: number;
  lastHealthCheck?: number;
}

export interface ServiceQuery {
  name?: string;
  type?: string;
  version?: string;
  healthyOnly?: boolean;
}

export class ServiceDiscovery extends events.EventEmitter {
  private services: Map<string, ServiceRegistration>;
  private healthChecks: Map<string, any>;
  private subscriptions: Map<string, any>;

  constructor() {
    super();
    this.services = new Map();
    this.healthChecks = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Initialize service discovery
   */
  async initialize(): Promise<void> {
    console.log('Service discovery initialized');
    // Start health check simulation
    this.startHealthChecks();
  }

  /**
   * Register a service
   */
  async execute<T = ServiceRegistration>(registration: ServiceRegistration): Promise<T> {
    // Validate registration
    if (!registration.id || !registration.name || !registration.endpoint) {
      throw new Error('Invalid service registration: id, name, and endpoint required');
    }

    // Store service
    this.services.set(registration.id, {
      ...registration,
      registeredAt: Date.now(),
      status: 'healthy',
      lastHealthCheck: Date.now(),
    });

    // Setup health check if URL provided
    if (registration.healthCheckUrl) {
      this.setupHealthCheck(registration.id, registration.healthCheckUrl);
    }

    // Emit registration event
    this.emit('service-registered', registration);
    console.log(`Service registered: ${registration.name}`);

    return registration as T;
  }

  /**
   * Discover services
   */
  discover(query: ServiceQuery): ServiceRegistration[] {
    let results = Array.from(this.services.values());

    // Filter by name
    if (query.name) {
      results = results.filter((s) => s.name === query.name);
    }

    // Filter by type
    if (query.type) {
      results = results.filter((s) => s.type === query.type);
    }

    // Filter by version
    if (query.version) {
      results = results.filter((s) => s.version === query.version);
    }

    // Filter by health status
    if (query.healthyOnly) {
      results = results.filter((s) => s.status === 'healthy');
    }

    return results;
  }

  /**
   * Get service by ID
   */
  getService(serviceId: string): ServiceRegistration | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Unregister a service
   */
  unregister(serviceId: string): boolean {
    const removed = this.services.delete(serviceId);
    if (removed) {
      this.healthChecks.delete(serviceId);
      this.emit('service-unregistered', { serviceId });
    }
    return removed;
  }

  /**
   * Setup health check
   */
  private setupHealthCheck(serviceId: string, healthCheckUrl: string): void {
    this.healthChecks.set(serviceId, {
      url: healthCheckUrl,
      interval: 30000, // 30 seconds
      timeout: 5000,
    });
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    for (const [serviceId, service] of this.services.entries()) {
      if (service.healthCheckUrl) {
        // Simulate health check
        const isHealthy = Math.random() > 0.1; // 90% chance of healthy

        const status = isHealthy ? 'healthy' : 'unhealthy';

        if (service.status !== status) {
          service.status = status;
          service.lastHealthCheck = Date.now();

          this.emit('service-health-changed', {
            serviceId,
            status,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  /**
   * Subscribe to service changes
   */
  subscribe(category: string, callback: (data: any) => void): void {
    this.subscriptions.set(category, callback);
    this.on(category, callback);
  }

  /**
   * Get all services
   */
  getAllServices(): ServiceRegistration[] {
    return Array.from(this.services.values());
  }

  /**
   * Get service statistics
   */
  getStats(): any {
    const services = Array.from(this.services.values());
    return {
      total: services.length,
      healthy: services.filter((s) => s.status === 'healthy').length,
      unhealthy: services.filter((s) => s.status !== 'healthy').length,
      byType: this.groupByType(services),
    };
  }

  /**
   * Group services by type
   */
  private groupByType(services: ServiceRegistration[]): Record<string, number> {
    return services.reduce(
      (acc, service) => {
        acc[service.type] = (acc[service.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Cleanup service discovery
   */
  async cleanup(): Promise<void> {
    this.services.clear();
    this.healthChecks.clear();
    this.subscriptions.clear();
    console.log('Service discovery cleaned up');
  }
}

// Export default instance
export const serviceDiscovery = new ServiceDiscovery();
