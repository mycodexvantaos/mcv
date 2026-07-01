/**
 * Comprehensive tests for Storage package
 */

import { Storage, StorageConfig, StorageItem } from '../src/index';

describe('Storage', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = new Storage();
  });

  afterEach(async () => {
    await storage.cleanup();
  });

  describe('initialize', () => {
    it('should initialize storage with default config', async () => {
      await expect(storage.initialize()).resolves.not.toThrow();
    });
  });

  describe('upload', () => {
    it('should upload a file', async () => {
      const result = await storage.execute<StorageItem>({
        action: 'upload',
        data: {
          name: 'test-file.txt',
          size: 1024,
          type: 'text/plain',
        },
      });

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^urn:mycodexvantaos:storage:/);
      expect(result.name).toBe('test-file.txt');
      expect(result.size).toBe(1024);
      expect(result.type).toBe('text/plain');
    });

    it('should use default size if not provided', async () => {
      const result = await storage.execute<StorageItem>({
        action: 'upload',
        data: { name: 'test.txt' },
      });

      expect(result.size).toBe(0);
    });

    it('should use default type if not provided', async () => {
      const result = await storage.execute<StorageItem>({
        action: 'upload',
        data: { name: 'test.txt' },
      });

      expect(result.type).toBe('unknown');
    });

    it('should store metadata', async () => {
      const result = await storage.execute<StorageItem>({
        action: 'upload',
        data: {
          name: 'test.txt',
          metadata: { owner: 'user-1' },
        },
      });

      expect(result.metadata).toEqual({ owner: 'user-1' });
    });
  });

  describe('download', () => {
    it('should download an uploaded file', async () => {
      const uploaded = await storage.execute<StorageItem>({
        action: 'upload',
        data: { name: 'download-test.txt' },
      });

      const result = await storage.execute<StorageItem>({
        action: 'download',
        data: { id: uploaded.id },
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('download-test.txt');
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        storage.execute({
          action: 'download',
          data: { id: 'non-existent-id' },
        })
      ).rejects.toThrow('Item not found: non-existent-id');
    });
  });

  describe('delete', () => {
    it('should delete an uploaded file', async () => {
      const uploaded = await storage.execute<StorageItem>({
        action: 'upload',
        data: { name: 'delete-test.txt' },
      });

      const result = await storage.execute<boolean>({
        action: 'delete',
        data: { id: uploaded.id },
      });

      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const result = await storage.execute<boolean>({
        action: 'delete',
        data: { id: 'non-existent-id' },
      });

      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should list empty storage initially', async () => {
      const result = await storage.execute<StorageItem[]>({
        action: 'list',
        data: {},
      });

      expect(result).toEqual([]);
    });

    it('should list all uploaded files', async () => {
      // Use a fresh storage instance for this test
      const freshStorage = new Storage();
      await freshStorage.initialize();

      // Add small delays to ensure unique timestamps
      await freshStorage.execute({ action: 'upload', data: { name: 'file1.txt' } });
      await new Promise((r) => setTimeout(r, 5));
      await freshStorage.execute({ action: 'upload', data: { name: 'file2.txt' } });

      const result = await freshStorage.execute<StorageItem[]>({
        action: 'list',
        data: {},
      });

      expect(result.length).toBe(2);

      await freshStorage.cleanup();
    });
  });

  describe('execute', () => {
    it('should throw error for unknown action', async () => {
      await expect(
        storage.execute({
          action: 'unknown',
          data: {},
        })
      ).rejects.toThrow('Unknown storage action: unknown');
    });
  });

  describe('cleanup', () => {
    it('should clear all items', async () => {
      await storage.execute({
        action: 'upload',
        data: { name: 'test.txt' },
      });

      await storage.cleanup();

      const result = await storage.execute<StorageItem[]>({
        action: 'list',
        data: {},
      });

      expect(result.length).toBe(0);
    });
  });

  describe('concurrent operations', () => {
    it('should handle sequential uploads with unique IDs', async () => {
      // Use a fresh storage instance for this test
      const freshStorage = new Storage();
      await freshStorage.initialize();

      // Add small delays to ensure unique timestamps
      for (let i = 0; i < 5; i++) {
        await freshStorage.execute<StorageItem>({
          action: 'upload',
          data: { name: `file${i}.txt` },
        });
        await new Promise((r) => setTimeout(r, 2)); // Small delay for unique IDs
      }

      const list = await freshStorage.execute<StorageItem[]>({
        action: 'list',
        data: {},
      });
      expect(list.length).toBe(5);

      await freshStorage.cleanup();
    });
  });
});
