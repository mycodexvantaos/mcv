/**
 * 🔒 MyCodexVantaOS - Provider Registry
 *
 * Centralized registry for managing all capability providers.
 * Provides discovery, registration, and lifecycle management.
 *
 * @module packages/capabilities/registry
 * @version 1.0.0
 */

import { CapabilityBase } from '../base';
import type { ProviderConfig } from '../types';

/**
 * Provider metadata
 */
export interface ProviderMetadata {
  /** Provider unique identifier */
  id: string;

  /** Provider display name */
  name: string;

  /** Provider category (llm, embedding, storage, etc.) */
  category: string;

  /** Provider type (openai, gemini, local, etc.) */
  type: string;

  /** Module path for import */
  modulePath: string;

  /** Factory function name */
  factoryFunction?: string;

  /** Description */
  description?: string;

  /** Whether provider is available */
  available: boolean;

  /** Fallback provider ID (if any) */
  fallbackProvider?: string;

  /** Configuration schema */
  configSchema?: Record<string, unknown>;
}

/**
 * Provider instance wrapper
 */
export interface ProviderInstance<T = any> {
  /** Provider metadata */
  metadata: ProviderMetadata;

  /** Provider instance */
  provider: CapabilityBase<T>;

  /** Initialized status */
  initialized: boolean;
}

/**
 * Registry configuration
 */
export interface RegistryConfig {
  /** Auto-initialize providers on registration */
  autoInitialize?: boolean;

  /** Enable health monitoring */
  enableHealthMonitoring?: boolean;

  /** Health check interval (ms) */
  healthCheckInterval?: number;

  /** Register fallbacks automatically */
  autoRegisterFallbacks?: boolean;
}

