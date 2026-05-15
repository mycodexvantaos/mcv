/**
 * MyCodeXvantaOS Service Mesh
 * Provides service discovery, load balancing, and traffic management
 */

export interface Service {
  name: string;
  instances: ServiceInstance[];
}

export interface ServiceInstance {
  id: string;
  host: string;
  port: number;
  healthy: boolean;
}

export class ServiceMesh {
  private services: Map<string, Service> = new Map();

  registerService(service: Service): void {
    this.services.set(service.name, service);
  }

  discoverService(serviceName: string): Service | undefined {
    return this.services.get(serviceName);
  }

  getHealthyInstances(serviceName: string): ServiceInstance[] {
    const service = this.services.get(serviceName);
    if (!service) return [];
    return service.instances.filter((instance) => instance.healthy);
  }

  deregisterService(serviceName: string): boolean {
    return this.services.delete(serviceName);
  }
}

export default ServiceMesh;
