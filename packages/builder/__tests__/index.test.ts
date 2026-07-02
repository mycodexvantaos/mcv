/**
 * @jest-environment node
 */

import { Builder, builder } from '../src/index';
import * as fs from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

describe('Builder Package', () => {
  let b: Builder;

  beforeEach(() => {
    b = new Builder();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await b.cleanup();
  });

  describe('initialize', () => {
    it('should initialize the builder', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await b.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Builder initialized');
      consoleSpy.mockRestore();
    });

    it('should create output directory', async () => {
      await b.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith('./generated-apps', { recursive: true });
    });

    it('should create templates directory', async () => {
      await b.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith('./templates', { recursive: true });
    });
  });

  describe('execute', () => {
    it('should generate a frontend application', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-app',
        type: 'frontend',
      });

      expect(result.application).toBeDefined();
      expect(result.application.name).toBe('test-app');
      expect(result.application.type).toBe('frontend');
      expect(result.schema).toBeDefined();
      expect(result.api).toBeUndefined();
      expect(result.buildTime).toBeGreaterThanOrEqual(0);
    });

    it('should generate a backend application', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-backend',
        type: 'backend',
      });

      expect(result.application.type).toBe('backend');
    });

    it('should generate a fullstack application with API', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-fullstack',
        type: 'fullstack',
      });

      expect(result.application.type).toBe('fullstack');
      expect(result.api).toBeDefined();
      expect(result.api.endpoints).toHaveLength(3);
    });

    it('should generate an API-only application', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-api',
        type: 'api',
      });

      expect(result.application.type).toBe('api');
      expect(result.api).toBeDefined();
    });

    it('should throw error when name is missing', async () => {
      await b.initialize();

      await expect(b.execute({ type: 'frontend' } as any)).rejects.toThrow(
        'Invalid build configuration: name and type are required'
      );
    });

    it('should throw error when type is missing', async () => {
      await b.initialize();

      await expect(b.execute({ name: 'test-app' } as any)).rejects.toThrow(
        'Invalid build configuration: name and type are required'
      );
    });

    it('should use default language when not specified', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-app',
        type: 'frontend',
      });

      expect(result.application.language).toBe('typescript');
    });

    it('should use custom language when specified', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-app',
        type: 'frontend',
        language: 'python',
      });

      expect(result.application.language).toBe('python');
    });

    it('should use default framework when not specified', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-app',
        type: 'frontend',
      });

      expect(result.application.framework).toBe('custom');
    });

    it('should use custom framework when specified', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-app',
        type: 'frontend',
        framework: 'react',
      });

      expect(result.application.framework).toBe('react');
    });

    it('should include features when specified', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-app',
        type: 'frontend',
        features: ['auth', 'logging', 'cache'],
      });

      expect(result.application.features).toEqual(['auth', 'logging', 'cache']);
    });

    it('should default to empty features when not specified', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-app',
        type: 'frontend',
      });

      expect(result.application.features).toEqual([]);
    });

    it('should generate unique application IDs', async () => {
      await b.initialize();

      const result1 = await b.execute({
        name: 'test-app',
        type: 'frontend',
      });

      // Wait a bit for different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = await b.execute({
        name: 'test-app',
        type: 'frontend',
      });

      expect(result1.application.id).not.toBe(result2.application.id);
    });

    it('should generate schema with correct structure', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-app',
        type: 'frontend',
      });

      expect(result.schema.id).toBe('urn:mycodexvantaos:schema:test-app');
      expect(result.schema.version).toBe('1.0.0');
      expect(result.schema.entities).toBeDefined();
      expect(result.schema.entities[0].name).toBe('User');
      expect(result.schema.entities[0].fields).toHaveLength(3);
    });

    it('should generate API with correct structure', async () => {
      await b.initialize();

      const result = await b.execute({
        name: 'test-app',
        type: 'fullstack',
      });

      expect(result.api.id).toBe('urn:mycodexvantaos:api:test-app');
      expect(result.api.authentication).toBe('bearer');
      expect(result.api.endpoints).toBeDefined();
    });

    it('should include createdAt timestamp', async () => {
      await b.initialize();

      const before = new Date().toISOString();
      const result = await b.execute({
        name: 'test-app',
        type: 'frontend',
      });

      expect(result.application.createdAt).toBeDefined();
      // Should be a valid ISO date string
      expect(new Date(result.application.createdAt).toISOString()).toBe(
        result.application.createdAt
      );
    });
  });

  describe('cleanup', () => {
    it('should log cleanup message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await b.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith('Builder cleaned up');
      consoleSpy.mockRestore();
    });
  });

  describe('default export', () => {
    it('should export a default Builder instance', () => {
      expect(builder).toBeInstanceOf(Builder);
    });
  });
});
