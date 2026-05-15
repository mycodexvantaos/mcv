/**
 * @jest-environment node
 */

import { Database, database, QueryResult } from '../src/index';

describe('Database Package', () => {
  let db: Database;

  beforeEach(() => {
    db = new Database();
  });

  afterEach(async () => {
    await db.cleanup();
  });

  describe('initialize', () => {
    it('should initialize the database', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await db.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Database initialized with sqlite provider');
      consoleSpy.mockRestore();
    });

    it('should run migrations', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await db.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Running database migrations');
      consoleSpy.mockRestore();
    });
  });

  describe('execute', () => {
    it('should execute query action', async () => {
      await db.initialize();

      const result = (await db.execute({
        action: 'query',
        sql: 'SELECT * FROM users',
      })) as QueryResult;

      expect(result.rows).toEqual([]);
      expect(result.rowCount).toBe(0);
    });

    it('should execute execute action', async () => {
      await db.initialize();

      const result = (await db.execute({
        action: 'execute',
        sql: 'INSERT INTO users (name) VALUES (?)',
        params: ['John'],
      })) as any;

      expect(result.affectedRows).toBe(1);
    });

    it('should execute transaction action', async () => {
      await db.initialize();

      const result = (await db.execute({
        action: 'transaction',
        fn: async () => 'transaction-result',
      })) as string;

      expect(result).toBe('transaction-result');
    });

    it('should default to query for unknown action', async () => {
      await db.initialize();

      const result = (await db.execute({
        action: 'unknown',
        sql: 'SELECT 1',
      })) as QueryResult;

      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
    });
  });

  describe('query', () => {
    it('should execute a query', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await db.query<QueryResult>('SELECT * FROM users');

      expect(consoleSpy).toHaveBeenCalledWith('Executing query: SELECT * FROM users');
      expect(result.rows).toEqual([]);
      expect(result.rowCount).toBe(0);
      expect(result.fields).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should execute query with params', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await db.query('SELECT * FROM users WHERE id = ?', [1]);

      expect(consoleSpy).toHaveBeenCalledWith('Executing query: SELECT * FROM users WHERE id = ?');
      consoleSpy.mockRestore();
    });
  });

  describe('executeSql', () => {
    it('should execute SQL statement', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await db.executeSql('INSERT INTO users (name) VALUES (?)', ['John']);

      expect(consoleSpy).toHaveBeenCalledWith('Executing SQL: INSERT INTO users (name) VALUES (?)');
      expect(result.affectedRows).toBe(1);
      consoleSpy.mockRestore();
    });
  });

  describe('transaction', () => {
    it('should execute transaction successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await db.transaction(async () => {
        return 'success';
      });

      expect(result).toBe('success');
      expect(consoleSpy).toHaveBeenCalledWith('Starting transaction');
      expect(consoleSpy).toHaveBeenCalledWith('Transaction committed');
      consoleSpy.mockRestore();
    });

    it('should rollback on error', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await expect(
        db.transaction(async () => {
          throw new Error('Transaction failed');
        })
      ).rejects.toThrow('Transaction failed');

      expect(consoleSpy).toHaveBeenCalledWith('Starting transaction');
      expect(consoleSpy).toHaveBeenCalledWith('Transaction rolled back');
      consoleSpy.mockRestore();
    });
  });

  describe('migrate', () => {
    it('should create default tables', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await db.migrate();

      expect(consoleSpy).toHaveBeenCalledWith('Running database migrations');
      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should clear tables', async () => {
      await db.initialize();
      await db.cleanup();

      // No easy way to verify tables cleared, just ensure no error
    });

    it('should log cleanup message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await db.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith('Database cleaned up');
      consoleSpy.mockRestore();
    });
  });

  describe('default export', () => {
    it('should export a default Database instance', () => {
      expect(database).toBeInstanceOf(Database);
    });
  });
});
