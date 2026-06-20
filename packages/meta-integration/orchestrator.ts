import { SystemRegistry } from './phase-14/system-registry';
import { DependencyMapper } from './phase-15/dependency-mapper';
import { IntegrationFramework } from './phase-16/integration-framework';
import { ValidationFramework } from './phase-17/validation-framework';
import { MonitoringFramework } from './phase-18/monitoring-framework';

export class MetaIntegrationOrchestrator {
  private registry: SystemRegistry;
  private mapper: DependencyMapper;
  private framework: IntegrationFramework;
  private validation: ValidationFramework;
  private monitoring: MonitoringFramework;
  
  constructor() {
    this.registry = new SystemRegistry();
    this.mapper = new DependencyMapper();
    this.framework = new IntegrationFramework();
    this.validation = new ValidationFramework();
    this.monitoring = new MonitoringFramework();
  }
  
  registerSystem(id: string, system: any): void {
    this.registry.registerSystem(id, system);
    this.monitoring.registerMonitor(id, system);
  }
  
  discoverAndIntegrate(): void {
    const systems = this.registry.discoverSystems();
    systems.forEach(system => {
      this.framework.executeIntegration(system.id);
    });
  }
  
  validateAllSystems(): Record<string, boolean> {
    const systems = this.registry.getAllSystems();
    const results: Record<string, boolean> = {};
    systems.forEach(system => {
      results[system.id] = this.validation.validate(system.id, system);
    });
    return results;
  }
  
  getSystemStatus(): any {
    return {
      systems: this.registry.getAllSystems().length,
      integrations: this.framework.getAllIntegrations().length,
      metrics: this.monitoring.getAllMetrics()
    };
  }
}