/**
 * 🔒 Provider Registry
 *
 * Central registry for all capability providers.
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry;

  private providers: Map<string, ProviderInstance> = new Map();
  private metadata: Map<string, ProviderMetadata> = new Map();
  private config: RegistryConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor(config: RegistryConfig = {}) {
    this.config = {
      autoInitialize: config.autoInitialize ?? false,
      enableHealthMonitoring: config.enableHealthMonitoring ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 60000, // 1 minute
      autoRegisterFallbacks: config.autoRegisterFallbacks ?? true,
    };

    if (this.config.enableHealthMonitoring) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Get singleton registry instance
   */
  static getInstance(config?: RegistryConfig): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry(config);
    }
    return ProviderRegistry.instance;
  }

  /**
   * Register provider metadata
   */
  registerMetadata(metadata: ProviderMetadata): void {
    this.metadata.set(metadata.id, metadata);

    if (this.config.autoRegisterFallbacks && metadata.fallbackProvider) {
      // Ensure fallback metadata is registered
      if (!this.metadata.has(metadata.fallbackProvider)) {
        this.log('warn', `Fallback provider ${metadata.fallbackProvider} not yet registered`);
      }
    }
  }

  /**
   * Register provider instance
   */
  async registerProvider<T = any>(
    metadata: ProviderMetadata,
    provider: CapabilityBase<T>,
    autoInitialize: boolean = false
  ): Promise<void> {
    this.registerMetadata(metadata);

    const instance: ProviderInstance<T> = {
      metadata,
      provider,
      initialized: false,
    };

    this.providers.set(metadata.id, instance);

    if (autoInitialize || this.config.autoInitialize) {
      await this.initializeProvider(metadata.id);
    }
  }

  /**
   * Initialize a provider by ID
   */
  async initializeProvider(providerId: string): Promise<void> {
    const instance = this.providers.get(providerId);
    if (!instance) {
      throw new Error(`Provider ${providerId} not found in registry`);
    }

    if (instance.initialized) {
      this.log('info', `Provider ${providerId} already initialized`);
      return;
    }

    await instance.provider.initialize();
    instance.initialized = true;
    this.log('info', `Provider ${providerId} initialized successfully`);
  }

  /**
   * Get provider instance by ID
   */
  getProvider<T = any>(providerId: string): CapabilityBase<T> | undefined {
    const instance = this.providers.get(providerId);
    return instance?.provider;
  }

  /**
   * Get provider metadata by ID
   */
  getProviderMetadata(providerId: string): ProviderMetadata | undefined {
    return this.metadata.get(providerId);
  }

  /**
   * Get all providers in a category
   */
  getProvidersByCategory(category: string): ProviderInstance[] {
    const results: ProviderInstance[] = [];
    for (const instance of this.providers.values()) {
      if (instance.metadata.category === category) {
        results.push(instance);
      }
    }
    return results;
  }

  /**
   * Get all available providers
   */
  getAllProviders(): ProviderInstance[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check if provider is registered
   */
  hasProvider(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /**
   * Check if provider is initialized
   */
  isProviderInitialized(providerId: string): boolean {
    const instance = this.providers.get(providerId);
    return instance?.initialized ?? false;
  }

  /**
   * Unregister a provider
   */
  async unregisterProvider(providerId: string): Promise<void> {
    const instance = this.providers.get(providerId);
    if (!instance) {
      return;
    }

    if (instance.initialized) {
      await instance.provider.shutdown();
    }

    this.providers.delete(providerId);
    this.metadata.delete(providerId);
    this.log('info', `Provider ${providerId} unregistered`);
  }

  /**
   * Health check for a provider
   */
  async healthCheck(providerId: string): Promise<boolean> {
    const instance = this.providers.get(providerId);
    if (!instance) {
      return false;
    }

    try {
      const result = await instance.provider.healthCheck();
      const metadata = this.metadata.get(providerId);
      if (metadata) {
        metadata.available = result.isHealthy;
      }
      return result.isHealthy;
    } catch {
      const metadata = this.metadata.get(providerId);
      if (metadata) {
        metadata.available = false;
      }
      return false;
    }
  }

  /**
   * Health check for all providers
   */
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const providerId of this.providers.keys()) {
      const healthy = await this.healthCheck(providerId);
      results.set(providerId, healthy);
    }

    return results;
  }

  /**
   * Get healthy providers
   */
  async getHealthyProviders(): Promise<ProviderInstance[]> {
    const healthy: ProviderInstance[] = [];

    for (const instance of this.providers.values()) {
      const result = await instance.provider.healthCheck();
      const metadata = this.metadata.get(instance.metadata.id);
      if (metadata) {
        metadata.available = result.isHealthy;
      }

      if (result.isHealthy) {
        healthy.push(instance);
      }
    }

    return healthy;
  }

  /**
   * Get providers by type
   */
  getProvidersByType(type: string): ProviderInstance[] {
    const results: ProviderInstance[] = [];
    for (const instance of this.providers.values()) {
      if (instance.metadata.type === type) {
        results.push(instance);
      }
    }
    return results;
  }

  /**
   * Find provider by fallback
   */
  findProviderWithFallback(fallbackId: string): ProviderInstance | undefined {
    for (const instance of this.providers.values()) {
      if (instance.metadata.fallbackProvider === fallbackId) {
        return instance;
      }
    }
    return undefined;
  }

  /**
   * Shutdown all providers
   */
  async shutdownAll(): Promise<void> {
    const shutdownPromises: Promise<void>[] = [];

    for (const instance of this.providers.values()) {
      if (instance.initialized) {
        shutdownPromises.push(instance.provider.shutdown());
      }
    }

    await Promise.all(shutdownPromises);
    this.providers.clear();
    this.metadata.clear();
    this.stopHealthMonitoring();

    this.log('info', 'All providers shut down');
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalProviders: number;
    initializedProviders: number;
    availableProviders: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let initialized = 0;
    let available = 0;

    for (const instance of this.providers.values()) {
      byCategory[instance.metadata.category] = (byCategory[instance.metadata.category] || 0) + 1;
      byType[instance.metadata.type] = (byType[instance.metadata.type] || 0) + 1;

      if (instance.initialized) initialized++;
      if (instance.metadata.available) available++;
    }

    return {
      totalProviders: this.providers.size,
      initializedProviders: initialized,
      availableProviders: available,
      byCategory,
      byType,
    };
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      return;
    }

    this.log('info', 'Starting health monitoring');

    this.healthCheckInterval = setInterval(async () => {
      await this.healthCheckAll();
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.log('info', 'Health monitoring stopped');
    }
  }

  /**
   * Logging helper
   */
  private log(level: 'info' | 'warn' | 'error', message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ProviderRegistry:${level.toUpperCase()}] ${message}`);
  }
}

/**
 * Default export
 */
export { ProviderRegistry as default };

/**
 * Get global registry instance
 */
export function getRegistry(): ProviderRegistry {
  return ProviderRegistry.getInstance();
}

/**
 * Register built-in provider metadata
 * This function should be called during application initialization
 */
export function registerBuiltInProviders(): void {
  const registry = getRegistry();

  // LLM Providers
  registry.registerMetadata({
    id: 'llm-openai',
    name: 'OpenAI LLM',
    category: 'llm',
    type: 'openai',
    modulePath: 'providers/llm/llm-openai',
    factoryFunction: 'createOpenAIProvider',
    description: 'OpenAI GPT models with streaming support',
    available: false,
    fallbackProvider: 'hybrid/llm',
  });

  registry.registerMetadata({
    id: 'llm-gemini',
    name: 'Google Gemini',
    category: 'llm',
    type: 'gemini',
    modulePath: 'providers/llm/llm-gemini',
    factoryFunction: 'createGeminiProvider',
    description: 'Google Gemini models',
    available: false,
    fallbackProvider: 'hybrid/llm',
  });

  registry.registerMetadata({
    id: 'llm-anthropic',
    name: 'Anthropic Claude',
    category: 'llm',
    type: 'anthropic',
    modulePath: 'providers/llm/llm-anthropic',
    factoryFunction: 'createAnthropicProvider',
    description: 'Anthropic Claude models',
    available: false,
    fallbackProvider: 'hybrid/llm',
  });

  // Embedding Providers
  registry.registerMetadata({
    id: 'embedding-openai',
    name: 'OpenAI Embedding',
    category: 'embedding',
    type: 'openai',
    modulePath: 'providers/embedding/embedding-openai',
    factoryFunction: 'createOpenAIEmbeddingProvider',
    description: 'OpenAI text embeddings',
    available: false,
    fallbackProvider: 'hybrid/embedding',
  });

  registry.registerMetadata({
    id: 'embedding-cohere',
    name: 'Cohere Embedding',
    category: 'embedding',
    type: 'cohere',
    modulePath: 'providers/embedding/embedding-cohere',
    factoryFunction: 'createCohereEmbeddingProvider',
    description: 'Cohere text embeddings',
    available: false,
    fallbackProvider: 'hybrid/embedding',
  });

  // External Providers
  registry.registerMetadata({
    id: 'workers-ai',
    name: 'Cloudflare Workers AI',
    category: 'external',
    type: 'workers-ai',
    modulePath: 'providers/external/workers-ai',
    factoryFunction: 'createWorkersAIProvider',
    description: 'Cloudflare Workers AI for LLM and embeddings',
    available: false,
    fallbackProvider: 'hybrid/llm',
  });

  // Hybrid Providers
  registry.registerMetadata({
    id: 'hybrid/llm',
    name: 'Hybrid LLM',
    category: 'hybrid',
    type: 'native',
    modulePath: 'providers/hybrid/llm-hybrid',
    description: 'Native hybrid LLM with zero dependencies',
    available: true,
  });

  registry.registerMetadata({
    id: 'hybrid/embedding',
    name: 'Hybrid Embedding',
    category: 'hybrid',
    type: 'native',
    modulePath: 'providers/hybrid/embedding-hybrid',
    description: 'Native hybrid embedding with zero dependencies',
    available: true,
  });
}
