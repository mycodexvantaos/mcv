import { PluginLoader, Plugin } from '../src/index';

describe('PluginLoader', () => {
  let loader: PluginLoader;

  beforeEach(() => {
    loader = new PluginLoader({
      pluginDir: './plugins',
      autoLoad: false,
    });
  });

  afterEach(async () => {
    await loader.shutdown();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const defaultLoader = new PluginLoader();
      expect(defaultLoader).toBeInstanceOf(PluginLoader);
    });

    it('should initialize with custom options', () => {
      const customLoader = new PluginLoader({
        pluginDir: './custom-plugins',
        autoLoad: false,
      });
      expect(customLoader).toBeInstanceOf(PluginLoader);
    });
  });

  describe('register', () => {
    it('should register a plugin', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
      };

      await loader.register(plugin);

      expect(loader.hasPlugin('test-plugin')).toBe(true);
      expect(loader.getPlugin('test-plugin')).toBe(plugin);
    });

    it('should call plugin initialize method', async () => {
      let initialized = false;
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: async () => {
          initialized = true;
        },
      };

      await loader.register(plugin);

      expect(initialized).toBe(true);
    });

    it('should throw error for duplicate plugin', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
      };

      await loader.register(plugin);

      await expect(loader.register(plugin)).rejects.toThrow('already registered');
    });
  });

  describe('unregister', () => {
    it('should unregister a plugin', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
      };

      await loader.register(plugin);
      await loader.unregister('test-plugin');

      expect(loader.hasPlugin('test-plugin')).toBe(false);
    });

    it('should call plugin shutdown method', async () => {
      let shutdown = false;
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        shutdown: async () => {
          shutdown = true;
        },
      };

      await loader.register(plugin);
      await loader.unregister('test-plugin');

      expect(shutdown).toBe(true);
    });

    it('should throw error for non-existent plugin', async () => {
      await expect(loader.unregister('non-existent')).rejects.toThrow('not found');
    });
  });

  describe('getPlugin', () => {
    it('should retrieve plugin by name', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        config: { key: 'value' },
      };

      await loader.register(plugin);
      const retrieved = loader.getPlugin('test-plugin');

      expect(retrieved).toBe(plugin);
      expect(retrieved?.config).toEqual({ key: 'value' });
    });

    it('should return undefined for non-existent plugin', () => {
      const retrieved = loader.getPlugin('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getPlugins', () => {
    it('should return all plugins', async () => {
      await loader.register({ name: 'plugin1', version: '1.0.0' });
      await loader.register({ name: 'plugin2', version: '1.0.0' });

      const plugins = loader.getPlugins();

      expect(plugins).toHaveLength(2);
    });
  });

  describe('hasPlugin', () => {
    it('should return true for registered plugin', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
      };

      await loader.register(plugin);

      expect(loader.hasPlugin('test-plugin')).toBe(true);
    });

    it('should return false for non-existent plugin', () => {
      expect(loader.hasPlugin('non-existent')).toBe(false);
    });
  });

  describe('getPluginConfig', () => {
    it('should get plugin config', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        config: { key: 'value', nested: { prop: 'test' } },
      };

      await loader.register(plugin);
      const config = loader.getPluginConfig('test-plugin');

      expect(config).toEqual({ key: 'value', nested: { prop: 'test' } });
    });

    it('should return undefined for plugin without config', async () => {
      await loader.register({ name: 'test-plugin', version: '1.0.0' });
      const config = loader.getPluginConfig('test-plugin');

      expect(config).toBeUndefined();
    });

    it('should return undefined for non-existent plugin', () => {
      const config = loader.getPluginConfig('non-existent');
      expect(config).toBeUndefined();
    });
  });

  describe('updatePluginConfig', () => {
    it('should update plugin config', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        config: { key: 'value' },
      };

      await loader.register(plugin);
      loader.updatePluginConfig('test-plugin', { newKey: 'newValue' });

      const config = loader.getPluginConfig('test-plugin');
      expect(config).toEqual({ key: 'value', newKey: 'newValue' });
    });

    it('should throw error for non-existent plugin', () => {
      expect(() => {
        loader.updatePluginConfig('non-existent', {});
      }).toThrow('not found');
    });
  });

  describe('registerAll', () => {
    it('should register multiple plugins', async () => {
      const plugins: Plugin[] = [
        { name: 'plugin1', version: '1.0.0' },
        { name: 'plugin2', version: '1.0.0' },
        { name: 'plugin3', version: '1.0.0' },
      ];

      await loader.registerAll(plugins);

      expect(loader.getPlugins()).toHaveLength(3);
    });
  });

  describe('unregisterAll', () => {
    it('should unregister all plugins', async () => {
      await loader.register({ name: 'plugin1', version: '1.0.0' });
      await loader.register({ name: 'plugin2', version: '1.0.0' });

      await loader.unregisterAll();

      expect(loader.getPlugins()).toHaveLength(0);
    });
  });

  describe('shutdown', () => {
    it('should shutdown all plugins', async () => {
      let shutdownCount = 0;
      await loader.register({
        name: 'plugin1',
        version: '1.0.0',
        shutdown: async () => {
          shutdownCount++;
        },
      });
      await loader.register({
        name: 'plugin2',
        version: '1.0.0',
        shutdown: async () => {
          shutdownCount++;
        },
      });

      await loader.shutdown();

      expect(shutdownCount).toBe(2);
      expect(loader.getPlugins()).toHaveLength(0);
    });
  });
});
