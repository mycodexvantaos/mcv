/**
 * @mycodexvantaos/mycodexvantaos-runtime-model
 * Runtime model - runtime definition, provider definition, adapter capability, health, portability
 */

export interface RuntimeDefinition {
  id: string;
  displayName: string;
  description: string;
  providers: ProviderDefinition[];
  supportedServices: string[];
  storageBackend: string;
  databaseBackend: string;
  queueBackend: string;
  aiProviderSupport: string[];
  selfHostable: boolean;
}

export interface ProviderDefinition {
  id: string;
  runtimeId: string;
  category: string;
  capabilities: AdapterCapability[];
}

export interface AdapterCapability {
  port: string;
  supported: boolean;
  limitations?: string[];
}

export interface RuntimeHealth {
  runtimeId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: string;
  components: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
}

export interface RuntimePortability {
  runtimeId: string;
  portable: boolean;
  constraints: string[];
  migrationNotes?: string;
}
