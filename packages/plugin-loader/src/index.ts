/**
 * Plugin Loader Module
 *
 * This module provides plugin loading and management capabilities.
 */

export interface Plugin {
  name: string;
  version: string;
  initialize?: () => Promise<void>;
  shutdown?: () => Promise<void>;
  config?: Record<string, any>;
}

export interface PluginLoaderOptions {
  pluginDir?: string;
  autoLoad?: boolean;
}

export class PluginLoader {
  private plugins: Map<string, Plugin> = new Map();
  private options: PluginLoaderOptions;

  constructor(options: PluginLoaderOptions = {}) {
    this.options = {
      pluginDir: options.pluginDir || "./plugins",
      autoLoad: options.autoLoad !== false,
    };
  }

  /**
   * Register a plugin
   */
  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    this.plugins.set(plugin.name, plugin);

    // Initialize plugin if initializer exists
    if (plugin.initialize) {
      await plugin.initialize();
    }
  }

  /**
   * Unregister a plugin
   */
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    // Shutdown plugin if shutdown handler exists
    if (plugin.shutdown) {
      await plugin.shutdown();
    }

    this.plugins.delete(name);
  }

  /**
   * Get a plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get plugin config
   */
  getPluginConfig(name: string): Record<string, any> | undefined {
    const plugin = this.plugins.get(name);
    return plugin?.config;
  }

  /**
   * Update plugin config
   */
  updatePluginConfig(name: string, config: Record<string, any>): void {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    plugin.config = {
      ...plugin.config,
      ...config,
    };
  }

  /**
   * Register multiple plugins
   */
  async registerAll(plugins: Plugin[]): Promise<void> {
    for (const plugin of plugins) {
      await this.register(plugin);
    }
  }

  /**
   * Unregister all plugins
   */
  async unregisterAll(): Promise<void> {
    const names = Array.from(this.plugins.keys());
    for (const name of names) {
      await this.unregister(name);
    }
  }

  /**
   * Shutdown all plugins
   */
  async shutdown(): Promise<void> {
    await this.unregisterAll();
  }
}

export default PluginLoader;
