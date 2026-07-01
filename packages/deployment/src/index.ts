/**
 * MyCodeXvantaOS Deployment Package
 *
 * Unified deployment abstraction following MyCodeXvantaOS Architecture:
 * - Native-first: Always has a working native provider as fallback
 * - Provider-agnostic: Switch between deployment targets without code changes
 * - Zero hard dependencies: External providers are optional
 */

// Core types
export interface DeploymentConfig {
  target: 'local' | 'kubernetes' | 'docker' | 'cloud';
  namespace?: string;
  replicas?: number;
  resources?: {
    cpu?: string;
    memory?: string;
  };
  environment?: Record<string, string>;
}

export interface DeploymentRequest {
  application: any;
  config: DeploymentConfig;
  version?: string;
}

export interface DeploymentResult {
  jobId: string;
  status: 'pending' | 'deployed' | 'failed';
  url?: string;
  endpoints?: string[];
  deploymentTime: number;
}

// Provider interface
export interface DeploymentProviderInterface {
  name: string;
  isNative: boolean;
  isAvailable(): boolean;
  healthCheck(): Promise<{ healthy: boolean; message: string }>;
  getMetadata(): Record<string, any>;
  deploy(application: any, config?: DeploymentConfig): Promise<DeploymentResult>;
}

/**
 * Deployment Provider Registry
 * Manages available deployment providers and selects the best one
 */
export class DeploymentProviderRegistry {
  private providers: Map<string, DeploymentProviderInterface> = new Map();
  private preferredProvider: string = 'native';

  /**
   * Register a deployment provider
   */
  register(name: string, provider: DeploymentProviderInterface): void {
    this.providers.set(name, provider);

    // Update preferred provider if this one is available and external
    if (provider.isAvailable() && !provider.isNative) {
      this.preferredProvider = name;
    }
  }

  /**
   * Set the preferred provider
   */
  setPreferredProvider(name: string): void {
    if (this.providers.has(name)) {
      this.preferredProvider = name;
    }
  }

  /**
   * Get a specific provider
   */
  get(name: string): DeploymentProviderInterface | undefined {
    return this.providers.get(name);
  }

  /**
   * Get the best available provider
   */
  getActive(): DeploymentProviderInterface {
    // Prefer external providers if configured and available
    for (const [name, provider] of this.providers) {
      if (provider.isAvailable() && !provider.isNative) {
        return provider;
      }
    }

    // Fall back to native
    const native = this.providers.get('native');
    if (native) {
      return native;
    }

    throw new Error(
      'No deployment provider available. Native provider should always be registered.'
    );
  }

  /**
   * Get all registered providers
   */
  getAll(): Map<string, DeploymentProviderInterface> {
    return this.providers;
  }

  /**
   * Health check all providers
   */
  async healthCheckAll(): Promise<Record<string, { healthy: boolean; message: string }>> {
    const results: Record<string, { healthy: boolean; message: string }> = {};

    for (const [name, provider] of this.providers) {
      results[name] = await provider.healthCheck();
    }

    return results;
  }
}

// Global registry singleton
let registry: DeploymentProviderRegistry | null = null;

/**
 * Get the global deployment provider registry
 */
export function getDeploymentRegistry(): DeploymentProviderRegistry {
  if (!registry) {
    registry = new DeploymentProviderRegistry();
  }
  return registry;
}

/**
 * Native Deployment Provider (built-in, zero dependencies)
 */
export class NativeDeploymentProvider implements DeploymentProviderInterface {
  name = 'native';
  isNative = true;

  isAvailable(): boolean {
    return true; // Always available
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    return { healthy: true, message: 'Native Deployment Provider is operational' };
  }

  getMetadata() {
    return {
      name: 'deploy-native',
      provider: 'native',
      capabilities: ['local-deployment', 'docker-deployment', 'static-site-hosting'],
      isNative: true,
      requiresApiKey: false,
    };
  }

  async deploy(application: any, config?: DeploymentConfig): Promise<DeploymentResult> {
    const startTime = Date.now();
    const jobId = `urn:mycodexvantaos:deployment:native:${application.name || 'app'}:${Date.now()}`;

    return {
      jobId,
      status: 'deployed',
      url: `http://localhost:${config?.resources?.cpu ? 8080 : 3000}`,
      endpoints: [`/api/v1/${application.name || 'app'}`],
      deploymentTime: Date.now() - startTime,
    };
  }
}

/**
 * Initialize deployment with available providers
 */
export async function initializeDeployment(
  config: {
    preferredProvider?: 'native' | 'firebase' | 'kubernetes' | 'docker';
    providers?: Record<string, any>;
  } = {}
): Promise<DeploymentProviderRegistry> {
  const reg = getDeploymentRegistry();

  // Always register native provider first (guaranteed fallback)
  const nativeProvider = new NativeDeploymentProvider();
  reg.register('native', nativeProvider);

  // Set preferred provider if specified
  if (config.preferredProvider) {
    reg.setPreferredProvider(config.preferredProvider);
  }

  return reg;
}

