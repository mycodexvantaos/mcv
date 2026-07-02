/**
 * Comprehensive tests for Config Sync package
 */

import { ConfigSync, Configuration } from '../src/index';

describe('ConfigSync', () => {
  let configSync: ConfigSync;

  beforeEach(() => {
    configSync = new ConfigSync();
  });

  afterEach(async () => {
    await configSync.cleanup();
  });

  describe('initialize', () => {
    it('should initialize and load default configuration', async () => {
      await configSync.initialize();

      const configs = await configSync.list();
      expect(configs.length).toBeGreaterThan(0);
    });
  });

  describe('set', () => {
    it('should set a configuration', async () => {
      const config = await configSync.set({
        id: 'test-config',
        values: { key: 'value' },
      });

      expect(config).toBeDefined();
      expect(config.id).toBe('test-config');
      expect(config.values).toEqual({ key: 'value' });
    });

    it('should generate id if not provided', async () => {
      const config = await configSync.set({
        values: { key: 'value' },
      });

      expect(config.id).toMatch(/^urn:mycodexvantaos:config:/);
    });

    it('should use current environment if not provided', async () => {
      const config = await configSync.set({
        values: { key: 'value' },
      });

      expect(config.environment).toBe('development');
    });

    it('should use provided environment', async () => {
      const config = await configSync.set({
        values: { key: 'value' },
        environment: 'production',
      });

      expect(config.environment).toBe('production');
    });

    it('should use default version if not provided', async () => {
      const config = await configSync.set({
        values: { key: 'value' },
      });

      expect(config.version).toBe('1.0.0');
    });

    it('should use provided version', async () => {
      const config = await configSync.set({
        values: { key: 'value' },
        version: '2.0.0',
      });

      expect(config.version).toBe('2.0.0');
    });

    it('should use default source if not provided', async () => {
      const config = await configSync.set({
        values: { key: 'value' },
      });

      expect(config.source).toBe('manual');
    });
  });

  describe('get', () => {
    it('should get configuration by key', async () => {
      await configSync.set({
        id: 'test-config',
        values: { key: 'value' },
      });

      const config = await configSync.get({ key: 'test-config' });

      expect(config).toBeDefined();
      expect(config.id).toBe('test-config');
    });

    it('should get configuration by id', async () => {
      await configSync.set({
        id: 'test-config-id',
        values: { key: 'value' },
      });

      const config = await configSync.get({ id: 'test-config-id' });

      expect(config).toBeDefined();
      expect(config.id).toBe('test-config-id');
    });

    it('should throw error if configuration not found', async () => {
      await expect(configSync.get({ key: 'non-existent' })).rejects.toThrow(
        'Configuration not found: non-existent'
      );
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await configSync.set({ id: 'config-1', environment: 'development', values: {} });
      await configSync.set({ id: 'config-2', environment: 'production', values: {} });
      await configSync.set({ id: 'config-3', environment: 'development', values: {} });
    });

    it('should list all configurations', async () => {
      const configs = await configSync.list();
      expect(configs.length).toBe(3);
    });

    it('should filter by environment', async () => {
      const configs = await configSync.list({ environment: 'development' });
      expect(configs.length).toBe(2);
      expect(configs.every((c) => c.environment === 'development')).toBe(true);
    });
  });

  describe('sync', () => {
    it('should sync configurations', async () => {
      await expect(configSync.sync()).resolves.not.toThrow();
    });

    it('should sync with options', async () => {
      await expect(configSync.sync({ repository: 'test-repo' })).resolves.not.toThrow();
    });
  });

  describe('execute', () => {
    it('should execute get action', async () => {
      await configSync.set({ id: 'exec-test', values: { test: true } });

      const result = await configSync.execute<Configuration>({
        action: 'get',
        data: { key: 'exec-test' },
      });

      expect(result.id).toBe('exec-test');
    });

    it('should execute set action', async () => {
      const result = await configSync.execute<Configuration>({
        action: 'set',
        data: { id: 'exec-set-test', values: { key: 'value' } },
      });

      expect(result.id).toBe('exec-set-test');
    });

    it('should execute sync action', async () => {
      await configSync.execute<void>({
        action: 'sync',
        data: {},
      });
    });

    it('should execute list action', async () => {
      await configSync.set({ id: 'list-test', values: {} });

      const result = await configSync.execute<Configuration[]>({
        action: 'list',
        data: {},
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw error for unknown action', async () => {
      await expect(
        configSync.execute({
          action: 'unknown',
          data: {},
        })
      ).rejects.toThrow('Unknown config sync action: unknown');
    });
  });

  describe('cleanup', () => {
    it('should clear all configurations', async () => {
      await configSync.set({ id: 'cleanup-test', values: {} });

      await configSync.cleanup();

      const configs = await configSync.list();
      expect(configs.length).toBe(0);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent set operations', async () => {
      const promises: Promise<Configuration>[] = [];
      for (let i = 0; i < 5; i++) {
        promises.push(configSync.set({ id: `concurrent-${i}`, values: { index: i } }));
      }

      await Promise.all(promises);

      const configs = await configSync.list();
      expect(configs.length).toBe(5);
    });
  });
});
