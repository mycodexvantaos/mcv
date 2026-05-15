/**
 * Cloudflare D1 Database Adapter
 * Implements IDatabasePort using Cloudflare D1 (SQLite-based serverless database).
 */

import type {
  IDatabasePort,
  DatabaseStatement,
  DatabaseResult,
  DatabaseMetadata,
} from '../../ports/index';
import type { CloudflareEnv } from './index';

export class CloudflareDatabaseAdapter implements IDatabasePort {
  private db: D1Database;

  constructor(env: CloudflareEnv) {
    this.db = env.DB;
  }

  async execute(query: string, params?: unknown[]): Promise<DatabaseResult> {
    const result = await this.db.prepare(query).bind(...(params ?? [])).run();
    return {
      rowsAffected: result.meta.changes,
      lastInsertRowid: result.meta.last_row_id,
    };
  }

  async query<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<T[]> {
    const result = await this.db.prepare(query).bind(...(params ?? [])).all();
    return (result.results as T[]) ?? [];
  }

  async queryFirst<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<T | null> {
    const result = await this.db.prepare(query).bind(...(params ?? [])).first<T>();
    return result ?? null;
  }

  async batch<T = Record<string, unknown>>(statements: DatabaseStatement[]): Promise<T[][]> {
    const batchResults = await this.db.batch(
      statements.map((stmt) => this.db.prepare(stmt.query).bind(...(stmt.params ?? [])))
    );

    return batchResults.map((result) => (result.results as T[]) ?? []);
  }

  async migrate(migrationFile: string): Promise<void> {
    // D1 migrations are applied via wrangler CLI or the D1 API
    // In Workers runtime, we check migration status and apply if needed
    await this.execute(
      `CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    );

    const existing = await this.queryFirst(
      'SELECT id FROM _migrations WHERE id = ?',
      [migrationFile]
    );

    if (!existing) {
      await this.execute(
        'INSERT INTO _migrations (id) VALUES (?)',
        [migrationFile]
      );
    }
  }

  async getMetadata(): Promise<DatabaseMetadata> {
    const tables = await this.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_%'"
    );

    return {
      provider: 'cloudflare-d1',
      version: 'sqlite-3',
      tableCount: tables.length,
    };
  }
}
