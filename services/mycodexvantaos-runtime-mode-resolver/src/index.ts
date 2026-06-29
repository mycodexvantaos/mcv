/**
 * MyCodexVantaOS Runtime Mode Resolver
 *
 * Service ID: mycodexvantaos-runtime-mode-resolver
 * Foundation: Contract Foundation
 * Capability: Runtime mode resolution, provider selection
 *
 * Machine Identity: mycodexvantaos
 */

export const SERVICE_ID = 'mycodexvantaos-runtime-mode-resolver';
export const SERVICE_VERSION = '1.0.0';

export type RuntimeMode = 'native' | 'connected' | 'hybrid';
export type Capability =
  | 'database'
  | 'storage'
  | 'auth'
  | 'queue'
  | 'state-store'
  | 'secrets'
  | 'repo'
  | 'deploy'
  | 'validation'
  | 'security'
  | 'observability'
  | 'notification'
  | 'scheduler'
  | 'vector-store'
  | 'embedding'
  | 'llm'
  | 'graph'
  | 'cache'
  | 'search'
  | 'quantum-runtime'
  | 'quantum-simulator'
  | 'quantum-processor'
  | 'quantum-circuit'
  | 'quantum-observability';

export interface ProviderBinding {
  capability: Capability;
  providerId: string;
  runtimeMode: RuntimeMode;
  priority: number;
}

export interface RuntimeModeResolution {
  mode: RuntimeMode;
  resolvedBy: 'environment-variable' | 'config-file' | 'default';
  providerBindings: ProviderBinding[];
  timestamp: Date;
}

/**
 * Default provider bindings for each runtime mode.
 */
const NATIVE_PROVIDER_BINDINGS: ProviderBinding[] = [
  {
    capability: 'llm',
    providerId: 'mycodexvantaos-llm-native',
    runtimeMode: 'native',
    priority: 1,
  },
  {
    capability: 'embedding',
    providerId: 'mycodexvantaos-embedding-native',
    runtimeMode: 'native',
    priority: 1,
  },
  {
    capability: 'vector-store',
    providerId: 'mycodexvantaos-vector-store-pgvector',
    runtimeMode: 'native',
    priority: 1,
  },
  {
    capability: 'database',
    providerId: 'mycodexvantaos-database-postgres',
    runtimeMode: 'native',
    priority: 1,
  },
  {
    capability: 'cache',
    providerId: 'mycodexvantaos-cache-redis',
    runtimeMode: 'native',
    priority: 1,
  },
  {
    capability: 'queue',
    providerId: 'mycodexvantaos-queue-rabbitmq',
    runtimeMode: 'native',
    priority: 1,
  },
  {
    capability: 'storage',
    providerId: 'mycodexvantaos-storage-minio',
    runtimeMode: 'native',
    priority: 1,
  },
  {
    capability: 'secrets',
    providerId: 'mycodexvantaos-secrets-local',
    runtimeMode: 'native',
    priority: 1,
  },
  {
    capability: 'graph',
    providerId: 'mycodexvantaos-graph-native',
    runtimeMode: 'native',
    priority: 1,
  },
  {
    capability: 'search',
    providerId: 'mycodexvantaos-search-native',
    runtimeMode: 'native',
    priority: 1,
  },
  { capability: 'auth', providerId: 'mycodexvantaos-auth-jwt', runtimeMode: 'native', priority: 1 },
  {
    capability: 'observability',
    providerId: 'mycodexvantaos-observability-opentelemetry',
    runtimeMode: 'native',
    priority: 1,
  },
];

