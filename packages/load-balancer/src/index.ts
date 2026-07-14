/**
 * MyCodexVantaOS Load Balancer
 * Provides intelligent load balancing across service instances
 */

export interface Backend {
  id: string;
  host: string;
  port: number;
  weight: number;
  healthy: boolean;
}

export interface LoadBalancingStrategy {
  name: string;
  select: (backends: Backend[]) => Backend | null;
}

export class LoadBalancer {
  private backends: Map<string, Backend> = new Map();
  private strategy: LoadBalancingStrategy;

  constructor(
    strategy: LoadBalancingStrategy = {
      name: 'round-robin',
      select: (backends) => backends[Math.floor(Math.random() * backends.length)],
    }
  ) {
    this.strategy = strategy;
  }

  addBackend(backend: Backend): void {
    this.backends.set(backend.id, backend);
  }

  removeBackend(backendId: string): boolean {
    return this.backends.delete(backendId);
  }

  getBackend(): Backend | null {
    const healthyBackends = Array.from(this.backends.values()).filter((b) => b.healthy);
    if (healthyBackends.length === 0) return null;
    return this.strategy.select(healthyBackends);
  }

  setStrategy(strategy: LoadBalancingStrategy): void {
    this.strategy = strategy;
  }

  getHealthyBackends(): Backend[] {
    return Array.from(this.backends.values()).filter((b) => b.healthy);
  }
}

export default LoadBalancer;
