/**
 * @mycodexvantaos/mycodexvantaos-service-catalog
 * Service catalog model - service definitions, categories, capabilities, permissions, runtime metadata
 */

// Re-export from core constitution
export * from '@mycodexvantaos/core/service-catalog';

// Extended types for standalone package
export interface ServiceDependency {
  serviceId: string;
  required: boolean;
  minVersion?: string;
}

export interface ServiceRuntimeSupport {
  portable: boolean;
  supported: ('cloudflare-workers' | 'node-server' | 'docker-container' | 'kubernetes-pod')[];
}