const CONNECTED_PROVIDER_BINDINGS: ProviderBinding[] = [
  {
    capability: 'llm',
    providerId: 'mycodexvantaos-llm-openai',
    runtimeMode: 'connected',
    priority: 1,
  },
  {
    capability: 'embedding',
    providerId: 'mycodexvantaos-embedding-openai',
    runtimeMode: 'connected',
    priority: 1,
  },
  {
    capability: 'vector-store',
    providerId: 'mycodexvantaos-vector-store-qdrant',
    runtimeMode: 'connected',
    priority: 1,
  },
  {
    capability: 'database',
    providerId: 'mycodexvantaos-database-postgres',
    runtimeMode: 'connected',
    priority: 1,
  },
  {
    capability: 'cache',
    providerId: 'mycodexvantaos-cache-kv',
    runtimeMode: 'connected',
    priority: 1,
  },
  {
    capability: 'queue',
    providerId: 'mycodexvantaos-queue-cloudflare',
    runtimeMode: 'connected',
    priority: 1,
  },
  {
    capability: 'storage',
    providerId: 'mycodexvantaos-storage-r2',
    runtimeMode: 'connected',
    priority: 1,
  },
  {
    capability: 'secrets',
    providerId: 'mycodexvantaos-secrets-vault',
    runtimeMode: 'connected',
    priority: 1,
  },
  {
    capability: 'auth',
    providerId: 'mycodexvantaos-auth-jwt',
    runtimeMode: 'connected',
    priority: 1,
  },
  {
    capability: 'observability',
    providerId: 'mycodexvantaos-observability-opentelemetry',
    runtimeMode: 'connected',
    priority: 1,
  },
];

/**
 * Runtime Mode Resolver
 * Resolves the current runtime mode and provider bindings.
 */
export class RuntimeModeResolver {
  /**
   * Resolve the current runtime mode.
   * Priority: environment variable > config file > default (native)
   */
  resolve(): RuntimeModeResolution {
    const envMode = process.env.MYCODEXVANTAOS_RUNTIME_MODE as RuntimeMode | undefined;

    if (envMode && ['native', 'connected', 'hybrid'].includes(envMode)) {
      return {
        mode: envMode,
        resolvedBy: 'environment-variable',
        providerBindings: this.getProviderBindings(envMode),
        timestamp: new Date(),
      };
    }

    // Default to native mode
    return {
      mode: 'native',
      resolvedBy: 'default',
      providerBindings: this.getProviderBindings('native'),
      timestamp: new Date(),
    };
  }

  /**
   * Get provider bindings for a runtime mode.
   */
  getProviderBindings(mode: RuntimeMode): ProviderBinding[] {
    switch (mode) {
      case 'native':
        return NATIVE_PROVIDER_BINDINGS;
      case 'connected':
        return CONNECTED_PROVIDER_BINDINGS;
      case 'hybrid':
        // Hybrid: use connected for AI capabilities, native for data
        return [
          ...CONNECTED_PROVIDER_BINDINGS.filter((b) =>
            ['llm', 'embedding', 'vector-store'].includes(b.capability)
          ),
          ...NATIVE_PROVIDER_BINDINGS.filter((b) =>
            ['database', 'cache', 'queue', 'storage', 'secrets', 'auth', 'observability'].includes(
              b.capability
            )
          ),
        ];
    }
  }

  /**
   * Resolve the provider for a specific capability.
   */
  resolveProvider(capability: Capability, mode?: RuntimeMode): string | null {
    const resolvedMode = mode ?? this.resolve().mode;
    const bindings = this.getProviderBindings(resolvedMode);
    const binding = bindings
      .filter((b) => b.capability === capability)
      .sort((a, b) => a.priority - b.priority)[0];
    return binding?.providerId ?? null;
  }

  /**
   * Validate that all required capabilities have provider bindings.
   */
  validateBindings(mode: RuntimeMode): { valid: boolean; missing: Capability[] } {
    const REQUIRED_CAPABILITIES: Capability[] = [
      'llm',
      'embedding',
      'vector-store',
      'database',
      'cache',
      'queue',
      'storage',
      'secrets',
      'auth',
      'observability',
    ];

    const bindings = this.getProviderBindings(mode);
    const boundCapabilities = new Set(bindings.map((b) => b.capability));
    const missing = REQUIRED_CAPABILITIES.filter((c) => !boundCapabilities.has(c));

    return { valid: missing.length === 0, missing };
  }
}

export const runtimeModeResolver = new RuntimeModeResolver();
