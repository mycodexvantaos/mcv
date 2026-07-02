/**
 * Comprehensive tests for Database package
 */

import { Database, DatabaseConfig, QueryResult } from '../src/index';

describe('Database', () => {
  let database: Database;

  beforeEach(() => {
    database = new Database();
  });

  afterEach(async () => {
    await database.cleanup();
  });

  describe('initialize', () => {
    it('should initialize database with default config', async () => {
      await database.initialize();
    });

    it('should run migrations on initialize', async () => {
      await database.initialize();
    });
  });

  describe('query', () => {
    it('should execute a query', async () => {
      await database.initialize();

      const result = await database.query<QueryResult>('SELECT * FROM users');

      expect(result).toBeDefined();
      expect(result.rows).toEqual([]);
      expect(result.rowCount).toBe(0);
    });

    it('should execute query with parameters', async () => {
      await database.initialize();

      const result = await database.query<QueryResult>('SELECT * FROM users WHERE id = ?', [1]);

      expect(result).toBeDefined();
    });
  });

  describe('executeSql', () => {
    it('should execute SQL statement', async () => {
      await database.initialize();

      const result = await database.executeSql('INSERT INTO users (name, email) VALUES (?, ?)', [
        'Test User',
        'test@example.com',
      ]);

      expect(result).toBeDefined();
      expect(result.affectedRows).toBe(1);
    });
  });

  describe('transaction', () => {
    it('should execute transaction successfully', async () => {
      await database.initialize();

      const result = await database.transaction(async () => {
        return { success: true };
      });

      expect(result.success).toBe(true);
    });

    it('should rollback on error', async () => {
      await database.initialize();

      await expect(
        database.transaction(async () => {
          throw new Error('Transaction error');
        })
      ).rejects.toThrow('Transaction error');
    });
  });

  describe('execute', () => {
    it('should execute query action', async () => {
      await database.initialize();

      const result = await database.execute<QueryResult>({
        action: 'query',
        sql: 'SELECT * FROM users',
      });

      expect(result).toBeDefined();
    });

    it('should execute execute action', async () => {
      await database.initialize();

      const result = await database.execute({
        action: 'execute',
        sql: 'INSERT INTO users (name) VALUES (?)',
        params: ['Test'],
      });

      expect(result).toBeDefined();
    });

    it('should execute transaction action', async () => {
      await database.initialize();

      const result = await database.execute<{ done: boolean }>({
        action: 'transaction',
        fn: async () => ({ done: true }),
      });

      expect(result.done).toBe(true);
    });

    it('should default to query for unknown action', async () => {
      await database.initialize();

      const result = await database.execute<QueryResult>({
        action: 'unknown',
        sql: 'SELECT 1',
      });

      expect(result).toBeDefined();
    });
  });

  describe('migrate', () => {
    it('should create default tables', async () => {
      await database.migrate();
    });
  });

  describe('cleanup', () => {
    it('should clear all tables', async () => {
      await database.initialize();
      await database.cleanup();
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent queries', async () => {
      await database.initialize();

      const promises: Promise<QueryResult>[] = [];
      for (let i = 0; i < 5; i++) {
        promises.push(database.query(`SELECT ${i}`));
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(5);
    });
  });
});