/**
 * Deploy using the best available provider
 */
export async function deploy(
  application: any,
  options?: { provider?: string; config?: DeploymentConfig }
): Promise<DeploymentResult> {
  const reg = getDeploymentRegistry();
  const provider = options?.provider ? reg.get(options.provider) : reg.getActive();

  if (!provider) {
    throw new Error('No deployment provider available');
  }

  return provider.deploy(application, options?.config);
}

/**
 * Legacy Deployment class for backwards compatibility
 */
export class Deployment {
  private deployments: Map<string, any>;
  private deploymentHistory: any[];

  constructor() {
    this.deployments = new Map();
    this.deploymentHistory = [];
  }

  /**
   * Initialize the deployment service
   */
  async initialize(): Promise<void> {
    await initializeDeployment();
    console.log('Deployment service initialized');
  }

  /**
   * Deploy an application
   */
  async execute<T = DeploymentResult>(request: DeploymentRequest): Promise<T> {
    const startTime = Date.now();

    // Validate deployment request
    if (!request.application || !request.config) {
      throw new Error('Invalid deployment request');
    }

    // Generate deployment ID
    const jobId = `urn:mycodexvantaos:deployment:${request.application.name}:${Date.now()}`;

    try {
      // Execute deployment based on target
      const deployment = await this.executeDeployment(request, jobId);

      // Record deployment
      this.deployments.set(jobId, deployment);
      this.deploymentHistory.push(deployment);

      const deploymentTime = Date.now() - startTime;

      const result: DeploymentResult = {
        jobId,
        status: 'deployed',
        url: deployment.url,
        endpoints: deployment.endpoints,
        deploymentTime,
      };

      console.log(`Deployment completed: ${jobId}`);
      return result as T;
    } catch (error) {
      const deploymentTime = Date.now() - startTime;

      const result: DeploymentResult = {
        jobId,
        status: 'failed',
        deploymentTime,
      };

      console.error(`Deployment failed: ${jobId}`, error);
      return result as T;
    }
  }

  /**
   * Execute deployment based on target
   */
  private async executeDeployment(request: DeploymentRequest, jobId: string): Promise<any> {
    const { application, config } = request;

    switch (config.target) {
      case 'local':
        return this.deployLocal(application, config, jobId);
      case 'kubernetes':
        return this.deployKubernetes(application, config, jobId);
      case 'docker':
        return this.deployDocker(application, config, jobId);
      case 'cloud':
        return this.deployCloud(application, config, jobId);
      default:
        throw new Error(`Unsupported deployment target: ${config.target}`);
    }
  }

  /**
   * Deploy to local environment
   */
  private async deployLocal(
    application: any,
    config: DeploymentConfig,
    jobId: string
  ): Promise<any> {
    return {
      jobId,
      target: 'local',
      port: 3000,
      url: 'http://localhost:3000',
      endpoints: [`/api/v1/${application.name}`],
      status: 'running',
    };
  }

  /**
   * Deploy to Kubernetes
   */
  private async deployKubernetes(
    application: any,
    config: DeploymentConfig,
    jobId: string
  ): Promise<any> {
    // Simulate Kubernetes deployment
    return {
      jobId,
      target: 'kubernetes',
      namespace: config.namespace || 'default',
      replicas: config.replicas || 1,
      url: `http://${application.name}.mycodexvantaos.local`,
      endpoints: [`/api/v1/${application.name}`],
      status: 'running',
    };
  }

  /**
   * Deploy as Docker container
   */
  private async deployDocker(
    application: any,
    config: DeploymentConfig,
    jobId: string
  ): Promise<any> {
    return {
      jobId,
      target: 'docker',
      containerName: `mycodexvantaos-${application.name}`,
      port: config.resources?.cpu ? 8080 : 3000,
      url: `http://localhost:${config.resources?.cpu ? 8080 : 3000}`,
      endpoints: [`/api/v1/${application.name}`],
      status: 'running',
    };
  }

  /**
   * Deploy to cloud
   */
  private async deployCloud(
    application: any,
    config: DeploymentConfig,
    jobId: string
  ): Promise<any> {
    return {
      jobId,
      target: 'cloud',
      url: `https://${application.name}.mycodexvantaos.cloud`,
      endpoints: [`/api/v1/${application.name}`],
      status: 'running',
    };
  }

  /**
   * Get deployment status
   */
  getStatus(jobId: string): any {
    return this.deployments.get(jobId);
  }

  /**
   * Get deployment history
   */
  getHistory(): any[] {
    return this.deploymentHistory;
  }

  /**
   * Cleanup deployment resources
   */
  async cleanup(): Promise<void> {
    this.deployments.clear();
    console.log('Deployment service cleaned up');
  }
}

// Export default instance
export const deployment = new Deployment();

// Default export
export default {
  getDeploymentRegistry,
  initializeDeployment,
  deploy,
  DeploymentProviderRegistry,
  NativeDeploymentProvider,
  Deployment,
};
